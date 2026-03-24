/**
 * CRUD-обработчик для модуля Записи (appointments). TypeScript v2.
 * Поддерживает: GET список, GET одна запись, POST создание, PUT обновление.
 * Мультитенантность через заголовок X-Tenant-Id.
 */

import { Client } from "pg";

const SCHEMA = "t_p47435488_saas_crm_autoservice";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, X-Tenant-Id, X-User-Id",
  "Content-Type": "application/json",
};

function resp(status: number, body: unknown) {
  return {
    statusCode: status,
    headers: CORS_HEADERS,
    body: JSON.stringify(body),
  };
}

function esc(val: string): string {
  return val.replace(/'/g, "''");
}

function sqlVal(val: unknown): string {
  if (val === null || val === undefined) return "NULL";
  return `'${esc(String(val))}'`;
}

async function getList(client: Client, tenantId: string, params: Record<string, string>) {
  const statusFilter = params.status || "";
  const search = (params.search || "").trim();
  const limit = Math.min(parseInt(params.limit || "50", 10), 200);
  const offset = parseInt(params.offset || "0", 10);

  const where: string[] = [`a.tenant_id = '${esc(tenantId)}'`];
  if (statusFilter) where.push(`a.status = '${esc(statusFilter)}'`);
  if (search) {
    const s = esc(search);
    where.push(
      `(cp.full_name ILIKE '%${s}%' OR a.number ILIKE '%${s}%' ` +
      `OR cc.brand ILIKE '%${s}%' OR cc.model ILIKE '%${s}%' OR cc.plate ILIKE '%${s}%')`
    );
  }

  const whereSql = "WHERE " + where.join(" AND ");

  const listRes = await client.query(`
    SELECT
      a.id, a.number, a.status, a.scheduled_at,
      a.mileage, a.complaint, a.created_at,
      cp.full_name AS client_name, cp.phone AS client_phone,
      cc.brand AS car_brand, cc.model AS car_model,
      cc.plate AS car_plate, cc.year AS car_year,
      tu.full_name AS assigned_name
    FROM ${SCHEMA}.appointments a
    LEFT JOIN ${SCHEMA}.counterparties cp ON cp.id = a.counterparty_id
    LEFT JOIN ${SCHEMA}.counterparty_cars cc ON cc.id = a.car_id
    LEFT JOIN ${SCHEMA}.tenant_users tu ON tu.id = a.assigned_to
    ${whereSql}
    ORDER BY a.scheduled_at DESC NULLS LAST, a.created_at DESC
    LIMIT ${limit} OFFSET ${offset}
  `);

  const countRes = await client.query(`
    SELECT COUNT(*) FROM ${SCHEMA}.appointments a
    LEFT JOIN ${SCHEMA}.counterparties cp ON cp.id = a.counterparty_id
    LEFT JOIN ${SCHEMA}.counterparty_cars cc ON cc.id = a.car_id
    ${whereSql}
  `);

  return resp(200, {
    items: listRes.rows,
    total: parseInt(countRes.rows[0].count, 10),
    limit,
    offset,
  });
}

async function getOne(client: Client, tenantId: string, appointmentId: string) {
  const res = await client.query(`
    SELECT
      a.*,
      cp.full_name AS client_name, cp.phone AS client_phone, cp.email AS client_email,
      cc.brand AS car_brand, cc.model AS car_model,
      cc.plate AS car_plate, cc.year AS car_year, cc.vin AS car_vin,
      tu.full_name AS assigned_name
    FROM ${SCHEMA}.appointments a
    LEFT JOIN ${SCHEMA}.counterparties cp ON cp.id = a.counterparty_id
    LEFT JOIN ${SCHEMA}.counterparty_cars cc ON cc.id = a.car_id
    LEFT JOIN ${SCHEMA}.tenant_users tu ON tu.id = a.assigned_to
    WHERE a.id = '${esc(appointmentId)}' AND a.tenant_id = '${esc(tenantId)}'
  `);

  if (res.rows.length === 0) return resp(404, { error: "Запись не найдена" });

  const appt = res.rows[0];

  const svcRes = await client.query(`
    SELECT id, name, quantity, price, discount, amount, service_id
    FROM ${SCHEMA}.appointment_services
    WHERE appointment_id = '${esc(appointmentId)}' AND tenant_id = '${esc(tenantId)}'
  `);
  appt.services = svcRes.rows;

  const prodRes = await client.query(`
    SELECT id, name, quantity, price, discount, amount, product_id
    FROM ${SCHEMA}.appointment_products
    WHERE appointment_id = '${esc(appointmentId)}' AND tenant_id = '${esc(tenantId)}'
  `);
  appt.products = prodRes.rows;

  return resp(200, appt);
}

async function create(client: Client, tenantId: string, body: Record<string, unknown>) {
  const seqRes = await client.query(
    `SELECT COUNT(*) + 1 AS seq FROM ${SCHEMA}.appointments WHERE tenant_id = '${esc(tenantId)}'`
  );
  const seq = parseInt(seqRes.rows[0].seq, 10);
  const number = (body.number as string) || `REC-${String(seq).padStart(4, "0")}`;

  const res = await client.query(`
    INSERT INTO ${SCHEMA}.appointments
      (tenant_id, number, status, counterparty_id, car_id, company_id,
       assigned_to, scheduled_at, mileage, complaint, note)
    VALUES
      (${sqlVal(tenantId)}, ${sqlVal(number)}, ${sqlVal(body.status || "new")},
       ${sqlVal(body.counterparty_id)}, ${sqlVal(body.car_id)}, ${sqlVal(body.company_id)},
       ${sqlVal(body.assigned_to)}, ${sqlVal(body.scheduled_at)}, ${sqlVal(body.mileage)},
       ${sqlVal(body.complaint || "")}, ${sqlVal(body.note || "")})
    RETURNING id, number, status, created_at
  `);

  const row = res.rows[0];
  return resp(201, { id: row.id, number: row.number, status: row.status, created_at: row.created_at });
}

async function update(client: Client, tenantId: string, appointmentId: string, body: Record<string, unknown>) {
  const allowed = [
    "status", "scheduled_at", "started_at", "finished_at",
    "mileage", "complaint", "diagnosis", "note",
    "counterparty_id", "car_id", "assigned_to",
  ];

  const fields: string[] = [];
  for (const key of allowed) {
    if (key in body) {
      fields.push(body[key] === null ? `${key} = NULL` : `${key} = ${sqlVal(body[key])}`);
    }
  }

  if (fields.length === 0) return resp(400, { error: "Нет полей для обновления" });
  fields.push("updated_at = NOW()");

  const res = await client.query(`
    UPDATE ${SCHEMA}.appointments
    SET ${fields.join(", ")}
    WHERE id = '${esc(appointmentId)}' AND tenant_id = '${esc(tenantId)}'
    RETURNING id, number, status, updated_at
  `);

  if (res.rows.length === 0) return resp(404, { error: "Запись не найдена" });
  return resp(200, res.rows[0]);
}

export async function handler(event: Record<string, unknown>) {
  if (event.httpMethod === "OPTIONS") {
    return { statusCode: 200, headers: CORS_HEADERS, body: "" };
  }

  const method = (event.httpMethod as string) || "GET";
  const params = (event.queryStringParameters as Record<string, string>) || {};
  const headers = (event.headers as Record<string, string>) || {};
  const tenantId = headers["X-Tenant-Id"] || params.tenant_id;

  if (!tenantId) return resp(400, { error: "Заголовок X-Tenant-Id обязателен" });

  const pathParams = (event.pathParameters as Record<string, string>) || {};
  const appointmentId = pathParams.id || params.id;

  const client = new Client({ connectionString: process.env.DATABASE_URL });
  await client.connect();

  try {
    if (method === "GET") {
      if (appointmentId) return await getOne(client, tenantId, appointmentId);
      return await getList(client, tenantId, params);
    }
    if (method === "POST") {
      const body = JSON.parse((event.body as string) || "{}");
      return await create(client, tenantId, body);
    }
    if (method === "PUT") {
      if (!appointmentId) return resp(400, { error: "Не указан id записи" });
      const body = JSON.parse((event.body as string) || "{}");
      return await update(client, tenantId, appointmentId, body);
    }
    return resp(405, { error: "Метод не поддерживается" });
  } catch (e) {
    return resp(500, { error: (e as Error).message });
  } finally {
    await client.end();
  }
}