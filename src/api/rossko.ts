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
  suppliers: string[];
  bergId?: string;
}

function norm(s: string): string {
  return s.toLowerCase().replace(/[\s.\-_/\\]/g, "");
}

export async function fetchBrands(text: string): Promise<BrandOption[]> {
  const raw: { name: string; article: string; description: string; supplier: string; id: string }[] = [];

  const [rosskoRes, bergRes] = await Promise.allSettled([
    fetch(`${ROSSKO_URL}?text=${encodeURIComponent(text)}`),
    fetch(`${BERG_URL}?text=${encodeURIComponent(text)}&brands_only=1`),
  ]);

  if (rosskoRes.status === "fulfilled" && rosskoRes.value.ok) {
    try {
      const data = await rosskoRes.value.json();
      const seen = new Set<string>();
      for (const p of (data.parts || [])) {
        const key = norm(p.brand) + "|" + norm(p.partnumber);
        if (!seen.has(key)) {
          seen.add(key);
          raw.push({ name: p.brand, article: p.partnumber, description: p.name, supplier: "rossko", id: p.guid });
        }
      }
    } catch { /* */ }
  }

  if (bergRes.status === "fulfilled" && bergRes.value.ok) {
    try {
      const data = await bergRes.value.json();
      for (const b of (data.brands || [])) {
        raw.push({ name: b.name, article: b.article || text, description: b.description || "", supplier: "berg", id: String(b.id) });
      }
      if (!data.brands && data.parts) {
        const seen = new Set<string>();
        for (const p of data.parts) {
          const key = norm(p.brand) + "|" + norm(p.partnumber);
          if (!seen.has(key)) {
            seen.add(key);
            raw.push({ name: p.brand, article: p.partnumber, description: p.name, supplier: "berg", id: p.guid });
          }
        }
      }
    } catch { /* */ }
  }

  const map = new Map<string, BrandOption>();
  for (const r of raw) {
    const key = norm(r.name);
    const existing = map.get(key);
    if (existing) {
      if (!existing.suppliers.includes(r.supplier)) existing.suppliers.push(r.supplier);
      if (!existing.description && r.description) existing.description = r.description;
      if (r.supplier === "berg" && !existing.bergId) existing.bergId = r.id;
    } else {
      map.set(key, { id: r.id, name: r.name, article: r.article, description: r.description, suppliers: [r.supplier], bergId: r.supplier === "berg" ? r.id : undefined });
    }
  }

  return Array.from(map.values());
}

export async function searchByBrand(text: string, brand: string, bergBrandId?: string): Promise<Part[]> {
  const brandNorm = norm(brand);

  const bergUrl = bergBrandId
    ? `${BERG_URL}?text=${encodeURIComponent(text)}&brand_id=${bergBrandId}`
    : `${BERG_URL}?text=${encodeURIComponent(text)}`;

  const [rosskoRes, bergRes] = await Promise.allSettled([
    fetch(`${ROSSKO_URL}?text=${encodeURIComponent(text)}`)
      .then((r) => r.ok ? r.json() : { parts: [] })
      .then((d) => (d.parts || [])
        .filter((p: Part) => norm(p.brand) === brandNorm)
        .map((p: Part) => ({
          ...p,
          supplier: "rossko",
          stocks: (p.stocks || []).map((s) => ({ ...s, delivery: s.delivery || "0" })),
        }))
      )
      .catch(() => [] as Part[]),

    fetch(bergUrl)
      .then(async (r) => {
        if (!r.ok) return [] as Part[];
        const d = await r.json();
        return (d.parts || [])
          .filter((p: Part) => norm(p.brand) === brandNorm)
          .map((p: Part) => ({ ...p, supplier: "berg" }));
      })
      .catch(() => [] as Part[]),
  ]);

  const raw: Part[] = [];
  if (rosskoRes.status === "fulfilled") raw.push(...rosskoRes.value);
  if (bergRes.status === "fulfilled") raw.push(...bergRes.value);

  const grouped = new Map<string, Part>();
  for (const p of raw) {
    const key = norm(p.brand) + "|" + norm(p.partnumber);
    const existing = grouped.get(key);
    if (existing) {
      for (const s of p.stocks) {
        existing.stocks.push({ ...s, description: s.description ? `${s.description} [${p.supplier}]` : `[${p.supplier}]` });
      }
      if (!existing.name && p.name) existing.name = p.name;
    } else {
      grouped.set(key, {
        ...p,
        brand: p.brand.toUpperCase(),
        supplier: "all",
        stocks: p.stocks.map((s) => ({ ...s, description: s.description ? `${s.description} [${p.supplier}]` : `[${p.supplier}]` })),
      });
    }
  }

  return Array.from(grouped.values());
}