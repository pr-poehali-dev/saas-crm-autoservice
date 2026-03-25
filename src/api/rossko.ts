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

export interface BrandOption {
  id: string;
  name: string;
  article: string;
  description?: string;
  supplier: string;
}

export interface SearchResponse {
  success: boolean;
  parts: Part[];
  brands?: BrandOption[];
  error?: string;
  message?: string;
}

export async function fetchBrands(text: string): Promise<BrandOption[]> {
  const brands: BrandOption[] = [];

  const [rosskoRes, bergRes] = await Promise.allSettled([
    fetch(`${ROSSKO_URL}?text=${encodeURIComponent(text)}`),
    fetch(`${BERG_URL}?text=${encodeURIComponent(text)}&brands_only=1`),
  ]);

  if (rosskoRes.status === "fulfilled" && rosskoRes.value.ok) {
    try {
      const data = await rosskoRes.value.json();
      if (data.parts) {
        const seen = new Set<string>();
        for (const p of data.parts) {
          const key = `${p.brand}-${p.partnumber}`.toLowerCase();
          if (!seen.has(key)) {
            seen.add(key);
            brands.push({ id: p.guid, name: p.brand, article: p.partnumber, description: p.name, supplier: "rossko" });
          }
        }
      }
    } catch { /* ignore */ }
  }

  if (bergRes.status === "fulfilled" && bergRes.value.ok) {
    try {
      const data = await bergRes.value.json();
      if (data.brands) {
        for (const b of data.brands) {
          brands.push({ id: b.id, name: b.name, article: b.article || text, description: b.description, supplier: "berg" });
        }
      }
    } catch { /* ignore */ }
  }

  return brands;
}

export async function searchByBrand(text: string, brand: string, supplier?: string): Promise<Part[]> {
  const parts: Part[] = [];

  const fetches: Promise<Part[]>[] = [];

  if (!supplier || supplier === "rossko") {
    fetches.push(
      fetch(`${ROSSKO_URL}?text=${encodeURIComponent(text)}`)
        .then((r) => r.ok ? r.json() : { parts: [] })
        .then((d) => (d.parts || []).filter((p: Part) => p.brand.toLowerCase() === brand.toLowerCase()).map((p: Part) => ({ ...p, supplier: "rossko" })))
        .catch(() => [])
    );
  }

  if (!supplier || supplier === "berg") {
    fetches.push(
      fetch(`${BERG_URL}?text=${encodeURIComponent(text)}&brands_only=1`)
        .then(async (r) => {
          if (!r.ok) return [];
          const d = await r.json();
          const br = (d.brands || []).find((b: BrandOption) => b.name.toLowerCase() === brand.toLowerCase());
          if (!br) return [];
          const r2 = await fetch(`${BERG_URL}?text=${encodeURIComponent(text)}&brand_id=${br.id}`);
          if (!r2.ok) return [];
          const d2 = await r2.json();
          return (d2.parts || []).map((p: Part) => ({ ...p, supplier: "berg" }));
        })
        .catch(() => [])
    );
  }

  const results = await Promise.all(fetches);
  for (const r of results) parts.push(...r);
  return parts;
}

export async function searchAllSuppliers(text: string): Promise<Part[]> {
  const [rossko, berg] = await Promise.all([
    fetch(`${ROSSKO_URL}?text=${encodeURIComponent(text)}`).then((r) => r.ok ? r.json() : { parts: [] }).then((d) => (d.parts || []).map((p: Part) => ({ ...p, supplier: p.supplier || "rossko" }))).catch(() => []),
    fetch(`${BERG_URL}?text=${encodeURIComponent(text)}`).then((r) => r.ok ? r.json() : { parts: [] }).then((d) => (d.parts || []).map((p: Part) => ({ ...p, supplier: p.supplier || "berg" }))).catch(() => []),
  ]);
  return [...rossko, ...berg];
}
