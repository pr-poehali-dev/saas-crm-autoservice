"""Прокси для поиска запчастей через REST API Berg.ru."""

import json
import os
import urllib.request
import urllib.parse
import urllib.error

CORS_HEADERS = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, X-Tenant-Id",
    "Content-Type": "application/json",
}

BERG_URL = "https://api.berg.ru/ordering/get_stock.json"


def resp(status, body):
    return {"statusCode": status, "headers": CORS_HEADERS, "body": json.dumps(body, ensure_ascii=False)}


def handler(event, context):
    """Поиск запчастей у поставщика Berg.ru по артикулу."""

    if event.get("httpMethod") == "OPTIONS":
        return {"statusCode": 200, "headers": CORS_HEADERS, "body": ""}

    api_key = os.environ.get("BERG_API_KEY", "").strip()

    if not api_key:
        return resp(500, {"error": "API-ключ Berg не настроен"})

    params = event.get("queryStringParameters") or {}
    body_raw = event.get("body")
    body_data = {}
    if body_raw:
        try:
            body_data = json.loads(body_raw)
        except Exception:
            pass

    text = (params.get("text") or body_data.get("text", "")).strip()

    if not text:
        return resp(400, {"error": "Укажите артикул (параметр text)"})

    try:
        qs = urllib.parse.urlencode({
            "key": api_key,
            "items[0][resource_article]": text,
            "analogs": "1",
        })

        url = f"{BERG_URL}?{qs}"
        req = urllib.request.Request(url, headers={"Accept": "application/json"})

        try:
            with urllib.request.urlopen(req, timeout=15) as response:
                raw = response.read().decode("utf-8")
        except urllib.error.HTTPError as e:
            err_body = ""
            try:
                err_body = e.read().decode("utf-8", errors="replace")
            except Exception:
                pass

            if e.code == 300 and err_body:
                try:
                    ambig = json.loads(err_body)
                    all_parts = []
                    for r in ambig.get("resources", []):
                        b = r.get("brand", {})
                        brand_name = b.get("name", "") if isinstance(b, dict) else str(b)
                        brand_id = b.get("id", "") if isinstance(b, dict) else ""
                        art = r.get("article", text)
                        name = r.get("name", "")

                        try:
                            qs2 = urllib.parse.urlencode({
                                "key": api_key,
                                "items[0][resource_article]": art,
                                "items[0][brand_id]": str(brand_id),
                                "analogs": "0",
                            })
                            req2 = urllib.request.Request(f"{BERG_URL}?{qs2}", headers={"Accept": "application/json"})
                            with urllib.request.urlopen(req2, timeout=10) as resp2:
                                raw2 = resp2.read().decode("utf-8")
                            data2 = json.loads(raw2)
                            offers = []
                            for res2 in data2.get("resources", []):
                                for o in (res2.get("offers") or []):
                                    if isinstance(o, dict):
                                        offers.append(o)
                            stocks = []
                            for o in offers:
                                wh = o.get("warehouse", {})
                                wh_name = wh.get("name", "") if isinstance(wh, dict) else str(wh or "")
                                stocks.append({
                                    "id": str(o.get("id", "")),
                                    "price": str(o.get("price", 0)),
                                    "count": str(o.get("quantity", 0)),
                                    "delivery": str(o.get("average_period", 0)),
                                    "description": wh_name,
                                })
                            all_parts.append({
                                "guid": str(brand_id),
                                "brand": brand_name,
                                "partnumber": art,
                                "name": name,
                                "stocks": stocks,
                                "supplier": "berg",
                            })
                        except Exception:
                            all_parts.append({
                                "guid": str(brand_id),
                                "brand": brand_name,
                                "partnumber": art,
                                "name": name,
                                "stocks": [],
                                "supplier": "berg",
                            })

                    return resp(200, {"success": True, "parts": all_parts})
                except Exception as ex:
                    return resp(200, {"success": False, "parts": [], "error": f"Ошибка разбора 300: {str(ex)}"})

            return resp(200, {"success": False, "parts": [], "error": f"Berg HTTP {e.code}", "debug": err_body[:500]})
        except Exception as e:
            return resp(200, {"success": False, "parts": [], "error": f"Ошибка соединения: {str(e)}"})

        try:
            data = json.loads(raw)
        except Exception:
            return resp(200, {"success": False, "parts": [], "error": "Некорректный JSON", "debug": raw[:500]})

        parts = []

        resources = []
        if isinstance(data, dict):
            resources = data.get("resources", [])
            if not resources and "items" in data:
                resources = data.get("items", [])

        if isinstance(data, list):
            resources = data

        for res_item in resources:
            if not isinstance(res_item, dict):
                continue

            brand_raw = res_item.get("brand", "")
            if isinstance(brand_raw, dict):
                brand = brand_raw.get("name", "")
            else:
                brand = str(brand_raw)

            article = str(res_item.get("article", res_item.get("resource_article", "")))
            name = str(res_item.get("name", res_item.get("description", "")))

            offers = res_item.get("offers", [])
            if not isinstance(offers, list):
                offers = []

            stocks = []
            for offer in offers:
                if not isinstance(offer, dict):
                    continue
                price = offer.get("price", 0)
                quantity = offer.get("quantity", offer.get("count", 0))
                delivery = offer.get("average_period", offer.get("delivery_period", offer.get("delivery", 0)))
                warehouse = offer.get("warehouse", {})
                if isinstance(warehouse, dict):
                    wh_name = warehouse.get("name", warehouse.get("title", ""))
                else:
                    wh_name = str(warehouse) if warehouse else ""

                stocks.append({
                    "id": str(offer.get("id", offer.get("offer_id", ""))),
                    "price": str(price),
                    "count": str(quantity),
                    "delivery": str(delivery),
                    "description": wh_name,
                })

            if article:
                parts.append({
                    "guid": str(res_item.get("id", res_item.get("resource_id", ""))),
                    "brand": brand,
                    "partnumber": article,
                    "name": name,
                    "stocks": stocks,
                    "supplier": "berg",
                })

        return resp(200, {"success": True, "parts": parts, "debug_raw": raw[:1000] if not parts else ""})

    except Exception as e:
        return resp(200, {"success": False, "parts": [], "error": str(e)})