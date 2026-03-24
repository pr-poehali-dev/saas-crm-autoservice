import { useState, useEffect, useCallback } from "react";
import Icon from "@/components/ui/icon";
import {
  fetchAppointments,
  createAppointment,
  updateAppointment,
  type Appointment,
} from "@/api/appointments";

const STATUS_CONFIG: Record<string, { label: string; bg: string; text: string; dot: string }> = {
  new:    { label: "Новая",      bg: "bg-slate-500/15",  text: "text-slate-400",  dot: "bg-slate-400"  },
  active: { label: "В работе",   bg: "bg-blue-500/15",   text: "text-blue-400",   dot: "bg-blue-400"   },
  wait:   { label: "Ожидание",   bg: "bg-yellow-500/15", text: "text-yellow-400", dot: "bg-yellow-400" },
  done:   { label: "Выполнено",  bg: "bg-green-500/15",  text: "text-green-400",  dot: "bg-green-400"  },
  cancel: { label: "Отменено",   bg: "bg-red-500/15",    text: "text-red-400",    dot: "bg-red-400"    },
};

const ALL_STATUSES = ["new", "active", "wait", "done", "cancel"];

function StatusBadge({ status }: { status: string }) {
  const cfg = STATUS_CONFIG[status] ?? { label: status, bg: "bg-muted", text: "text-muted-foreground", dot: "bg-muted-foreground" };
  return (
    <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-xs font-medium ${cfg.bg} ${cfg.text}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
      {cfg.label}
    </span>
  );
}

