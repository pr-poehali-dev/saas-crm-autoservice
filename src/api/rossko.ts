const ROSSKO_URL = "https://functions.poehali.dev/669251d1-184e-4a7c-a95d-320c38403046";
const BERG_URL = "https://functions.poehali.dev/43c4c54d-db25-42d7-ba52-747f022c8569";

export interface PartStock {
  id: string;
  price: string;
  count: string;
  delivery: string;
  description: string;
}

export interface Part {
  guid: string;
  brand: string;
  partnumber: string;
  name: string;
  stocks: PartStock[];
  supplier: string;
}

export interface SearchResponse {
  success: boolean;
  parts: Part[];
  error?: string;
  message?: string;
}

async function fetchSupplier(url: string, text: string, supplier: string): Promise<Part[]> {
  try {
    const res = await fetch(`${url}?text=${encodeURIComponent(text)}`);
    if (!res.ok) return [];
    const data = await res.json();
    if (!data.success && (!data.parts || data.parts.length === 0)) return [];
    return (data.parts || []).map((p: Part) => ({ ...p, supplier: p.supplier || supplier }));
  } catch {
    return [];
  }
}

export async function searchAllSuppliers(text: string): Promise<Part[]> {
  const [rossko, berg] = await Promise.all([
    fetchSupplier(ROSSKO_URL, text, "rossko"),
    fetchSupplier(BERG_URL, text, "berg"),
  ]);
  return [...rossko, ...berg];
}

export async function searchRossko(text: string): Promise<SearchResponse> {
  const res = await fetch(`${ROSSKO_URL}?text=${encodeURIComponent(text)}`);
  if (!res.ok) {
    const data = await res.json().catch(() => ({ error: `HTTP ${res.status}` }));
    throw new Error(data.error || `HTTP ${res.status}`);
  }
  return res.json();
}

export async function searchBerg(text: string): Promise<SearchResponse> {
  const res = await fetch(`${BERG_URL}?text=${encodeURIComponent(text)}`);
  if (!res.ok) {
    const data = await res.json().catch(() => ({ error: `HTTP ${res.status}` }));
    throw new Error(data.error || `HTTP ${res.status}`);
  }
  return res.json();
}
