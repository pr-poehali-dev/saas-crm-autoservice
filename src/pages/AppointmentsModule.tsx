import { useState, useMemo, useRef, useCallback } from "react";
import Icon from "@/components/ui/icon";

interface Employee {
  id: number;
  name: string;
  role: string;
  color: string;
  borderColor: string;
}

interface AppointmentItem {
  id: string;
  empId: number;
  startSlot: number;
  duration: number;
  customer: string;
  phone: string;
  carBrand: string;
  carModel: string;
  carPlate: string;
  service: string;
  note: string;
  parts: PartLine[];
}

interface PartLine {
  name: string;
  sku: string;
  qty: number;
  price: number;
}

const SLOT_H = 40;
const COL_W = 160;

const employees: Employee[] = [
  { id: 1, name: "Иван С.", role: "Моторист", color: "bg-blue-500/15 text-blue-400", borderColor: "rgb(59,130,246)" },
  { id: 2, name: "Алексей Д.", role: "Электрик", color: "bg-yellow-500/15 text-yellow-400", borderColor: "rgb(234,179,8)" },
  { id: 3, name: "Сергей В.", role: "Ходовая", color: "bg-green-500/15 text-green-400", borderColor: "rgb(34,197,94)" },
  { id: 4, name: "Дмитрий К.", role: "Диагност", color: "bg-purple-500/15 text-purple-400", borderColor: "rgb(168,85,247)" },
  { id: 5, name: "Андрей М.", role: "Кузовщик", color: "bg-red-500/15 text-red-400", borderColor: "rgb(239,68,68)" },
  { id: 6, name: "Максим П.", role: "Маляр", color: "bg-pink-500/15 text-pink-400", borderColor: "rgb(236,72,153)" },
  { id: 7, name: "Владимир Т.", role: "Шиномонтаж", color: "bg-indigo-500/15 text-indigo-400", borderColor: "rgb(99,102,241)" },
];

const stockItems = [
  { name: "Масло моторное 5W-40", sku: "OIL-5W40", qty: 24, price: 3200 },
  { name: "Фильтр масляный", sku: "FLT-OIL-01", qty: 18, price: 450 },
  { name: "Фильтр воздушный", sku: "FLT-AIR-01", qty: 12, price: 620 },
  { name: "Колодки тормозные перед.", sku: "BRK-PAD-F", qty: 8, price: 2800 },
  { name: "Колодки тормозные задн.", sku: "BRK-PAD-R", qty: 6, price: 2200 },
  { name: "Свечи зажигания (4шт)", sku: "SPK-4SET", qty: 15, price: 1600 },
  { name: "Антифриз G12+ 5л", sku: "CLN-G12-5", qty: 10, price: 1100 },
  { name: "Ремень ГРМ", sku: "BLT-GRM", qty: 4, price: 4500 },
];

function generateTimeSlots() {
  const slots: string[] = [];
  for (let hour = 9; hour < 21; hour++) {
    slots.push(`${hour}:00`);
    slots.push(`${hour}:30`);
  }
  return slots;
}

const timeSlots = generateTimeSlots();

function slotToTime(slot: number): string {
  const hour = Math.floor(slot / 2) + 9;
  const min = slot % 2 === 0 ? "00" : "30";
  return `${hour}:${min}`;
}

let idCounter = 1;
function genId() { return `appt-${Date.now()}-${idCounter++}`; }

const WEEK_DAYS = ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"];
const MONTH_NAMES = [
  "Январь", "Февраль", "Март", "Апрель", "Май", "Июнь",
  "Июль", "Август", "Сентябрь", "Октябрь", "Ноябрь", "Декабрь",
];

