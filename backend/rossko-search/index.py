"""Прокси для поиска запчастей через SOAP API Rossko."""

import json
import os
import urllib.request
import xml.etree.ElementTree as ET

CORS_HEADERS = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, X-Tenant-Id",
    "Content-Type": "application/json",
}

NS = "http://api.rossko.ru/"
SEARCH_WSDL = "http://api.rossko.ru/service/v2.1/GetSearch"
CHECKOUT_WSDL = "http://api.rossko.ru/service/v2.1/GetCheckoutDetails"

cached_delivery = {"delivery_id": "", "address_id": ""}


def resp(status, body):
    return {"statusCode": status, "headers": CORS_HEADERS, "body": json.dumps(body, ensure_ascii=False)}


def soap_call(url, method, params_xml):
    soap = f"""<?xml version="1.0" encoding="UTF-8"?>
<SOAP-ENV:Envelope xmlns:SOAP-ENV="http://schemas.xmlsoap.org/soap/envelope/" xmlns:ns1="{NS}">
  <SOAP-ENV:Body>
    <ns1:{method}>
{params_xml}
    </ns1:{method}>
  </SOAP-ENV:Body>
</SOAP-ENV:Envelope>"""

    req = urllib.request.Request(
        url,
        data=soap.encode("utf-8"),
        headers={
            "Content-Type": "text/xml; charset=utf-8",
            "SOAPAction": f"{NS}{method}",
        },
    )
    with urllib.request.urlopen(req, timeout=15) as response:
        return response.read().decode("utf-8")


def get_checkout_details(key1, key2):
    params = f"""      <ns1:KEY1>{key1}</ns1:KEY1>
      <ns1:KEY2>{key2}</ns1:KEY2>"""

    xml_text = soap_call(CHECKOUT_WSDL, "GetCheckoutDetails", params)

    root = ET.fromstring(xml_text)

    delivery_id = ""
    address_id = ""

    for delivery in root.iter(f"{{{NS}}}delivery"):
        did = delivery.findtext(f"{{{NS}}}id", "")
        if did:
            delivery_id = did
            for addr in delivery.iter(f"{{{NS}}}address"):
                aid = addr.findtext(f"{{{NS}}}id", "")
                if aid:
                    address_id = aid
                    break
            if address_id:
                break

    if not delivery_id:
        for el in root.iter(f"{{{NS}}}Delivery"):
            for d in el.iter(f"{{{NS}}}delivery"):
                did = d.findtext(f"{{{NS}}}id", "")
                if did:
                    delivery_id = did
                    break
            if delivery_id:
                break

    if not address_id:
        for el in root.iter(f"{{{NS}}}Address"):
            for a in el.iter(f"{{{NS}}}address"):
                aid = a.findtext(f"{{{NS}}}id", "")
                if aid:
                    address_id = aid
                    break
            if address_id:
                break

    return delivery_id, address_id, xml_text


def search_parts(key1, key2, text, delivery_id, address_id):
    params = f"""      <ns1:KEY1>{key1}</ns1:KEY1>
      <ns1:KEY2>{key2}</ns1:KEY2>
      <ns1:text>{text}</ns1:text>
      <ns1:delivery_id>{delivery_id}</ns1:delivery_id>
      <ns1:address_id>{address_id}</ns1:address_id>"""

    xml_text = soap_call(SEARCH_WSDL, "GetSearch", params)
    return xml_text


def parse_search(xml_text):
    root = ET.fromstring(xml_text)

    success_el = root.find(f".//{{{NS}}}success")
    success = success_el is not None and success_el.text and success_el.text.lower() == "true"

    message_el = root.find(f".//{{{NS}}}message")
    message = message_el.text if message_el is not None and message_el.text else ""

    if not success:
        return {"success": False, "parts": [], "message": message}

    parts = []
    for part in root.iter(f"{{{NS}}}Part"):
        guid = part.findtext(f"{{{NS}}}guid", "")
        brand = part.findtext(f"{{{NS}}}brand", "")
        partnumber = part.findtext(f"{{{NS}}}partnumber", "")
        name = part.findtext(f"{{{NS}}}name", "")

        stocks = []
        for stock in part.iter(f"{{{NS}}}stock"):
            sid = stock.findtext(f"{{{NS}}}id", "")
            if not sid:
                continue
            stocks.append({
                "id": sid,
                "price": stock.findtext(f"{{{NS}}}price", "0"),
                "count": stock.findtext(f"{{{NS}}}count", "0"),
                "delivery": stock.findtext(f"{{{NS}}}delivery", "0"),
                "description": stock.findtext(f"{{{NS}}}description", ""),
            })

        if guid or partnumber:
            parts.append({
                "guid": guid,
                "brand": brand,
                "partnumber": partnumber,
                "name": name,
                "stocks": stocks,
            })

    return {"success": True, "parts": parts}


def handler(event, context):
    """Поиск запчастей у поставщика Rossko по артикулу."""

    if event.get("httpMethod") == "OPTIONS":
        return {"statusCode": 200, "headers": CORS_HEADERS, "body": ""}

    key1 = os.environ.get("ROSSKO_KEY1", "").strip()
    key2 = os.environ.get("ROSSKO_KEY2", "").strip()

    if not key1 or not key2:
        return resp(500, {"error": "Ключи Rossko не настроены"})

    params = event.get("queryStringParameters") or {}
    body_raw = event.get("body")
    body_data = {}
    if body_raw:
        try:
            body_data = json.loads(body_raw)
        except Exception:
            pass

    text = (params.get("text") or body_data.get("text", "")).strip()
    delivery_id = params.get("delivery_id") or body_data.get("delivery_id", "")
    address_id = params.get("address_id") or body_data.get("address_id", "")

    if not text:
        return resp(400, {"error": "Укажите артикул (параметр text)"})

    checkout_xml = ""
    if not delivery_id or not address_id:
        if cached_delivery["delivery_id"] and cached_delivery["address_id"]:
            delivery_id = cached_delivery["delivery_id"]
            address_id = cached_delivery["address_id"]
        else:
            try:
                delivery_id, address_id, checkout_xml = get_checkout_details(key1, key2)
                if delivery_id and address_id:
                    cached_delivery["delivery_id"] = delivery_id
                    cached_delivery["address_id"] = address_id
            except Exception as e:
                checkout_xml = f"error: {str(e)}"

    if not delivery_id or not address_id:
        return resp(200, {
            "success": False,
            "parts": [],
            "message": "Не удалось получить параметры доставки из Rossko",
            "debug_checkout": checkout_xml[:3000],
        })

    try:
        search_xml = search_parts(key1, key2, text, delivery_id, address_id)
    except Exception as e:
        return resp(502, {"error": f"Ошибка соединения с Rossko: {str(e)}"})

    result = parse_search(search_xml)
    result["debug_delivery_id"] = delivery_id
    result["debug_address_id"] = address_id
    if checkout_xml:
        result["debug_checkout"] = checkout_xml[:3000]
    return resp(200, result)
