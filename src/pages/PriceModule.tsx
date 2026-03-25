import { useState } from "react";
import Icon from "@/components/ui/icon";
import { fetchBrands, searchByBrand, type Part, type BrandOption } from "@/api/rossko";

function formatPrice(p: string) {
  const n = parseFloat(p);
  if (isNaN(n)) return p;
  return n.toLocaleString("ru-RU", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + " ₽";
}

function formatDays(d: string) {
  const n = parseInt(d, 10);
  if (isNaN(n) || n <= 0) return "В наличии";
  if (n === 1) return "1 день";
  if (n < 5) return `${n} дня`;
  return `${n} дней`;
}

function deliveryDays(d: string): number {
  const n = parseInt(d, 10);
  return isNaN(n) ? 0 : n;
}

const SUP: Record<string, { name: string; color: string }> = {
  rossko: { name: "Rossko", color: "bg-orange-500/15 text-orange-600" },
  berg: { name: "Berg", color: "bg-blue-500/15 text-blue-600" },
};

const DELIVERY_FILTERS = [
  { label: "Все сроки", max: Infinity },
  { label: "В наличии", max: 0 },
  { label: "До 3 дней", max: 3 },
  { label: "До 7 дней", max: 7 },
  { label: "До 14 дней", max: 14 },
];

type Step = "search" | "brands" | "results";

export default function PriceModule() {
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [step, setStep] = useState<Step>("search");
  const [brands, setBrands] = useState<BrandOption[]>([]);
  const [selectedBrand, setSelectedBrand] = useState<BrandOption | null>(null);
  const [parts, setParts] = useState<Part[]>([]);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [supplierFilter, setSupplierFilter] = useState("");
  const [deliveryFilter, setDeliveryFilter] = useState(Infinity);

  const searchBrands = async () => {
    if (!query.trim()) return;
    setLoading(true);
    setError("");
    setBrands([]);
    setParts([]);
    setSelectedBrand(null);
    setDeliveryFilter(Infinity);
    setSupplierFilter("");
    setStep("search");
    try {
      const result = await fetchBrands(query.trim());
      if (result.length === 0) {
        setError("Ничего не найдено по артикулу «" + query.trim() + "»");
      } else if (result.length === 1) {
        await doSearch(result[0]);
      } else {
        setBrands(result);
        setStep("brands");
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Ошибка поиска");
    } finally {
      setLoading(false);
    }
  };

  const doSearch = async (brand: BrandOption) => {
    setSelectedBrand(brand);
    setLoading(true);
    setError("");
    setParts([]);
    setStep("results");
    setDeliveryFilter(Infinity);
    setSupplierFilter("");
    try {
      const result = await searchByBrand(brand.article || query.trim(), brand.name, brand.bergId);
      if (result.length === 0) setError("Нет предложений для " + brand.name + " " + (brand.article || query.trim()));
      setParts(result);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Ошибка поиска");
    } finally {
      setLoading(false);
    }
  };

  const reset = () => {
    setStep("search"); setBrands([]); setParts([]); setSelectedBrand(null);
    setError(""); setSupplierFilter(""); setExpanded(null); setDeliveryFilter(Infinity);
  };

  const onKey = (e: React.KeyboardEvent) => { if (e.key === "Enter") searchBrands(); };

  const bestPrice = (part: Part) => {
    const prices = part.stocks.map((s) => parseFloat(s.price)).filter((p) => !isNaN(p) && p > 0);
    return prices.length > 0 ? Math.min(...prices) : 0;
  };

  const stockSupplier = (desc: string) => {
    if (desc.includes("[rossko]")) return "rossko";
    if (desc.includes("[berg]")) return "berg";
    return "";
  };

  const filterStocks = (stocks: Part["stocks"]) => {
    let f = stocks;
    if (supplierFilter) f = f.filter((s) => stockSupplier(s.description) === supplierFilter);
    if (deliveryFilter !== Infinity) f = f.filter((s) => deliveryDays(s.delivery) <= deliveryFilter);
    return f;
  };

  const filteredParts = parts
    .map((p) => ({ ...p, stocks: filterStocks(p.stocks) }))
    .filter((p) => p.stocks.length > 0);

  const totalStocks = filteredParts.reduce((s, p) => s + p.stocks.length, 0);
  const allStockSuppliers = new Set<string>();
  for (const p of parts) for (const s of p.stocks) { const sup = stockSupplier(s.description); if (sup) allStockSuppliers.add(sup); }
  const suppliers = Array.from(allStockSuppliers);

  return (
    <div>
      <div className="rounded-xl border p-5 mb-6" style={{ background: "hsl(var(--card))", borderColor: "hsl(var(--border))" }}>
        <div className="flex gap-3">
          <div className="flex-1 relative">
            <div className="absolute left-3 top-1/2 -translate-y-1/2"><Icon name="Search" size={16} className="text-muted-foreground" /></div>
            <input value={query} onChange={(e) => setQuery(e.target.value)} onKeyDown={onKey}
              placeholder="Введите артикул запчасти, например: 107130"
              className="w-full pl-10 pr-4 py-2.5 rounded-lg text-sm text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-[hsl(var(--primary))]"
              style={{ background: "hsl(var(--secondary))", border: "1px solid hsl(var(--border))" }} />
          </div>
          <button onClick={searchBrands} disabled={loading || !query.trim()}
            className="px-5 py-2.5 rounded-lg text-sm font-bold text-white hover:opacity-90 transition-opacity disabled:opacity-40 flex items-center gap-2"
            style={{ background: "hsl(var(--primary))" }}>
            {loading ? <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Поиск...</>
              : <><Icon name="Search" size={14} className="text-white" />Найти</>}
          </button>
        </div>
        {step !== "search" && (
          <div className="flex items-center gap-2 mt-3">
            <button onClick={reset} className="text-xs font-bold flex items-center gap-1 hover:opacity-80" style={{ color: "hsl(var(--primary))" }}>
              <Icon name="ArrowLeft" size={12} />Новый поиск
            </button>
            {selectedBrand && (
              <>
                <Icon name="ChevronRight" size={12} className="text-muted-foreground" />
                <span className="text-xs text-foreground font-bold">{selectedBrand.name}</span>
                <span className="text-xs text-muted-foreground">{selectedBrand.article}</span>
                {step === "results" && brands.length > 1 && (
                  <button onClick={() => { setStep("brands"); setParts([]); setError(""); setSupplierFilter(""); setDeliveryFilter(Infinity); }}
                    className="text-[10px] font-bold ml-1 hover:opacity-80" style={{ color: "hsl(var(--primary))" }}>(изменить)</button>
                )}
              </>
            )}
          </div>
        )}
        {step === "search" && !loading && <p className="text-[11px] text-muted-foreground mt-2">Поиск по каталогам: Rossko, Berg</p>}
      </div>

      {error && (
        <div className="rounded-lg border px-4 py-3 mb-4 flex items-center gap-2 text-sm"
          style={{ background: "hsl(var(--destructive) / 0.1)", borderColor: "hsl(var(--destructive) / 0.3)", color: "hsl(var(--destructive))" }}>
          <Icon name="AlertCircle" size={16} />{error}
        </div>
      )}

      {/* Шаг: выбор бренда */}
      {step === "brands" && !loading && brands.length > 0 && (
        <div>
          <p className="text-sm text-muted-foreground mb-3">Выберите бренд для артикула <strong className="text-foreground">{query}</strong>:</p>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
            {brands.map((b, i) => (
              <button key={`${b.name}-${i}`} onClick={() => doSearch(b)}
                className="rounded-xl border p-4 text-left transition-all hover:shadow-md hover:border-[hsl(var(--primary))]"
                style={{ background: "hsl(var(--card))", borderColor: "hsl(var(--border))" }}>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0" style={{ background: "hsl(var(--primary) / 0.1)" }}>
                    <Icon name="Package" size={18} className="text-primary" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-bold text-foreground">{b.name}</div>
                    <div className="text-xs text-muted-foreground truncate">{b.description || b.article}</div>
                  </div>
                </div>
                <div className="flex gap-1 mt-2.5">
                  {b.suppliers.map((s) => {
                    const sup = SUP[s] || { name: s, color: "bg-gray-500/15 text-gray-600" };
                    return <span key={s} className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full uppercase ${sup.color}`}>{sup.name}</span>;
                  })}
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Шаг: результаты */}
      {step === "results" && !loading && (
        <>
          {parts.length > 0 && (
            <div className="flex items-center gap-3 mb-4 flex-wrap">
              <span className="text-sm text-muted-foreground">
                <strong className="text-foreground">{filteredParts.length}</strong> позиций, <strong className="text-foreground">{totalStocks}</strong> предложений
              </span>

              <div className="flex gap-1.5 ml-auto flex-wrap">
                {DELIVERY_FILTERS.map((df) => (
                  <button key={df.label} onClick={() => setDeliveryFilter(deliveryFilter === df.max ? Infinity : df.max)}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-colors ${deliveryFilter === df.max
                      ? "text-white" : "text-muted-foreground hover:bg-secondary"}`}
                    style={deliveryFilter === df.max ? { background: "hsl(var(--primary))" } : {}}>
                    {df.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {suppliers.length > 1 && parts.length > 0 && (
            <div className="flex gap-1.5 mb-4">
              <button onClick={() => setSupplierFilter("")}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-colors ${!supplierFilter ? "text-white" : "text-muted-foreground hover:bg-secondary"}`}
                style={!supplierFilter ? { background: "hsl(var(--primary))" } : {}}>Все</button>
              {suppliers.map((s) => {
                const sup = SUP[s] || { name: s, color: "" };
                const cnt = parts.reduce((a, p) => a + p.stocks.filter((st) => stockSupplier(st.description) === s).length, 0);
                return (
                  <button key={s} onClick={() => setSupplierFilter(supplierFilter === s ? "" : s)}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-colors ${supplierFilter === s ? sup.color : "text-muted-foreground hover:bg-secondary"}`}>
                    {sup.name} ({cnt})
                  </button>
                );
              })}
            </div>
          )}

          {filteredParts.length > 0 && (
            <div className="space-y-3">
              {filteredParts.map((part, idx) => {
                const key = `${part.brand}-${part.partnumber}-${idx}`;
                const isOpen = expanded === key;
                const minPrice = bestPrice(part);
                const partSuppliers = [...new Set(part.stocks.map((s) => stockSupplier(s.description)).filter(Boolean))];
                return (
                  <div key={key} className="rounded-xl border overflow-hidden transition-shadow hover:shadow-md"
                    style={{ background: "hsl(var(--card))", borderColor: "hsl(var(--border))" }}>
                    <div className="flex items-center gap-4 px-5 py-3.5 cursor-pointer" onClick={() => setExpanded(isOpen ? null : key)}>
                      <div className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0" style={{ background: "hsl(var(--primary) / 0.1)" }}>
                        <Icon name="Package" size={18} className="text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-bold text-foreground">{part.brand}</span>
                          <span className="text-xs font-mono px-1.5 py-0.5 rounded" style={{ background: "hsl(var(--secondary))" }}>{part.partnumber}</span>
                          {partSuppliers.map((s) => {
                            const sup = SUP[s] || { name: s, color: "bg-gray-500/15 text-gray-600" };
                            return <span key={s} className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full uppercase ${sup.color}`}>{sup.name}</span>;
                          })}
                        </div>
                        <p className="text-xs text-muted-foreground truncate mt-0.5">{part.name}</p>
                      </div>
                      <div className="text-right shrink-0">
                        {minPrice > 0 && <div className="text-sm font-black" style={{ color: "hsl(var(--primary))" }}>от {formatPrice(String(minPrice))}</div>}
                        <div className="text-[10px] text-muted-foreground">{part.stocks.length} предл.</div>
                      </div>
                      <Icon name={isOpen ? "ChevronUp" : "ChevronDown"} size={16} className="text-muted-foreground shrink-0" />
                    </div>
                    {isOpen && part.stocks.length > 0 && (
                      <div className="border-t" style={{ borderColor: "hsl(var(--border))" }}>
                        <div className="grid grid-cols-[60px_1fr_100px_80px_100px_40px] gap-2 px-5 py-2 text-[10px] font-bold text-muted-foreground uppercase">
                          <span>Источник</span><span>Склад</span><span className="text-right">Цена</span><span className="text-center">Наличие</span><span className="text-center">Срок</span><span />
                        </div>
                        {part.stocks.sort((a, b) => parseFloat(a.price) - parseFloat(b.price)).map((stock, i) => {
                          const sSup = stockSupplier(stock.description);
                          const supCfg = SUP[sSup] || { name: "", color: "" };
                          const cleanDesc = stock.description.replace(/\s*\[(rossko|berg)\]/g, "").trim();
                          return (
                            <div key={`${stock.id}-${i}`}
                              className="grid grid-cols-[60px_1fr_100px_80px_100px_40px] gap-2 px-5 py-2.5 items-center border-t text-sm hover:bg-secondary/50 transition-colors"
                              style={{ borderColor: "hsl(var(--border))" }}>
                              <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full text-center uppercase ${supCfg.color}`}>{supCfg.name}</span>
                              <span className="text-xs text-foreground truncate">{cleanDesc || stock.id}</span>
                              <span className="text-right font-bold text-foreground">{formatPrice(stock.price)}</span>
                              <span className={`text-center text-xs font-bold ${parseInt(stock.count) > 0 ? "text-green-600" : "text-red-500"}`}>
                                {parseInt(stock.count) > 0 ? `${stock.count} шт` : "Нет"}
                              </span>
                              <span className="text-center text-xs text-muted-foreground">{formatDays(stock.delivery)}</span>
                              <button className="w-7 h-7 rounded-md flex items-center justify-center hover:bg-primary/10 transition-colors" title="В корзину">
                                <Icon name="ShoppingCart" size={14} className="text-primary" />
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {filteredParts.length === 0 && parts.length > 0 && !error && (
            <div className="flex flex-col items-center justify-center gap-3 py-12">
              <Icon name="Filter" size={32} className="text-muted-foreground opacity-30" />
              <p className="text-sm text-muted-foreground">Нет предложений с выбранными фильтрами</p>
              <button onClick={() => { setDeliveryFilter(Infinity); setSupplierFilter(""); }}
                className="text-xs font-bold hover:opacity-80" style={{ color: "hsl(var(--primary))" }}>Сбросить фильтры</button>
            </div>
          )}

          {parts.length === 0 && !error && (
            <div className="flex flex-col items-center justify-center gap-3 py-16">
              <Icon name="SearchX" size={40} className="text-muted-foreground opacity-30" />
              <p className="text-sm text-muted-foreground">Нет предложений</p>
            </div>
          )}
        </>
      )}

      {step === "search" && !loading && !error && (
        <div className="flex flex-col items-center justify-center gap-3 py-16">
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center" style={{ background: "hsl(var(--primary) / 0.1)" }}>
            <Icon name="Search" size={32} className="text-primary" />
          </div>
          <p className="text-sm text-muted-foreground">Введите артикул для поиска запчастей у поставщиков</p>
          <div className="flex gap-2 mt-1">
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-orange-500/15 text-orange-600">Rossko</span>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-500/15 text-blue-600">Berg</span>
          </div>
        </div>
      )}

      {loading && (
        <div className="flex items-center justify-center gap-3 py-16">
          <div className="w-6 h-6 border-2 border-[hsl(var(--primary))]/30 border-t-[hsl(var(--primary))] rounded-full animate-spin" />
          <span className="text-sm text-muted-foreground">Поиск у поставщиков...</span>
        </div>
      )}
    </div>
  );
}