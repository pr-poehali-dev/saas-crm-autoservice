"""
CRUD-обработчик для модуля Записи (appointments).
Поддерживает: GET список, GET одна запись, POST создание, PUT обновление.
Мультитенантность через заголовок X-Tenant-Id.
"""

import json
import os
import psycopg2
from datetime import datetime

SCHEMA = "t_p47435488_saas_crm_autoservice"

CORS_HEADERS = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, X-Tenant-Id, X-User-Id",
    "Content-Type": "application/json",
}

STATUS_LABELS = {
    "new": "Новая",
    "active": "В работе",
    "wait": "Ожидание",
    "done": "Выполнено",
    "cancel": "Отменено",
}


def get_conn():
    return psycopg2.connect(os.environ["DATABASE_URL"])


def json_serial(obj):
    if isinstance(obj, datetime):
        return obj.isoformat()
    raise TypeError(f"Type {type(obj)} not serializable")


def resp(status: int, body: dict) -> dict:
    return {
        "statusCode": status,
        "headers": CORS_HEADERS,
        "body": json.dumps(body, default=json_serial, ensure_ascii=False),
    }


def handler(event: dict, context) -> dict:
    if event.get("httpMethod") == "OPTIONS":
        return {"statusCode": 200, "headers": CORS_HEADERS, "body": ""}

    method = event.get("httpMethod", "GET")
    params = event.get("queryStringParameters") or {}
    headers = event.get("headers") or {}
    tenant_id = headers.get("X-Tenant-Id") or params.get("tenant_id")

    if not tenant_id:
        return resp(400, {"error": "Заголовок X-Tenant-Id обязателен"})

    path_params = (event.get("pathParameters") or {})
    appointment_id = path_params.get("id") or params.get("id")

    conn = get_conn()
    cur = conn.cursor()

    try:
        if method == "GET":
            if appointment_id:
                return get_one(cur, tenant_id, appointment_id)
            return get_list(cur, tenant_id, params)

        elif method == "POST":
            body = json.loads(event.get("body") or "{}")
            return create(cur, conn, tenant_id, body)

        elif method == "PUT":
            if not appointment_id:
                return resp(400, {"error": "Не указан id записи"})
            body = json.loads(event.get("body") or "{}")
            return update(cur, conn, tenant_id, appointment_id, body)

        else:
            return resp(405, {"error": "Метод не поддерживается"})

    except Exception as e:
        conn.rollback()
        return resp(500, {"error": str(e)})
    finally:
        cur.close()
        conn.close()


def get_list(cur, tenant_id: str, params: dict) -> dict:
    status_filter = params.get("status")
    search = params.get("search", "").strip()
    limit = min(int(params.get("limit", 50)), 200)
    offset = int(params.get("offset", 0))

    where = [f"a.tenant_id = '{tenant_id}'"]
    if status_filter:
        where.append(f"a.status = '{status_filter}'")
    if search:
        safe = search.replace("'", "''")
        where.append(
            f"(cp.full_name ILIKE '%{safe}%' OR a.number ILIKE '%{safe}%' "
            f"OR cc.brand ILIKE '%{safe}%' OR cc.model ILIKE '%{safe}%' OR cc.plate ILIKE '%{safe}%')"
        )

    where_sql = "WHERE " + " AND ".join(where)

    cur.execute(f"""
        SELECT
            a.id, a.number, a.status, a.scheduled_at,
            a.mileage, a.complaint, a.created_at,
            cp.full_name AS client_name, cp.phone AS client_phone,
            cc.brand AS car_brand, cc.model AS car_model,
            cc.plate AS car_plate, cc.year AS car_year,
            tu.full_name AS assigned_name
        FROM {SCHEMA}.appointments a
        LEFT JOIN {SCHEMA}.counterparties cp ON cp.id = a.counterparty_id
        LEFT JOIN {SCHEMA}.counterparty_cars cc ON cc.id = a.car_id
        LEFT JOIN {SCHEMA}.tenant_users tu ON tu.id = a.assigned_to
        {where_sql}
        ORDER BY a.scheduled_at DESC NULLS LAST, a.created_at DESC
        LIMIT {limit} OFFSET {offset}
    """)
    cols = [d[0] for d in cur.description]
    rows = [dict(zip(cols, row)) for row in cur.fetchall()]

    cur.execute(f"""
        SELECT COUNT(*) FROM {SCHEMA}.appointments a
        LEFT JOIN {SCHEMA}.counterparties cp ON cp.id = a.counterparty_id
        LEFT JOIN {SCHEMA}.counterparty_cars cc ON cc.id = a.car_id
        {where_sql}
    """)
    total = cur.fetchone()[0]

    return resp(200, {"items": rows, "total": total, "limit": limit, "offset": offset})


