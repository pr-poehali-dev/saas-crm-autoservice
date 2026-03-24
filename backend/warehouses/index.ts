/**
 * CRUD-обработчик для модуля Склады (warehouses). v2.
 * GET список, GET один, POST создание, PUT обновление, DELETE удаление.
 */

import { Client } from "pg";

const SCHEMA = "t_p47435488_saas_crm_autoservice";

const CORS_HEADERS: Record<string, string> = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, X-Tenant-Id, X-User-Id",
  "Content-Type": "application/json",
};

function resp(status: number, body: unknown) {
  return { statusCode: status, headers: CORS_HEADERS, body: JSON.stringify(body) };
}

function esc(val: string): string {
  return val.replace(/'/g, "''");
}

function sqlVal(val: unknown): string {
  if (val === null || val === undefined) return "NULL";
  if (typeof val === "boolean") return val ? "TRUE" : "FALSE";
  return `'${esc(String(val))}'`;
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

  const client = new Client({ connectionString: process.env.DATABASE_URL });
  await client.connect();

  try {
    const pathParams = (event.pathParameters as Record<string, string>) || {};
    const itemId = pathParams.id || params.id;

    if (method === "GET") {
      if (itemId) return await getOne(client, tenantId, itemId);
      return await getList(client, tenantId);
    }
    if (method === "POST") {
      const body = JSON.parse((event.body as string) || "{}");
      return await create(client, tenantId, body);
    }
    if (method === "PUT") {
      if (!itemId) return resp(400, { error: "Не указан id склада" });
      const body = JSON.parse((event.body as string) || "{}");
      return await update(client, tenantId, itemId, body);
    }
    if (method === "DELETE") {
      if (!itemId) return resp(400, { error: "Не указан id склада" });
      return await remove(client, tenantId, itemId);
    }
    return resp(405, { error: "Метод не поддерживается" });
  } catch (e) {
    return resp(500, { error: (e as Error).message });
  } finally {
    await client.end();
  }
}

async function getList(client: Client, tenantId: string) {
  const res = await client.query(`
    SELECT id, name, address, phone, is_default, is_active, created_at
    FROM ${SCHEMA}.warehouses
    WHERE tenant_id = '${esc(tenantId)}'
    ORDER BY is_default DESC, created_at ASC
  `);
  return resp(200, { items: res.rows });
}

async function getOne(client: Client, tenantId: string, id: string) {
  const res = await client.query(`
    SELECT id, name, address, phone, is_default, is_active, created_at
    FROM ${SCHEMA}.warehouses
    WHERE id = '${esc(id)}' AND tenant_id = '${esc(tenantId)}'
  `);
  if (res.rows.length === 0) return resp(404, { error: "Склад не найден" });
  return resp(200, res.rows[0]);
}

async function create(client: Client, tenantId: string, body: Record<string, unknown>) {
  const name = body.name as string;
  if (!name?.trim()) return resp(400, { error: "Название обязательно" });

  if (body.is_default) {
    await client.query(`UPDATE ${SCHEMA}.warehouses SET is_default = FALSE WHERE tenant_id = '${esc(tenantId)}'`);
  }

  const res = await client.query(`
    INSERT INTO ${SCHEMA}.warehouses (tenant_id, name, address, phone, is_default)
    VALUES (${sqlVal(tenantId)}, ${sqlVal(name)}, ${sqlVal(body.address)}, ${sqlVal(body.phone)}, ${sqlVal(!!body.is_default)})
    RETURNING id, name, address, phone, is_default, is_active, created_at
  `);
  return resp(201, res.rows[0]);
}

async function update(client: Client, tenantId: string, id: string, body: Record<string, unknown>) {
  const allowed = ["name", "address", "phone", "is_default", "is_active"];
  const fields: string[] = [];

  for (const key of allowed) {
    if (key in body) {
      fields.push(`${key} = ${sqlVal(body[key])}`);
    }
  }

  if (fields.length === 0) return resp(400, { error: "Нет полей для обновления" });

  if (body.is_default) {
    await client.query(`UPDATE ${SCHEMA}.warehouses SET is_default = FALSE WHERE tenant_id = '${esc(tenantId)}'`);
  }

  const res = await client.query(`
    UPDATE ${SCHEMA}.warehouses SET ${fields.join(", ")}
    WHERE id = '${esc(id)}' AND tenant_id = '${esc(tenantId)}'
    RETURNING id, name, address, phone, is_default, is_active, created_at
  `);
  if (res.rows.length === 0) return resp(404, { error: "Склад не найден" });
  return resp(200, res.rows[0]);
}

async function remove(client: Client, tenantId: string, id: string) {
  const res = await client.query(`
    DELETE FROM ${SCHEMA}.warehouses
    WHERE id = '${esc(id)}' AND tenant_id = '${esc(tenantId)}'
    RETURNING id
  `);
  if (res.rows.length === 0) return resp(404, { error: "Склад не найден" });
  return resp(200, { deleted: true, id: res.rows[0].id });
}