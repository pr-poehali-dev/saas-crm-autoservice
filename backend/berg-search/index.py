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


def berg_fetch(api_key, text, brand_id="", analogs="0"):
    """Запрос к API Berg. Возвращает (status_code, body_str)."""
    p = {"key": api_key, "items[0][resource_article]": text, "analogs": analogs}
    if brand_id:
        p["items[0][brand_id]"] = str(brand_id)
    url = f"{BERG_URL}?{urllib.parse.urlencode(p)}"
    req = urllib.request.Request(url, headers={"Accept": "application/json"})
    try:
        with urllib.request.urlopen(req, timeout=15) as response:
            return 200, response.read().decode("utf-8")
    except urllib.error.HTTPError as e:
        body = ""
        try:
            body = e.read().decode("utf-8", errors="replace")
        except Exception:
            pass
        return e.code, body


def parse_brands(body):
    """Парсим список брендов из 300 ответа."""
    data = json.loads(body)
    brands = []
    for r in data.get("resources", []):
        b = r.get("brand", {})
        if isinstance(b, dict) and b.get("name"):
            brands.append({
                "id": str(b.get("id", "")),
                "name": b["name"],
                "article": r.get("article", ""),
                "description": r.get("name", ""),
            })
    return brands


def parse_offers(body):
    """Парсим resources с offers."""
    data = json.loads(body)
    parts = []
    for res_item in data.get("resources", []):
        if not isinstance(res_item, dict):
            continue
        brand_raw = res_item.get("brand", "")
        brand = brand_raw.get("name", "") if isinstance(brand_raw, dict) else str(brand_raw)
        brand_id = brand_raw.get("id", "") if isinstance(brand_raw, dict) else ""
        article = str(res_item.get("article", ""))
        name = str(res_item.get("name", ""))

        stocks = []
        for o in (res_item.get("offers") or []):
            if not isinstance(o, dict):
                continue
            wh = o.get("warehouse", {})
            wh_name = wh.get("name", "") if isinstance(wh, dict) else str(wh or "")
            stocks.append({
                "id": str(o.get("id", "")),
                "price": str(o.get("price", 0)),
                "count": str(o.get("quantity", 0)),
                "delivery": str(o.get("average_period", 0)),
                "description": wh_name,
            })
        if article:
            parts.append({
                "guid": str(brand_id),
                "brand": brand,
                "partnumber": article,
                "name": name,
                "stocks": stocks,
                "supplier": "berg",
            })
    return parts


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
    brand_id = params.get("brand_id") or body_data.get("brand_id", "")
    brands_only = params.get("brands_only") or body_data.get("brands_only", "")

    if not text:
        return resp(400, {"error": "Укажите артикул (параметр text)"})

    try:
        code, body = berg_fetch(api_key, text, brand_id)

        if code == 200:
            parts = parse_offers(body)
            return resp(200, {"success": True, "parts": parts})

        if code == 300:
            brands = parse_brands(body)

            if brands_only == "1":
                return resp(200, {"success": True, "parts": [], "brands": brands})

            if brand_id:
                matched = [b for b in brands if str(b["id"]) == str(brand_id)]
                if not matched:
                    return resp(200, {"success": True, "parts": [], "brands": brands})

            target_brands = brands
            if brand_id:
                target_brands = [b for b in brands if str(b["id"]) == str(brand_id)]
            if not target_brands:
                target_brands = brands[:5]

            all_parts = []
            for br in target_brands[:5]:
                c2, b2 = berg_fetch(api_key, text, br["id"])
                if c2 == 200:
                    all_parts.extend(parse_offers(b2))
                else:
                    all_parts.append({
                        "guid": br["id"],
                        "brand": br["name"],
                        "partnumber": br.get("article", text),
                        "name": br.get("description", ""),
                        "stocks": [],
                        "supplier": "berg",
                    })

            return resp(200, {"success": True, "parts": all_parts, "brands": brands})

        return resp(200, {"success": False, "parts": [], "error": f"Berg HTTP {code}"})

    except Exception as e:
        return resp(200, {"success": False, "parts": [], "error": str(e)})