def get_one(cur, tenant_id: str, appointment_id: str) -> dict:
    cur.execute(f"""
        SELECT
            a.*,
            cp.full_name AS client_name, cp.phone AS client_phone, cp.email AS client_email,
            cc.brand AS car_brand, cc.model AS car_model,
            cc.plate AS car_plate, cc.year AS car_year, cc.vin AS car_vin,
            tu.full_name AS assigned_name
        FROM {SCHEMA}.appointments a
        LEFT JOIN {SCHEMA}.counterparties cp ON cp.id = a.counterparty_id
        LEFT JOIN {SCHEMA}.counterparty_cars cc ON cc.id = a.car_id
        LEFT JOIN {SCHEMA}.tenant_users tu ON tu.id = a.assigned_to
        WHERE a.id = '{appointment_id}' AND a.tenant_id = '{tenant_id}'
    """)
    if not cur.rowcount and cur.fetchone() is None:
        pass
    cols = [d[0] for d in cur.description]
    row = cur.fetchone()
    if not row:
        return resp(404, {"error": "Запись не найдена"})

    appt = dict(zip(cols, row))

    # Услуги
    cur.execute(f"""
        SELECT s.id, s.name, s.quantity, s.price, s.discount, s.amount, s.service_id
        FROM {SCHEMA}.appointment_services s
        WHERE s.appointment_id = '{appointment_id}' AND s.tenant_id = '{tenant_id}'
    """)
    cols_s = [d[0] for d in cur.description]
    appt["services"] = [dict(zip(cols_s, r)) for r in cur.fetchall()]

    # Товары
    cur.execute(f"""
        SELECT p.id, p.name, p.quantity, p.price, p.discount, p.amount, p.product_id
        FROM {SCHEMA}.appointment_products p
        WHERE p.appointment_id = '{appointment_id}' AND p.tenant_id = '{tenant_id}'
    """)
    cols_p = [d[0] for d in cur.description]
    appt["products"] = [dict(zip(cols_p, r)) for r in cur.fetchall()]

    return resp(200, appt)


def create(cur, conn, tenant_id: str, body: dict) -> dict:
    # Генерируем номер записи
    cur.execute(f"""
        SELECT COUNT(*) + 1 FROM {SCHEMA}.appointments WHERE tenant_id = '{tenant_id}'
    """)
    seq = cur.fetchone()[0]
    number = body.get("number") or f"REC-{seq:04d}"

    status = body.get("status", "new")
    counterparty_id = body.get("counterparty_id")
    car_id = body.get("car_id")
    company_id = body.get("company_id")
    assigned_to = body.get("assigned_to")
    scheduled_at = body.get("scheduled_at")
    mileage = body.get("mileage")
    complaint = body.get("complaint", "")
    note = body.get("note", "")

    def v(val):
        if val is None:
            return "NULL"
        return f"'{str(val).replace(chr(39), chr(39)*2)}'"

    cur.execute(f"""
        INSERT INTO {SCHEMA}.appointments
            (tenant_id, number, status, counterparty_id, car_id, company_id,
             assigned_to, scheduled_at, mileage, complaint, note)
        VALUES
            ('{tenant_id}', {v(number)}, {v(status)}, {v(counterparty_id)}, {v(car_id)},
             {v(company_id)}, {v(assigned_to)}, {v(scheduled_at)}, {v(mileage)},
             {v(complaint)}, {v(note)})
        RETURNING id, number, status, created_at
    """)
    row = cur.fetchone()
    conn.commit()
    return resp(201, {"id": str(row[0]), "number": row[1], "status": row[2], "created_at": row[3]})


def update(cur, conn, tenant_id: str, appointment_id: str, body: dict) -> dict:
    allowed = ["status", "scheduled_at", "started_at", "finished_at",
               "mileage", "complaint", "diagnosis", "note",
               "counterparty_id", "car_id", "assigned_to"]

    fields = []
    for key in allowed:
        if key in body:
            val = body[key]
            if val is None:
                fields.append(f"{key} = NULL")
            else:
                safe = str(val).replace("'", "''")
                fields.append(f"{key} = '{safe}'")

    if not fields:
        return resp(400, {"error": "Нет полей для обновления"})

    fields.append("updated_at = NOW()")
    set_sql = ", ".join(fields)

    cur.execute(f"""
        UPDATE {SCHEMA}.appointments
        SET {set_sql}
        WHERE id = '{appointment_id}' AND tenant_id = '{tenant_id}'
        RETURNING id, number, status, updated_at
    """)
    row = cur.fetchone()
    if not row:
        return resp(404, {"error": "Запись не найдена"})
    conn.commit()
    return resp(200, {"id": str(row[0]), "number": row[1], "status": row[2], "updated_at": row[3]})
