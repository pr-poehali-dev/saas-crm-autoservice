const BASE_URL = "https://functions.poehali.dev/669251d1-184e-4a7c-a95d-320c38403046";

export interface RosskoStock {
  id: string;
  price: string;
  count: string;
  delivery: string;
  description: string;
}

export interface RosskoPart {
  guid: string;
  brand: string;
  partnumber: string;
  name: string;
  stocks: RosskoStock[];
}

export interface RosskoResponse {
  success: boolean;
  parts: RosskoPart[];
  error?: string;
}

export async function searchRossko(text: string): Promise<RosskoResponse> {
  const res = await fetch(`${BASE_URL}?text=${encodeURIComponent(text)}`);
  if (!res.ok) {
    const data = await res.json().catch(() => ({ error: `HTTP ${res.status}` }));
    throw new Error(data.error || `HTTP ${res.status}`);
  }
  return res.json();
}
