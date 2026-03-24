import { useState } from "react";
import Icon from "@/components/ui/icon";
import { searchRossko, type RosskoPart } from "@/api/rossko";

function formatPrice(p: string) {
  const n = parseFloat(p);
  if (isNaN(n)) return p;
  return n.toLocaleString("ru-RU", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + " ₽";
}

function formatDays(d: string) {
  const n = parseInt(d, 10);
  if (isNaN(n) || n <= 0) return "—";
  if (n === 1) return "1 день";
  if (n < 5) return `${n} дня`;
  return `${n} дней`;
}

export default function PriceModule() {
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [parts, setParts] = useState<RosskoPart[]>([]);
  const [searched, setSearched] = useState(false);
  const [expanded, setExpanded] = useState<string | null>(null);

  const search = async () => {
    if (!query.trim()) return;
    setLoading(true);
    setError("");
    setParts([]);
    setSearched(true);
    try {
      const res = await searchRossko(query.trim());
      if (!res.success && res.parts.length === 0) {
        setError("Ничего не найдено по данному артикулу");
      } else {
        setParts(res.parts);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Ошибка поиска");
    } finally {
      setLoading(false);
    }
  };

  const onKey = (e: React.KeyboardEvent) => { if (e.key === "Enter") search(); };

  const bestPrice = (part: RosskoPart) => {
    const prices = part.stocks.map((s) => parseFloat(s.price)).filter((p) => !isNaN(p) && p > 0);
    return prices.length > 0 ? Math.min(...prices) : 0;
  };

  const totalStocks = parts.reduce((s, p) => s + p.stocks.length, 0);

  return (
    <div>
      <div className="rounded-xl border p-5 mb-6" style={{ background: "hsl(var(--card))", borderColor: "hsl(var(--border))" }}>
        <div className="flex gap-3">
          <div className="flex-1 relative">
            <div className="absolute left-3 top-1/2 -translate-y-1/2">
              <Icon name="Search" size={16} className="text-muted-foreground" />
            </div>
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={onKey}
              placeholder="Введите артикул запчасти, например: 1K0615301AD"
              className="w-full pl-10 pr-4 py-2.5 rounded-lg text-sm text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-[hsl(var(--primary))]"
              style={{ background: "hsl(var(--secondary))", border: "1px solid hsl(var(--border))" }}
            />
          </div>
          <button
            onClick={search}
            disabled={loading || !query.trim()}
            className="px-5 py-2.5 rounded-lg text-sm font-bold text-white hover:opacity-90 transition-opacity disabled:opacity-40 flex items-center gap-2"
            style={{ background: "hsl(var(--primary))" }}
          >
            {loading ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Поиск...
              </>
            ) : (
              <>
                <Icon name="Search" size={14} className="text-white" />
                Найти
              </>
            )}
          </button>
        </div>
        <p className="text-[11px] text-muted-foreground mt-2">
          Поиск по каталогам поставщиков Rossko. Результаты включают цены, наличие и сроки доставки.
        </p>
      </div>

      {error && (
        <div className="rounded-lg border px-4 py-3 mb-4 flex items-center gap-2 text-sm"
          style={{ background: "hsl(var(--destructive) / 0.1)", borderColor: "hsl(var(--destructive) / 0.3)", color: "hsl(var(--destructive))" }}>
          <Icon name="AlertCircle" size={16} />
          {error}
        </div>
      )}

      {parts.length > 0 && (
        <>
          <div className="flex items-center gap-3 mb-4">
            <span className="text-sm text-muted-foreground">
              Найдено: <strong className="text-foreground">{parts.length}</strong> позиций, <strong className="text-foreground">{totalStocks}</strong> предложений
            </span>
          </div>

          <div className="space-y-3">
            {parts.map((part) => {
              const isOpen = expanded === part.guid;
              const minPrice = bestPrice(part);
              return (
                <div key={part.guid} className="rounded-xl border overflow-hidden transition-shadow hover:shadow-md"
                  style={{ background: "hsl(var(--card))", borderColor: "hsl(var(--border))" }}>
                  <div className="flex items-center gap-4 px-5 py-3.5 cursor-pointer" onClick={() => setExpanded(isOpen ? null : part.guid)}>
                    <div className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0" style={{ background: "hsl(var(--primary) / 0.1)" }}>
                      <Icon name="Package" size={18} className="text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-foreground">{part.brand}</span>
                        <span className="text-xs font-mono px-1.5 py-0.5 rounded" style={{ background: "hsl(var(--secondary))" }}>{part.partnumber}</span>
                      </div>
                      <p className="text-xs text-muted-foreground truncate mt-0.5">{part.name}</p>
                    </div>
                    <div className="text-right shrink-0">
                      {minPrice > 0 && (
                        <div className="text-sm font-black" style={{ color: "hsl(var(--primary))" }}>от {formatPrice(String(minPrice))}</div>
                      )}
                      <div className="text-[10px] text-muted-foreground">{part.stocks.length} предложений</div>
                    </div>
                    <Icon name={isOpen ? "ChevronUp" : "ChevronDown"} size={16} className="text-muted-foreground shrink-0" />
                  </div>

                  {isOpen && part.stocks.length > 0 && (
                    <div className="border-t" style={{ borderColor: "hsl(var(--border))" }}>
                      <div className="grid grid-cols-[1fr_100px_80px_100px_40px] gap-2 px-5 py-2 text-[10px] font-bold text-muted-foreground uppercase">
                        <span>Склад</span>
                        <span className="text-right">Цена</span>
                        <span className="text-center">Наличие</span>
                        <span className="text-center">Срок</span>
                        <span />
                      </div>
                      {part.stocks.sort((a, b) => parseFloat(a.price) - parseFloat(b.price)).map((stock, i) => (
                        <div key={`${stock.id}-${i}`}
                          className="grid grid-cols-[1fr_100px_80px_100px_40px] gap-2 px-5 py-2.5 items-center border-t text-sm hover:bg-secondary/50 transition-colors"
                          style={{ borderColor: "hsl(var(--border))" }}>
                          <span className="text-xs text-foreground truncate">{stock.description || stock.id}</span>
                          <span className="text-right font-bold text-foreground">{formatPrice(stock.price)}</span>
                          <span className={`text-center text-xs font-bold ${parseInt(stock.count) > 0 ? "text-green-600" : "text-red-500"}`}>
                            {parseInt(stock.count) > 0 ? `${stock.count} шт` : "Нет"}
                          </span>
                          <span className="text-center text-xs text-muted-foreground">{formatDays(stock.delivery)}</span>
                          <button className="w-7 h-7 rounded-md flex items-center justify-center hover:bg-primary/10 transition-colors" title="В корзину">
                            <Icon name="ShoppingCart" size={14} className="text-primary" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </>
      )}

      {searched && !loading && parts.length === 0 && !error && (
        <div className="flex flex-col items-center justify-center gap-3 py-16">
          <Icon name="SearchX" size={40} className="text-muted-foreground opacity-30" />
          <p className="text-sm text-muted-foreground">Ничего не найдено по артикулу «{query}»</p>
        </div>
      )}

      {!searched && (
        <div className="flex flex-col items-center justify-center gap-3 py-16">
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center" style={{ background: "hsl(var(--primary) / 0.1)" }}>
            <Icon name="Search" size={32} className="text-primary" />
          </div>
          <p className="text-sm text-muted-foreground">Введите артикул для поиска запчастей у поставщиков</p>
        </div>
      )}
    </div>
  );
}
