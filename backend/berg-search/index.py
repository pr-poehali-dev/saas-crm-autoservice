"""Прокси для поиска запчастей через REST API Berg.ru."""

import json
import os
import urllib.request
import urllib.parse

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
        body_err = e.read().decode("utf-8", errors="replace") if e.fp else ""
        return resp(502, {"error": f"Berg HTTP {e.code}", "detail": body_err[:500]})
    except Exception as e:
        return resp(502, {"error": f"Ошибка соединения с Berg: {str(e)}"})

    try:
        data = json.loads(raw)
    except Exception:
        return resp(502, {"error": "Некорректный ответ от Berg", "raw": raw[:500]})

    resources = data.get("resources", [])

    parts = []
    for res in resources:
        brand = res.get("brand", {}).get("name", "") if isinstance(res.get("brand"), dict) else str(res.get("brand", ""))
        article = res.get("article", "")
        name = res.get("name", "")

        offers = res.get("offers", [])
        stocks = []
        for offer in offers:
            price = offer.get("price", 0)
            quantity = offer.get("quantity", 0)
            delivery = offer.get("average_period", 0)
            warehouse = offer.get("warehouse", {})
            wh_name = warehouse.get("name", "") if isinstance(warehouse, dict) else str(warehouse)

            stocks.append({
                "id": str(offer.get("id", "")),
                "price": str(price),
                "count": str(quantity),
                "delivery": str(delivery),
                "description": wh_name,
            })

        if article:
            parts.append({
                "guid": str(res.get("id", "")),
                "brand": brand,
                "partnumber": article,
                "name": name,
                "stocks": stocks,
                "supplier": "berg",
            })

    return resp(200, {"success": True, "parts": parts})