function MiniCalendar({ selectedDate, onSelect }: { selectedDate: Date; onSelect: (d: Date) => void }) {
  const [viewMonth, setViewMonth] = useState(selectedDate.getMonth());
  const [viewYear, setViewYear] = useState(selectedDate.getFullYear());

  const { days, startOffset } = useMemo(() => {
    const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
    const firstDay = new Date(viewYear, viewMonth, 1).getDay();
    const offset = firstDay === 0 ? 6 : firstDay - 1;
    return { days: Array.from({ length: daysInMonth }, (_, i) => i + 1), startOffset: offset };
  }, [viewMonth, viewYear]);

  const prev = () => { if (viewMonth === 0) { setViewMonth(11); setViewYear(viewYear - 1); } else setViewMonth(viewMonth - 1); };
  const next = () => { if (viewMonth === 11) { setViewMonth(0); setViewYear(viewYear + 1); } else setViewMonth(viewMonth + 1); };

  const isSelected = (d: number) => d === selectedDate.getDate() && viewMonth === selectedDate.getMonth() && viewYear === selectedDate.getFullYear();
  const isToday = (d: number) => { const now = new Date(); return d === now.getDate() && viewMonth === now.getMonth() && viewYear === now.getFullYear(); };

  return (
    <div className="rounded-xl p-3" style={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))" }}>
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-bold text-foreground">{MONTH_NAMES[viewMonth]} {viewYear}</span>
        <div className="flex gap-0.5">
          <button onClick={prev} className="p-1 rounded hover:bg-secondary text-muted-foreground"><Icon name="ChevronLeft" size={12} /></button>
          <button onClick={next} className="p-1 rounded hover:bg-secondary text-muted-foreground"><Icon name="ChevronRight" size={12} /></button>
        </div>
      </div>
      <div className="grid grid-cols-7 gap-0.5 text-center mb-1">
        {WEEK_DAYS.map((d) => <span key={d} className="text-[9px] font-bold text-muted-foreground uppercase">{d}</span>)}
      </div>
      <div className="grid grid-cols-7 gap-0.5">
        {Array.from({ length: startOffset }).map((_, i) => <div key={`e-${i}`} className="h-6" />)}
        {days.map((d) => (
          <button key={d} onClick={() => onSelect(new Date(viewYear, viewMonth, d))}
            className={`h-6 w-6 text-[10px] rounded-full flex items-center justify-center transition-colors mx-auto
              ${isSelected(d) ? "bg-[hsl(var(--primary))] text-white font-bold" :
                isToday(d) ? "ring-1 ring-[hsl(var(--primary))] text-[hsl(var(--primary))] font-bold hover:bg-secondary" :
                "text-muted-foreground hover:bg-secondary"}`}
          >{d}</button>
        ))}
      </div>
    </div>
  );
}

function empInitials(name: string) { return name.split(" ").map((p) => p[0]).join("").toUpperCase(); }

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

