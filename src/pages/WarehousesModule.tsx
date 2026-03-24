import { useState } from "react";
import Icon from "@/components/ui/icon";

interface Warehouse {
  id: string;
  name: string;
  address: string;
  phone: string;
  isDefault: boolean;
  isActive: boolean;
}

let idCounter = 1;
function genId() { return `wh-${Date.now()}-${idCounter++}`; }

function InputField({ label, value, onChange, placeholder, type = "text" }: {
  label: string; value: string; onChange: (v: string) => void; placeholder?: string; type?: string;
}) {
  return (
    <div>
      <label className="block text-[11px] font-bold text-muted-foreground uppercase tracking-wide mb-1.5">{label}</label>
      <input type={type} value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder}
        className="w-full px-3 py-2 rounded-lg text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-1 focus:ring-[hsl(var(--primary))]"
        style={{ background: "hsl(var(--secondary))", border: "1px solid hsl(var(--border))" }} />
    </div>
  );
}

function WarehouseModal({ item, onClose, onSave, onDelete }: {
  item: Warehouse | null; onClose: () => void;
  onSave: (data: Warehouse) => void; onDelete?: (id: string) => void;
}) {
  const isEdit = !!item?.name;
  const [form, setForm] = useState({
    name: item?.name || "",
    address: item?.address || "",
    phone: item?.phone || "",
    isDefault: item?.isDefault || false,
  });

  const canSubmit = form.name.trim();

  const submit = () => {
    if (!canSubmit) return;
    onSave({
      id: item?.id || genId(),
      name: form.name,
      address: form.address,
      phone: form.phone,
      isDefault: form.isDefault,
      isActive: true,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: "rgba(0,0,0,0.4)" }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="w-full max-w-md rounded-xl border overflow-hidden animate-fade-in"
        style={{ background: "hsl(var(--card))", borderColor: "hsl(var(--border))" }}>
        <div className="flex items-center justify-between px-6 py-4 border-b" style={{ borderColor: "hsl(var(--border))" }}>
          <h2 className="text-sm font-bold text-foreground">{isEdit ? "Редактирование склада" : "Новый склад"}</h2>
          <button onClick={onClose} className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-secondary transition-colors">
            <Icon name="X" size={14} className="text-muted-foreground" />
          </button>
        </div>

        <div className="px-6 py-5 space-y-4">
          <InputField label="Название" value={form.name} onChange={(v) => setForm((f) => ({ ...f, name: v }))} placeholder="Основной склад" />
          <InputField label="Адрес" value={form.address} onChange={(v) => setForm((f) => ({ ...f, address: v }))} placeholder="г. Москва, ул. Примерная, д. 1" />
          <InputField label="Телефон" value={form.phone} onChange={(v) => setForm((f) => ({ ...f, phone: v }))} placeholder="+7 999 123-45-67" type="tel" />

          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={form.isDefault} onChange={(e) => setForm((f) => ({ ...f, isDefault: e.target.checked }))}
              className="rounded border-border" />
            <span className="text-sm text-foreground">Основной склад</span>
          </label>
        </div>

        <div className="flex gap-2 px-6 py-4 border-t" style={{ borderColor: "hsl(var(--border))" }}>
          {isEdit && onDelete && (
            <button onClick={() => { onDelete(item!.id); onClose(); }}
              className="px-3 py-2 rounded-lg text-xs font-bold text-red-500 hover:bg-red-500/10 transition-colors flex items-center gap-1.5">
              <Icon name="Trash2" size={13} />
              Удалить
            </button>
          )}
          <div className="flex-1" />
          <button onClick={onClose}
            className="px-4 py-2 rounded-lg text-sm font-bold text-muted-foreground hover:bg-secondary transition-colors">
            Отмена
          </button>
          <button onClick={submit} disabled={!canSubmit}
            className="px-5 py-2 rounded-lg text-sm font-bold text-white hover:opacity-90 transition-opacity disabled:opacity-30"
            style={{ background: "hsl(var(--primary))" }}>
            {isEdit ? "Сохранить" : "Создать"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function WarehousesModule() {
  const [items, setItems] = useState<Warehouse[]>([]);
  const [modal, setModal] = useState<Warehouse | null | "new">(null);

  const handleSave = (data: Warehouse) => {
    setItems((prev) => {
      const exists = prev.find((i) => i.id === data.id);
      if (data.isDefault) {
        prev = prev.map((i) => ({ ...i, isDefault: false }));
      }
      if (exists) return prev.map((i) => i.id === data.id ? data : i);
      return [...prev, data];
    });
  };

  const handleDelete = (id: string) => {
    setItems((prev) => prev.filter((i) => i.id !== id));
  };

  const toggleActive = (id: string) => {
    setItems((prev) => prev.map((i) => i.id === id ? { ...i, isActive: !i.isActive } : i));
  };

  return (
    <div>
      {items.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-4 animate-fade-in" style={{ minHeight: 400 }}>
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center" style={{ background: "hsl(210 100% 50% / 0.1)" }}>
            <Icon name="Warehouse" size={32} className="text-primary" />
          </div>
          <div className="text-center">
            <h2 className="text-xl font-semibold text-foreground mb-1">Нет складов</h2>
            <p className="text-sm text-muted-foreground">Добавьте первый склад для управления запасами</p>
          </div>
          <button onClick={() => setModal("new")}
            className="mt-2 px-4 py-2 rounded-md text-sm font-medium text-white transition-opacity hover:opacity-90"
            style={{ background: "hsl(var(--primary))" }}>
            Добавить склад
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {items.map((wh) => (
            <div key={wh.id} className="rounded-xl border p-5 transition-all hover:shadow-md cursor-pointer"
              style={{ background: "hsl(var(--card))", borderColor: wh.isDefault ? "hsl(var(--primary) / 0.4)" : "hsl(var(--border))" }}
              onClick={() => setModal(wh)}>
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0"
                    style={{ background: "hsl(var(--primary) / 0.1)" }}>
                    <Icon name="Warehouse" size={20} className="text-primary" />
                  </div>
                  <div>
                    <div className="text-sm font-bold text-foreground">{wh.name}</div>
                    {wh.isDefault && (
                      <span className="text-[10px] font-bold uppercase tracking-wide" style={{ color: "hsl(var(--primary))" }}>Основной</span>
                    )}
                  </div>
                </div>
                <button onClick={(e) => { e.stopPropagation(); toggleActive(wh.id); }}
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${wh.isActive ? "bg-green-500/15 text-green-600" : "bg-red-500/15 text-red-500"}`}>
                  {wh.isActive ? "Активен" : "Неактивен"}
                </button>
              </div>

              {wh.address && (
                <div className="flex items-start gap-2 text-xs text-muted-foreground mb-2">
                  <Icon name="MapPin" size={13} className="shrink-0 mt-0.5" />
                  <span>{wh.address}</span>
                </div>
              )}

              {wh.phone && (
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Icon name="Phone" size={13} className="shrink-0" />
                  <span>{wh.phone}</span>
                </div>
              )}
            </div>
          ))}

          <button onClick={() => setModal("new")}
            className="rounded-xl border-2 border-dashed p-5 flex flex-col items-center justify-center gap-2 transition-colors hover:border-[hsl(var(--primary))] hover:text-[hsl(var(--primary))] min-h-[140px]"
            style={{ borderColor: "hsl(var(--border))", color: "hsl(var(--muted-foreground))" }}>
            <Icon name="Plus" size={24} />
            <span className="text-sm font-bold">Добавить склад</span>
          </button>
        </div>
      )}

      {modal !== null && (
        <WarehouseModal
          item={modal === "new" ? null : modal}
          onClose={() => setModal(null)}
          onSave={handleSave}
          onDelete={modal !== "new" ? handleDelete : undefined}
        />
      )}
    </div>
  );
}
