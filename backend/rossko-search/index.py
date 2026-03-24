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

ROSSKO_URL = "http://api.rossko.ru/service/v2.1/GetSearch"


def resp(status, body):
    return {"statusCode": status, "headers": CORS_HEADERS, "body": json.dumps(body, ensure_ascii=False)}


def build_soap_request(key1, key2, text, delivery_id="000000002", address_id=""):
    return f"""<?xml version="1.0" encoding="UTF-8"?>
<soap:Envelope xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/" xmlns:ns="http://api.rossko.ru/">
  <soap:Body>
    <ns:GetSearch>
      <ns:KEY1>{key1}</ns:KEY1>
      <ns:KEY2>{key2}</ns:KEY2>
      <ns:text>{text}</ns:text>
      <ns:delivery_id>{delivery_id}</ns:delivery_id>
      <ns:address_id>{address_id}</ns:address_id>
    </ns:GetSearch>
  </soap:Body>
</soap:Envelope>"""


def parse_response(xml_text):
    ns = {"ns": "http://api.rossko.ru/"}
    root = ET.fromstring(xml_text)

    success_el = root.find(".//ns:Success", ns)
    if success_el is None:
        success_el = root.find(".//{http://api.rossko.ru/}Success")
    success = success_el is not None and success_el.text == "true"

    if not success:
        return {"success": False, "parts": []}

    parts = []
    for part in root.iter("{http://api.rossko.ru/}Part"):
        guid = part.findtext("{http://api.rossko.ru/}guid", "")
        brand = part.findtext("{http://api.rossko.ru/}brand", "")
        partnumber = part.findtext("{http://api.rossko.ru/}partnumber", "")
        name = part.findtext("{http://api.rossko.ru/}name", "")

        stocks = []
        for stock in part.iter("{http://api.rossko.ru/}stock"):
            stocks.append({
                "id": stock.findtext("{http://api.rossko.ru/}id", ""),
                "price": stock.findtext("{http://api.rossko.ru/}price", "0"),
                "count": stock.findtext("{http://api.rossko.ru/}count", "0"),
                "delivery": stock.findtext("{http://api.rossko.ru/}delivery", "0"),
                "description": stock.findtext("{http://api.rossko.ru/}description", ""),
            })

        parts.append({
            "guid": guid,
            "brand": brand,
            "partnumber": partnumber,
            "name": name,
            "stocks": stocks,
        })

    return {"success": True, "parts": parts}


def handler(event, context):
    if event.get("httpMethod") == "OPTIONS":
        return {"statusCode": 200, "headers": CORS_HEADERS, "body": ""}

    key1 = os.environ.get("ROSSKO_KEY1", "")
    key2 = os.environ.get("ROSSKO_KEY2", "")

    if not key1 or not key2:
        return resp(500, {"error": "Ключи Rossko не настроены"})

    params = event.get("queryStringParameters") or {}
    body_raw = event.get("body")
    if body_raw:
        try:
            body_data = json.loads(body_raw)
        except Exception:
            body_data = {}
    else:
        body_data = {}

    text = params.get("text") or body_data.get("text", "")
    delivery_id = params.get("delivery_id") or body_data.get("delivery_id", "000000002")
    address_id = params.get("address_id") or body_data.get("address_id", "")

    if not text.strip():
        return resp(400, {"error": "Укажите артикул (параметр text)"})

    soap_xml = build_soap_request(key1, key2, text.strip(), delivery_id, address_id)

    req = urllib.request.Request(
        ROSSKO_URL,
        data=soap_xml.encode("utf-8"),
        headers={"Content-Type": "text/xml; charset=utf-8", "SOAPAction": ""},
    )

    try:
        with urllib.request.urlopen(req, timeout=15) as response:
            response_xml = response.read().decode("utf-8")
    except Exception as e:
        return resp(502, {"error": f"Ошибка соединения с Rossko: {str(e)}"})

    result = parse_response(response_xml)
    return resp(200, result)