function AppointmentModal({ item, emp, onClose, onSave, onDelete }: {
  item: AppointmentItem; emp: Employee; onClose: () => void;
  onSave: (data: AppointmentItem) => void; onDelete?: (id: string) => void;
}) {
  const isEdit = !!item.customer;
  const [form, setForm] = useState({
    customer: item.customer,
    phone: item.phone,
    carBrand: item.carBrand,
    carModel: item.carModel,
    carPlate: item.carPlate,
    service: item.service,
    note: item.note,
    duration: item.duration,
    parts: item.parts || [] as PartLine[],
  });
  const [partSearch, setPartSearch] = useState("");
  const [showPartPicker, setShowPartPicker] = useState(false);

  const set = (k: string, v: string | number) => setForm((f) => ({ ...f, [k]: v }));
  const canSubmit = form.customer.trim() && form.service.trim();

  const filteredStock = stockItems.filter((s) =>
    s.name.toLowerCase().includes(partSearch.toLowerCase()) || s.sku.toLowerCase().includes(partSearch.toLowerCase())
  );

  const addPart = (stock: typeof stockItems[0]) => {
    const existing = form.parts.find((p) => p.sku === stock.sku);
    if (existing) {
      setForm((f) => ({ ...f, parts: f.parts.map((p) => p.sku === stock.sku ? { ...p, qty: p.qty + 1 } : p) }));
    } else {
      setForm((f) => ({ ...f, parts: [...f.parts, { name: stock.name, sku: stock.sku, qty: 1, price: stock.price }] }));
    }
    setShowPartPicker(false);
    setPartSearch("");
  };

  const removePart = (sku: string) => {
    setForm((f) => ({ ...f, parts: f.parts.filter((p) => p.sku !== sku) }));
  };

  const updatePartQty = (sku: string, qty: number) => {
    if (qty < 1) return removePart(sku);
    setForm((f) => ({ ...f, parts: f.parts.map((p) => p.sku === sku ? { ...p, qty } : p) }));
  };

  const partsTotal = form.parts.reduce((sum, p) => sum + p.qty * p.price, 0);

  const submit = () => {
    if (!canSubmit) return;
    onSave({ ...item, ...form });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: "rgba(0,0,0,0.6)" }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="w-full max-w-lg rounded-xl border overflow-hidden animate-fade-in"
        style={{ background: "hsl(var(--card))", borderColor: "hsl(var(--border))" }}>
        <div className="flex items-center justify-between px-6 py-3 border-b" style={{ borderColor: "hsl(var(--border))" }}>
          <div>
            <h2 className="text-sm font-bold text-foreground">{isEdit ? "Редактирование записи" : "Новая запись"}</h2>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="text-xs text-muted-foreground">{emp.name} · {emp.role}</span>
              <span className="text-xs font-bold" style={{ color: "hsl(var(--primary))" }}>{slotToTime(item.startSlot)}</span>
            </div>
          </div>
          <button onClick={onClose} className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-secondary transition-colors">
            <Icon name="X" size={14} className="text-muted-foreground" />
          </button>
        </div>

        <div className="px-6 py-4 space-y-3 max-h-[65vh] overflow-y-auto">
          <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Клиент</div>
          <div className="grid grid-cols-2 gap-3">
            <InputField label="ФИО клиента" value={form.customer} onChange={(v) => set("customer", v)} placeholder="Иванов Иван" />
            <InputField label="Телефон" value={form.phone} onChange={(v) => set("phone", v)} placeholder="+7 999 123-45-67" type="tel" />
          </div>

          <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest pt-1">Автомобиль</div>
          <div className="grid grid-cols-3 gap-3">
            <InputField label="Марка" value={form.carBrand} onChange={(v) => set("carBrand", v)} placeholder="BMW" />
            <InputField label="Модель" value={form.carModel} onChange={(v) => set("carModel", v)} placeholder="X5" />
            <InputField label="Гос. номер" value={form.carPlate} onChange={(v) => set("carPlate", v)} placeholder="А123БВ777" />
          </div>

          <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest pt-1">Работы</div>
          <InputField label="Услуга / работа" value={form.service} onChange={(v) => set("service", v)} placeholder="Замена масла, диагностика..." />

          <div>
            <label className="block text-[11px] font-bold text-muted-foreground uppercase tracking-wide mb-1.5">Длительность</label>
            <div className="flex gap-1.5">
              {[1, 2, 3, 4, 6].map((d) => (
                <button key={d} onClick={() => set("duration", d)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-colors ${form.duration === d
                    ? "text-white" : "text-muted-foreground hover:bg-secondary"}`}
                  style={form.duration === d ? { background: "hsl(var(--primary))" } : {}}>
                  {d * 30}м
                </button>
              ))}
            </div>
          </div>

          <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest pt-1 flex items-center justify-between">
            <span>Запчасти со склада</span>
            {partsTotal > 0 && <span style={{ color: "hsl(var(--primary))" }}>{partsTotal.toLocaleString("ru-RU")} ₽</span>}
          </div>

          {form.parts.length > 0 && (
            <div className="space-y-1.5">
              {form.parts.map((p) => (
                <div key={p.sku} className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs"
                  style={{ background: "hsl(var(--secondary))", border: "1px solid hsl(var(--border))" }}>
                  <div className="flex-1 min-w-0">
                    <div className="font-bold text-foreground truncate">{p.name}</div>
                    <div className="text-muted-foreground text-[10px]">{p.sku} · {p.price.toLocaleString("ru-RU")} ₽/шт</div>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <button onClick={() => updatePartQty(p.sku, p.qty - 1)}
                      className="w-5 h-5 rounded flex items-center justify-center hover:bg-secondary text-muted-foreground">
                      <Icon name="Minus" size={10} />
                    </button>
                    <span className="text-xs font-bold text-foreground w-5 text-center">{p.qty}</span>
                    <button onClick={() => updatePartQty(p.sku, p.qty + 1)}
                      className="w-5 h-5 rounded flex items-center justify-center hover:bg-secondary text-muted-foreground">
                      <Icon name="Plus" size={10} />
                    </button>
                  </div>
                  <button onClick={() => removePart(p.sku)} className="text-red-400 hover:text-red-300 shrink-0">
                    <Icon name="X" size={12} />
                  </button>
                </div>
              ))}
            </div>
          )}

          <div className="relative">
            <button onClick={() => setShowPartPicker(!showPartPicker)}
              className="flex items-center gap-1.5 text-xs font-bold transition-colors hover:opacity-80"
              style={{ color: "hsl(var(--primary))" }}>
              <Icon name="Plus" size={12} />
              Добавить запчасть
            </button>

            {showPartPicker && (
              <div className="absolute left-0 right-0 top-7 z-10 rounded-lg border shadow-xl p-2 max-h-48 overflow-y-auto"
                style={{ background: "hsl(var(--card))", borderColor: "hsl(var(--border))" }}>
                <input value={partSearch} onChange={(e) => setPartSearch(e.target.value)} placeholder="Поиск по названию или артикулу..."
                  autoFocus
                  className="w-full px-2.5 py-1.5 rounded-md text-xs text-foreground placeholder:text-muted-foreground/50 focus:outline-none mb-1.5"
                  style={{ background: "hsl(var(--secondary))", border: "1px solid hsl(var(--border))" }} />
                {filteredStock.map((s) => (
                  <button key={s.sku} onClick={() => addPart(s)}
                    className="w-full text-left px-2.5 py-2 rounded-md text-xs hover:bg-secondary transition-colors flex items-center justify-between">
                    <div>
                      <div className="font-bold text-foreground">{s.name}</div>
                      <div className="text-muted-foreground text-[10px]">{s.sku} · в наличии: {s.qty}</div>
                    </div>
                    <span className="text-muted-foreground shrink-0">{s.price.toLocaleString("ru-RU")} ₽</span>
                  </button>
                ))}
                {filteredStock.length === 0 && <div className="text-xs text-muted-foreground px-2 py-2">Ничего не найдено</div>}
              </div>
            )}
          </div>

          <div>
            <label className="block text-[11px] font-bold text-muted-foreground uppercase tracking-wide mb-1.5">Примечание</label>
            <textarea rows={2} value={form.note} onChange={(e) => set("note", e.target.value)} placeholder="Любые заметки..."
              className="w-full px-3 py-2 rounded-lg text-sm text-foreground resize-none placeholder:text-muted-foreground/50 focus:outline-none focus:ring-1 focus:ring-[hsl(var(--primary))]"
              style={{ background: "hsl(var(--secondary))", border: "1px solid hsl(var(--border))" }} />
          </div>
        </div>

        <div className="flex gap-2 px-6 py-3 border-t" style={{ borderColor: "hsl(var(--border))" }}>
          {isEdit && onDelete && (
            <button onClick={() => { onDelete(item.id); onClose(); }}
              className="px-3 py-2 rounded-lg text-xs font-bold text-red-400 hover:bg-red-500/10 transition-colors flex items-center gap-1.5">
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
            {isEdit ? "Сохранить" : "Записать"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function AppointmentsModule() {
  const [selectedDate, setSelectedDate] = useState(new Date(2026, 2, 25));
  const [items, setItems] = useState<AppointmentItem[]>([]);
  const [modalState, setModalState] = useState<{ item: AppointmentItem; emp: Employee } | null>(null);

  const dragRef = useRef<{ id: string; offsetSlot: number } | null>(null);
  const [dragGhost, setDragGhost] = useState<{ empId: number; slot: number; duration: number } | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const gridRef = useRef<HTMLDivElement>(null);
  const clickBlockRef = useRef(false);

  const dayStr = selectedDate.toLocaleDateString("ru-RU", { weekday: "long", day: "numeric", month: "long", year: "numeric" });

  const getSlotFromY = useCallback((y: number): number => {
    if (!gridRef.current) return 0;
    const rect = gridRef.current.getBoundingClientRect();
    const relY = y - rect.top + gridRef.current.scrollTop;
    return Math.max(0, Math.min(timeSlots.length - 1, Math.floor(relY / SLOT_H)));
  }, []);

  const getEmpFromX = useCallback((x: number): number => {
    if (!gridRef.current) return employees[0].id;
    const rect = gridRef.current.getBoundingClientRect();
    const relX = x - rect.left + gridRef.current.scrollLeft - 48;
    const idx = Math.max(0, Math.min(employees.length - 1, Math.floor(relX / COL_W)));
    return employees[idx].id;
  }, []);

  const isSlotOccupied = useCallback((empId: number, slot: number, duration: number, excludeId?: string) => {
    for (const it of items) {
      if (it.id === excludeId) continue;
      if (it.empId === empId && slot < it.startSlot + it.duration && slot + duration > it.startSlot) return true;
    }
    return false;
  }, [items]);

  const handleDragStart = (e: React.MouseEvent, id: string) => {
    e.preventDefault();
    e.stopPropagation();
    const item = items.find((i) => i.id === id);
    if (!item) return;
    const slot = getSlotFromY(e.clientY);
    dragRef.current = { id, offsetSlot: slot - item.startSlot };
    setDragGhost({ empId: item.empId, slot: item.startSlot, duration: item.duration });
    clickBlockRef.current = false;

    const onMove = (ev: MouseEvent) => {
      clickBlockRef.current = true;
      setIsDragging(true);
      const newSlot = Math.max(0, Math.min(timeSlots.length - 1, getSlotFromY(ev.clientY) - (dragRef.current?.offsetSlot || 0)));
      const newEmp = getEmpFromX(ev.clientX);
      setDragGhost({ empId: newEmp, slot: newSlot, duration: item.duration });
    };

    const onUp = (ev: MouseEvent) => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
      if (clickBlockRef.current) {
        const finalSlot = Math.max(0, Math.min(timeSlots.length - item.duration, getSlotFromY(ev.clientY) - (dragRef.current?.offsetSlot || 0)));
        const finalEmp = getEmpFromX(ev.clientX);
        if (!isSlotOccupied(finalEmp, finalSlot, item.duration, id)) {
          setItems((prev) => prev.map((i) => i.id === id ? { ...i, empId: finalEmp, startSlot: finalSlot } : i));
        }
      }
      setIsDragging(false);
      setDragGhost(null);
      dragRef.current = null;
      setTimeout(() => { clickBlockRef.current = false; }, 50);
    };

    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
  };

  const handleResizeStart = (e: React.MouseEvent, id: string) => {
    e.preventDefault();
    e.stopPropagation();
    clickBlockRef.current = true;
    const item = items.find((i) => i.id === id);
    if (!item) return;
    setIsResizing(true);

    const onMove = (ev: MouseEvent) => {
      const slot = getSlotFromY(ev.clientY);
      const newDuration = Math.max(1, Math.min(12, slot - item.startSlot + 1));
      if (!isSlotOccupied(item.empId, item.startSlot, newDuration, id)) {
        setItems((prev) => prev.map((i) => i.id === id ? { ...i, duration: newDuration } : i));
      }
    };

    const onUp = () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
      setIsResizing(false);
      setTimeout(() => { clickBlockRef.current = false; }, 50);
    };

    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
  };

  const handleCellClick = (empId: number, slot: number) => {
    if (isDragging || isResizing || clickBlockRef.current) return;
    if (isSlotOccupied(empId, slot, 1)) return;
    const emp = employees.find((e) => e.id === empId)!;
    const dur = isSlotOccupied(empId, slot, 2) ? 1 : 2;
    const newItem: AppointmentItem = {
      id: genId(), empId, startSlot: slot, duration: dur,
      customer: "", phone: "", carBrand: "", carModel: "", carPlate: "", service: "", note: "", parts: [],
    };
    setModalState({ item: newItem, emp });
  };

  const handleItemClick = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (isDragging || isResizing || clickBlockRef.current) return;
    const item = items.find((i) => i.id === id);
    if (!item) return;
    const emp = employees.find((em) => em.id === item.empId)!;
    setModalState({ item, emp });
  };

  const handleSave = (data: AppointmentItem) => {
    setItems((prev) => {
      const exists = prev.find((i) => i.id === data.id);
      if (exists) return prev.map((i) => i.id === data.id ? data : i);
      return [...prev, data];
    });
  };

  const handleDelete = (id: string) => {
    setItems((prev) => prev.filter((i) => i.id !== id));
  };

  return (
    <div className="flex gap-0 h-full">
      <aside className="w-64 flex-shrink-0 flex flex-col border-r overflow-y-auto"
        style={{ background: "hsl(var(--sidebar-background))", borderColor: "hsl(var(--border))" }}>
        <div className="p-4 space-y-4">
          <section>
            <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-2 px-1 flex items-center gap-1.5">
              <Icon name="Warehouse" size={11} className="text-muted-foreground" />
              Склад
            </div>
            <div className="space-y-1">
              {stockItems.slice(0, 5).map((s) => (
                <div key={s.sku} className="flex items-center justify-between px-2.5 py-1.5 rounded-lg text-[11px]"
                  style={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))" }}>
                  <div className="min-w-0 flex-1">
                    <div className="font-bold text-foreground truncate">{s.name}</div>
                    <div className="text-muted-foreground text-[9px]">{s.sku}</div>
                  </div>
                  <span className={`text-[10px] font-black shrink-0 ml-2 ${s.qty <= 5 ? "text-red-400" : s.qty <= 10 ? "text-yellow-400" : "text-green-400"}`}>
                    {s.qty} шт
                  </span>
                </div>
              ))}
              <button className="w-full text-[10px] font-bold py-1.5 rounded-lg hover:bg-secondary transition-colors"
                style={{ color: "hsl(var(--primary))" }}>
                Весь склад →
              </button>
            </div>
          </section>

          <section>
            <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-2 px-1">Дата</div>
            <MiniCalendar selectedDate={selectedDate} onSelect={setSelectedDate} />
          </section>

          <section>
            <div className="space-y-1.5">
              <div className="rounded-lg px-3 py-2.5 flex items-center justify-between" style={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))" }}>
                <span className="text-[10px] text-muted-foreground font-bold uppercase">Записей</span>
                <span className="text-lg font-black" style={{ color: "hsl(var(--primary))" }}>{items.length}</span>
              </div>
            </div>
          </section>
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0">
        <div className="flex items-center justify-between px-4 shrink-0 border-b"
          style={{ height: 42, borderColor: "hsl(var(--border))", background: "hsl(var(--card))" }}>
          <div className="flex items-center gap-2">
            <Icon name="Calendar" size={14} className="text-muted-foreground" />
            <span className="text-xs font-bold text-foreground capitalize">{dayStr}</span>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => setSelectedDate(new Date())}
              className="px-2.5 py-1 rounded-md text-[11px] font-bold hover:bg-secondary transition-colors text-muted-foreground">
              Сегодня
            </button>
            <button onClick={() => handleCellClick(employees[0].id, 0)}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-bold text-white hover:opacity-90 transition-opacity"
              style={{ background: "hsl(var(--primary))" }}>
              <Icon name="Plus" size={11} className="text-white" />
              Запись
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-auto" ref={gridRef}>
          <div className="inline-block min-w-full">
            <div className="sticky top-0 z-20 flex border-b" style={{ background: "hsl(var(--card))", borderColor: "hsl(var(--border))" }}>
              <div className="w-12 flex-shrink-0 border-r flex items-center justify-center"
                style={{ height: 40, borderColor: "hsl(var(--border))", background: "hsl(var(--secondary))" }}>
                <Icon name="Clock" size={12} className="text-muted-foreground" />
              </div>
              <div className="flex">
                {employees.map((emp) => (
                  <div key={emp.id} className="flex-shrink-0 border-r px-2 flex items-center gap-2"
                    style={{ width: COL_W, height: 40, borderColor: "hsl(var(--border))" }}>
                    <div className="w-7 h-7 rounded-full flex items-center justify-center text-[9px] font-black shrink-0"
                      style={{ background: "hsl(var(--secondary))", color: "hsl(var(--primary))" }}>
                      {empInitials(emp.name)}
                    </div>
                    <div className="min-w-0">
                      <div className="text-[11px] font-bold text-foreground truncate">{emp.name}</div>
                      <div className="text-[9px] font-extrabold uppercase truncate" style={{ color: "hsl(var(--primary))" }}>{emp.role}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex relative">
              <div className="w-12 flex-shrink-0 border-r sticky left-0 z-10"
                style={{ borderColor: "hsl(var(--border))", background: "hsl(var(--secondary))" }}>
                {timeSlots.map((time) => (
                  <div key={time} className="border-b flex items-center justify-center text-[9px] font-bold text-muted-foreground"
                    style={{ height: SLOT_H, borderColor: "hsl(var(--border))" }}>
                    {time}
                  </div>
                ))}
              </div>

              <div className="flex relative">
                {employees.map((emp) => (
                  <div key={emp.id} className="flex-shrink-0 border-r relative"
                    style={{ width: COL_W, borderColor: "hsl(var(--border))" }}>
                    {timeSlots.map((_, slotIdx) => (
                      <div key={slotIdx} className="border-b group cursor-pointer"
                        style={{ height: SLOT_H, borderColor: "hsl(var(--border))" }}
                        onClick={() => handleCellClick(emp.id, slotIdx)}>
                        <div className="w-full h-full p-0.5">
                          <div className="w-full h-full opacity-0 group-hover:opacity-100 border border-dashed rounded flex items-center justify-center
                            text-[8px] font-bold uppercase transition-all hover:border-[hsl(var(--primary))] hover:text-[hsl(var(--primary))]"
                            style={{ borderColor: "hsl(var(--border))", color: "hsl(var(--muted-foreground))" }}>
                            +
                          </div>
                        </div>
                      </div>
                    ))}

                    {items.filter((it) => it.empId === emp.id).map((it) => (
                      <div key={it.id}
                        className={`absolute left-0 right-0 px-0.5 transition-opacity ${dragRef.current?.id === it.id && isDragging ? "opacity-30" : ""}`}
                        style={{ top: it.startSlot * SLOT_H + 1, height: it.duration * SLOT_H - 2, zIndex: 5 }}>
                        <div
                          className={`w-full h-full rounded border-l-[3px] px-2 py-1 text-[10px] leading-tight cursor-grab active:cursor-grabbing
                            transition-shadow hover:shadow-lg relative overflow-hidden ${emp.color}`}
                          style={{ borderLeftColor: emp.borderColor }}
                          onMouseDown={(e) => handleDragStart(e, it.id)}
                          onClick={(e) => handleItemClick(e, it.id)}>
                          <div className="font-black truncate uppercase tracking-tight" style={{ fontSize: 10 }}>
                            {[it.carBrand, it.carModel].filter(Boolean).join(" ") || it.customer}
                          </div>
                          <div className="opacity-70 font-medium truncate" style={{ fontSize: 9 }}>{it.service}</div>
                          {it.parts.length > 0 && (
                            <div className="flex items-center gap-0.5 opacity-50 mt-0.5" style={{ fontSize: 8 }}>
                              <Icon name="Package" size={8} />
                              <span>{it.parts.length}</span>
                            </div>
                          )}
                        </div>
                        <div className="absolute bottom-0 left-0.5 right-0.5 h-2.5 cursor-s-resize rounded-b hover:bg-white/10 transition-colors"
                          onMouseDown={(e) => handleResizeStart(e, it.id)} />
                      </div>
                    ))}
                  </div>
                ))}

                {dragGhost && isDragging && (
                  <div className="absolute pointer-events-none z-30 px-0.5"
                    style={{
                      left: employees.findIndex((e) => e.id === dragGhost.empId) * COL_W,
                      top: dragGhost.slot * SLOT_H + 1,
                      width: COL_W,
                      height: dragGhost.duration * SLOT_H - 2,
                    }}>
                    <div className="w-full h-full rounded border-2 border-dashed"
                      style={{ borderColor: "hsl(var(--primary))", background: "hsl(var(--primary) / 0.1)" }} />
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {modalState && (
        <AppointmentModal
          item={modalState.item}
          emp={modalState.emp}
          onClose={() => setModalState(null)}
          onSave={handleSave}
          onDelete={modalState.item.customer ? handleDelete : undefined}
        />
      )}
    </div>
  );
}