function formatDateTime(iso: string | null) {
  if (!iso) return "—";
  const d = new Date(iso);
  return d.toLocaleString("ru-RU", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

// ─── Форма создания ───────────────────────────────────────────────────────────
function CreateModal({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
  const [form, setForm] = useState({
    complaint: "",
    scheduled_at: "",
    mileage: "",
    note: "",
    status: "new",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const set = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }));

  const submit = async () => {
    setLoading(true);
    setError("");
    try {
      await createAppointment({
        complaint: form.complaint || undefined,
        scheduled_at: form.scheduled_at || undefined,
        mileage: form.mileage ? Number(form.mileage) : undefined,
        note: form.note || undefined,
        status: form.status,
      });
      onCreated();
      onClose();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Ошибка создания");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: "rgba(0,0,0,0.6)" }}>
      <div
        className="w-full max-w-md rounded-xl border p-6 animate-fade-in"
        style={{ background: "hsl(var(--card))", borderColor: "hsl(var(--border))" }}
      >
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-base font-semibold text-foreground">Новая запись</h2>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-md hover:bg-secondary transition-colors">
            <Icon name="X" size={16} className="text-muted-foreground" />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1.5">Жалоба / описание работ</label>
            <textarea
              rows={3}
              value={form.complaint}
              onChange={(e) => set("complaint", e.target.value)}
              placeholder="Стук при торможении, замена масла..."
              className="w-full px-3 py-2 rounded-md text-sm text-foreground resize-none focus:outline-none focus:ring-1 focus:ring-primary"
              style={{ background: "hsl(var(--secondary))", border: "1px solid hsl(var(--border))" }}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1.5">Дата и время</label>
              <input
                type="datetime-local"
                value={form.scheduled_at}
                onChange={(e) => set("scheduled_at", e.target.value)}
                className="w-full px-3 py-2 rounded-md text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                style={{ background: "hsl(var(--secondary))", border: "1px solid hsl(var(--border))" }}
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1.5">Пробег, км</label>
              <input
                type="number"
                value={form.mileage}
                onChange={(e) => set("mileage", e.target.value)}
                placeholder="85000"
                className="w-full px-3 py-2 rounded-md text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                style={{ background: "hsl(var(--secondary))", border: "1px solid hsl(var(--border))" }}
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1.5">Статус</label>
            <select
              value={form.status}
              onChange={(e) => set("status", e.target.value)}
              className="w-full px-3 py-2 rounded-md text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
              style={{ background: "hsl(var(--secondary))", border: "1px solid hsl(var(--border))" }}
            >
              {ALL_STATUSES.map((s) => (
                <option key={s} value={s}>{STATUS_CONFIG[s].label}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1.5">Примечание</label>
            <input
              type="text"
              value={form.note}
              onChange={(e) => set("note", e.target.value)}
              placeholder="Любые заметки..."
              className="w-full px-3 py-2 rounded-md text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
              style={{ background: "hsl(var(--secondary))", border: "1px solid hsl(var(--border))" }}
            />
          </div>

          {error && <p className="text-xs text-red-400">{error}</p>}

          <div className="flex gap-2 pt-1">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-2 rounded-md text-sm font-medium text-muted-foreground hover:bg-secondary transition-colors"
            >
              Отмена
            </button>
            <button
              onClick={submit}
              disabled={loading}
              className="flex-1 px-4 py-2 rounded-md text-sm font-medium text-white hover:opacity-90 transition-opacity disabled:opacity-50"
              style={{ background: "hsl(var(--primary))" }}
            >
              {loading ? "Создание..." : "Создать запись"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Основной компонент ───────────────────────────────────────────────────────
export default function AppointmentsModule() {
  const [items, setItems] = useState<Appointment[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [showCreate, setShowCreate] = useState(false);
  const [offset, setOffset] = useState(0);
  const LIMIT = 20;

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const data = await fetchAppointments({
        search: search || undefined,
        status: statusFilter || undefined,
        limit: LIMIT,
        offset,
      });
      setItems(data.items);
      setTotal(data.total);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Ошибка загрузки");
    } finally {
      setLoading(false);
    }
  }, [search, statusFilter, offset]);

  useEffect(() => { load(); }, [load]);

  const handleStatusChange = async (id: string, status: string) => {
    try {
      await updateAppointment(id, { status });
      setItems((prev) => prev.map((a) => a.id === id ? { ...a, status } : a));
    } catch {
      // silent
    }
  };

  const totalPages = Math.ceil(total / LIMIT);
  const currentPage = Math.floor(offset / LIMIT) + 1;

  return (
    <div className="space-y-4 animate-fade-in">
      {/* Toolbar */}
      <div className="flex items-center gap-3 flex-wrap">
        {/* Search */}
        <div
          className="flex items-center gap-2 px-3 py-2 rounded-md border flex-1"
          style={{ background: "hsl(var(--card))", borderColor: "hsl(var(--border))", minWidth: 200 }}
        >
          <Icon name="Search" size={14} className="text-muted-foreground shrink-0" />
          <input
            type="text"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setOffset(0); }}
            placeholder="Клиент, автомобиль, номер записи..."
            className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground focus:outline-none"
          />
          {search && (
            <button onClick={() => setSearch("")}>
              <Icon name="X" size={12} className="text-muted-foreground hover:text-foreground" />
            </button>
          )}
        </div>

        {/* Status filter */}
        <div className="flex items-center gap-1">
          <button
            onClick={() => { setStatusFilter(""); setOffset(0); }}
            className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
              statusFilter === "" ? "text-white" : "text-muted-foreground hover:text-foreground hover:bg-secondary"
            }`}
            style={statusFilter === "" ? { background: "hsl(var(--primary))" } : {}}
          >
            Все
          </button>
          {ALL_STATUSES.map((s) => {
            const cfg = STATUS_CONFIG[s];
            return (
              <button
                key={s}
                onClick={() => { setStatusFilter(s); setOffset(0); }}
                className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                  statusFilter === s ? `${cfg.bg} ${cfg.text}` : "text-muted-foreground hover:text-foreground hover:bg-secondary"
                }`}
              >
                {cfg.label}
              </button>
            );
          })}
        </div>

        <button
          onClick={load}
          className="w-8 h-8 flex items-center justify-center rounded-md hover:bg-secondary transition-colors"
        >
          <Icon name="RefreshCw" size={14} className="text-muted-foreground" />
        </button>

        <button
          onClick={() => setShowCreate(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium text-white hover:opacity-90 transition-opacity"
          style={{ background: "hsl(var(--primary))" }}
        >
          <Icon name="Plus" size={15} className="text-white" />
          Создать
        </button>
      </div>

      {/* Счётчик */}
      <div className="text-xs text-muted-foreground">
        {loading ? "Загрузка..." : `Найдено: ${total}`}
      </div>

      {/* Таблица */}
      <div className="rounded-lg border overflow-hidden" style={{ background: "hsl(var(--card))", borderColor: "hsl(var(--border))" }}>
        {/* Шапка */}
        <div
          className="grid text-xs font-semibold uppercase tracking-wide text-muted-foreground px-4 py-3 border-b"
          style={{ gridTemplateColumns: "120px 1fr 1fr 160px 120px 120px", borderColor: "hsl(var(--border))" }}
        >
          <span>Номер</span>
          <span>Клиент</span>
          <span>Автомобиль</span>
          <span>Дата записи</span>
          <span>Статус</span>
          <span>Действия</span>
        </div>

        {/* Строки */}
        {error ? (
          <div className="flex flex-col items-center justify-center py-16 gap-3">
            <Icon name="AlertCircle" size={32} className="text-red-400" />
            <p className="text-sm text-red-400">{error}</p>
            <button onClick={load} className="text-xs text-primary hover:underline">Повторить</button>
          </div>
        ) : loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="w-6 h-6 rounded-full border-2 border-primary border-t-transparent animate-spin" />
          </div>
        ) : items.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 gap-3">
            <Icon name="CalendarClock" size={36} className="text-muted-foreground opacity-40" />
            <p className="text-sm text-muted-foreground">Записей не найдено</p>
            <button
              onClick={() => setShowCreate(true)}
              className="text-xs text-primary hover:underline"
            >
              Создать первую запись
            </button>
          </div>
        ) : (
          items.map((a, i) => (
            <div
              key={a.id}
              className="grid items-center px-4 py-3 table-row-hover transition-colors cursor-pointer"
              style={{
                gridTemplateColumns: "120px 1fr 1fr 160px 120px 120px",
                borderBottom: i < items.length - 1 ? "1px solid hsl(var(--border))" : "none",
              }}
            >
              <span className="font-mono text-xs text-primary">{a.number}</span>

              <div className="min-w-0">
                <p className="text-sm font-medium text-foreground truncate">{a.client_name ?? "—"}</p>
                {a.client_phone && (
                  <p className="text-xs text-muted-foreground truncate">{a.client_phone}</p>
                )}
              </div>

              <div className="min-w-0">
                {a.car_brand ? (
                  <>
                    <p className="text-sm text-foreground truncate">{a.car_brand} {a.car_model}</p>
                    <p className="text-xs text-muted-foreground truncate">{a.car_plate ?? ""} {a.car_year ? `· ${a.car_year}` : ""}</p>
                  </>
                ) : (
                  <p className="text-sm text-muted-foreground">—</p>
                )}
              </div>

              <span className="text-xs text-muted-foreground">{formatDateTime(a.scheduled_at)}</span>

              <div>
                <select
                  value={a.status}
                  onChange={(e) => handleStatusChange(a.id, e.target.value)}
                  onClick={(e) => e.stopPropagation()}
                  className="text-xs rounded px-1.5 py-1 focus:outline-none cursor-pointer"
                  style={{ background: "transparent", border: "none" }}
                >
                  {ALL_STATUSES.map((s) => (
                    <option key={s} value={s}>{STATUS_CONFIG[s].label}</option>
                  ))}
                </select>
                <StatusBadge status={a.status} />
              </div>

              <div className="flex items-center gap-1">
                <button
                  className="w-7 h-7 flex items-center justify-center rounded hover:bg-secondary transition-colors"
                  title="Открыть"
                >
                  <Icon name="Eye" size={14} className="text-muted-foreground" />
                </button>
                <button
                  className="w-7 h-7 flex items-center justify-center rounded hover:bg-secondary transition-colors"
                  title="Редактировать"
                >
                  <Icon name="Pencil" size={14} className="text-muted-foreground" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Пагинация */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between pt-1">
          <span className="text-xs text-muted-foreground">
            Страница {currentPage} из {totalPages}
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setOffset(Math.max(0, offset - LIMIT))}
              disabled={offset === 0}
              className="w-8 h-8 flex items-center justify-center rounded-md hover:bg-secondary transition-colors disabled:opacity-30"
            >
              <Icon name="ChevronLeft" size={16} className="text-muted-foreground" />
            </button>
            <button
              onClick={() => setOffset(offset + LIMIT)}
              disabled={offset + LIMIT >= total}
              className="w-8 h-8 flex items-center justify-center rounded-md hover:bg-secondary transition-colors disabled:opacity-30"
            >
              <Icon name="ChevronRight" size={16} className="text-muted-foreground" />
            </button>
          </div>
        </div>
      )}

      {showCreate && (
        <CreateModal onClose={() => setShowCreate(false)} onCreated={load} />
      )}
    </div>
  );
}
