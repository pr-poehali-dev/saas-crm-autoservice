const TENANT_ID = "00000000-0000-0000-0000-000000000001";

let BASE_URL = "";

async function getBaseUrl(): Promise<string> {
  if (BASE_URL) return BASE_URL;
  try {
    const map = await import("../../backend/func2url.json");
    BASE_URL = (map as Record<string, string>).warehouses || "";
  } catch {
    BASE_URL = "";
  }
  return BASE_URL;
}

const hdrs = () => ({
  "Content-Type": "application/json",
  "X-Tenant-Id": TENANT_ID,
});

export interface Warehouse {
  id: string;
  name: string;
  address: string | null;
  phone: string | null;
  is_default: boolean;
  is_active: boolean;
  created_at: string;
}

export async function fetchWarehouses(): Promise<Warehouse[]> {
  const url = await getBaseUrl();
  if (!url) return [];
  const res = await fetch(url, { headers: hdrs() });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const data = await res.json();
  return data.items;
}

export async function createWarehouse(body: {
  name: string;
  address?: string;
  phone?: string;
  is_default?: boolean;
}): Promise<Warehouse> {
  const url = await getBaseUrl();
  if (!url) throw new Error("API не подключен");
  const res = await fetch(url, { method: "POST", headers: hdrs(), body: JSON.stringify(body) });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

export async function updateWarehouse(id: string, body: Partial<{
  name: string;
  address: string;
  phone: string;
  is_default: boolean;
  is_active: boolean;
}>): Promise<Warehouse> {
  const url = await getBaseUrl();
  if (!url) throw new Error("API не подключен");
  const res = await fetch(`${url}?id=${id}`, { method: "PUT", headers: hdrs(), body: JSON.stringify(body) });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

export async function deleteWarehouse(id: string): Promise<void> {
  const url = await getBaseUrl();
  if (!url) throw new Error("API не подключен");
  const res = await fetch(`${url}?id=${id}`, { method: "DELETE", headers: hdrs() });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
}
