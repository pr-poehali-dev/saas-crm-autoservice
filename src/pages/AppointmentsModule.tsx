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
}

interface LockItem {
  empId: number;
  startSlot: number;
  duration: number;
  label: string;
}

const SLOT_H = 56;
const COL_W = 176;

const employees: Employee[] = [
  { id: 1, name: "Иван С.", role: "Моторист", color: "bg-blue-500/15 text-blue-400", borderColor: "rgb(59,130,246)" },
  { id: 2, name: "Алексей Д.", role: "Электрик", color: "bg-yellow-500/15 text-yellow-400", borderColor: "rgb(234,179,8)" },
  { id: 3, name: "Сергей В.", role: "Ходовая", color: "bg-green-500/15 text-green-400", borderColor: "rgb(34,197,94)" },
  { id: 4, name: "Дмитрий К.", role: "Диагност", color: "bg-purple-500/15 text-purple-400", borderColor: "rgb(168,85,247)" },
  { id: 5, name: "Андрей М.", role: "Кузовщик", color: "bg-red-500/15 text-red-400", borderColor: "rgb(239,68,68)" },
  { id: 6, name: "Максим П.", role: "Маляр", color: "bg-pink-500/15 text-pink-400", borderColor: "rgb(236,72,153)" },
  { id: 7, name: "Владимир Т.", role: "Шиномонтаж", color: "bg-indigo-500/15 text-indigo-400", borderColor: "rgb(99,102,241)" },
];

const locks: LockItem[] = [
  { empId: 1, startSlot: 8, duration: 2, label: "Обед" },
  { empId: 4, startSlot: 14, duration: 2, label: "Обучение" },
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
    <div className="rounded-xl p-4" style={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))" }}>
      <div className="flex items-center justify-between mb-3">
        <span className="text-sm font-bold text-foreground">{MONTH_NAMES[viewMonth]} {viewYear}</span>
        <div className="flex gap-1">
          <button onClick={prev} className="p-1 rounded hover:bg-secondary text-muted-foreground"><Icon name="ChevronLeft" size={14} /></button>
          <button onClick={next} className="p-1 rounded hover:bg-secondary text-muted-foreground"><Icon name="ChevronRight" size={14} /></button>
        </div>
      </div>
      <div className="grid grid-cols-7 gap-1 text-center mb-2">
        {WEEK_DAYS.map((d) => <span key={d} className="text-[10px] font-bold text-muted-foreground uppercase">{d}</span>)}
      </div>
      <div className="grid grid-cols-7 gap-1">
        {Array.from({ length: startOffset }).map((_, i) => <div key={`e-${i}`} className="h-7" />)}
        {days.map((d) => (
          <button key={d} onClick={() => onSelect(new Date(viewYear, viewMonth, d))}
            className={`h-7 w-7 text-xs rounded-full flex items-center justify-center transition-colors
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
  });

  const set = (k: string, v: string | number) => setForm((f) => ({ ...f, [k]: v }));
  const canSubmit = form.customer.trim() && form.service.trim();

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
        <div className="flex items-center justify-between px-6 py-4 border-b" style={{ borderColor: "hsl(var(--border))" }}>
          <div>
            <h2 className="text-base font-bold text-foreground">{isEdit ? "Редактирование записи" : "Новая запись"}</h2>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-xs text-muted-foreground">{emp.name} · {emp.role}</span>
              <span className="text-xs font-bold" style={{ color: "hsl(var(--primary))" }}>{slotToTime(item.startSlot)}</span>
            </div>
          </div>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-secondary transition-colors">
            <Icon name="X" size={16} className="text-muted-foreground" />
          </button>
        </div>

        <div className="px-6 py-5 space-y-4 max-h-[60vh] overflow-y-auto">
          <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Клиент</div>
          <div className="grid grid-cols-2 gap-3">
            <InputField label="ФИО клиента" value={form.customer} onChange={(v) => set("customer", v)} placeholder="Иванов Иван" />
            <InputField label="Телефон" value={form.phone} onChange={(v) => set("phone", v)} placeholder="+7 999 123-45-67" type="tel" />
          </div>

          <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest pt-2">Автомобиль</div>
          <div className="grid grid-cols-3 gap-3">
            <InputField label="Марка" value={form.carBrand} onChange={(v) => set("carBrand", v)} placeholder="BMW" />
            <InputField label="Модель" value={form.carModel} onChange={(v) => set("carModel", v)} placeholder="X5" />
            <InputField label="Гос. номер" value={form.carPlate} onChange={(v) => set("carPlate", v)} placeholder="А123БВ777" />
          </div>

          <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest pt-2">Работы</div>
          <InputField label="Услуга / работа" value={form.service} onChange={(v) => set("service", v)} placeholder="Замена масла, диагностика..." />

          <div>
            <label className="block text-[11px] font-bold text-muted-foreground uppercase tracking-wide mb-1.5">Длительность</label>
            <div className="flex gap-2">
              {[1, 2, 3, 4, 6].map((d) => (
                <button key={d} onClick={() => set("duration", d)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${form.duration === d
                    ? "text-white" : "text-muted-foreground hover:bg-secondary"}`}
                  style={form.duration === d ? { background: "hsl(var(--primary))" } : {}}>
                  {d * 30} мин
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-muted-foreground uppercase tracking-wide mb-1.5">Примечание</label>
            <textarea rows={2} value={form.note} onChange={(e) => set("note", e.target.value)} placeholder="Любые заметки..."
              className="w-full px-3 py-2 rounded-lg text-sm text-foreground resize-none placeholder:text-muted-foreground/50 focus:outline-none focus:ring-1 focus:ring-[hsl(var(--primary))]"
              style={{ background: "hsl(var(--secondary))", border: "1px solid hsl(var(--border))" }} />
          </div>
        </div>

        <div className="flex gap-2 px-6 py-4 border-t" style={{ borderColor: "hsl(var(--border))" }}>
          {isEdit && onDelete && (
            <button onClick={() => { onDelete(item.id); onClose(); }}
              className="px-4 py-2.5 rounded-lg text-xs font-bold text-red-400 hover:bg-red-500/10 transition-colors flex items-center gap-1.5">
              <Icon name="Trash2" size={14} />
              Удалить
            </button>
          )}
          <div className="flex-1" />
          <button onClick={onClose}
            className="px-4 py-2.5 rounded-lg text-sm font-bold text-muted-foreground hover:bg-secondary transition-colors">
            Отмена
          </button>
          <button onClick={submit} disabled={!canSubmit}
            className="px-5 py-2.5 rounded-lg text-sm font-bold text-white hover:opacity-90 transition-opacity disabled:opacity-30"
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
    const relX = x - rect.left + gridRef.current.scrollLeft - 56;
    const idx = Math.max(0, Math.min(employees.length - 1, Math.floor(relX / COL_W)));
    return employees[idx].id;
  }, []);

  const isSlotOccupied = useCallback((empId: number, slot: number, duration: number, excludeId?: string) => {
    for (const it of items) {
      if (it.id === excludeId) continue;
      if (it.empId === empId && slot < it.startSlot + it.duration && slot + duration > it.startSlot) return true;
    }
    for (const lk of locks) {
      if (lk.empId === empId && slot < lk.startSlot + lk.duration && slot + duration > lk.startSlot) return true;
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
    if (isSlotOccupied(empId, slot, 2) && isSlotOccupied(empId, slot, 1)) return;
    const emp = employees.find((e) => e.id === empId)!;
    const dur = isSlotOccupied(empId, slot, 2) ? 1 : 2;
    const newItem: AppointmentItem = {
      id: genId(), empId, startSlot: slot, duration: dur,
      customer: "", phone: "", carBrand: "", carModel: "", carPlate: "", service: "", note: "",
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
      <aside className="w-72 flex-shrink-0 flex flex-col border-r overflow-y-auto"
        style={{ background: "hsl(var(--sidebar-background))", borderColor: "hsl(var(--border))" }}>
        <div className="p-5 space-y-5">
          <section>
            <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-3 px-1">Выберите дату</div>
            <MiniCalendar selectedDate={selectedDate} onSelect={setSelectedDate} />
          </section>

          <section>
            <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-3 px-1">Статистика</div>
            <div className="space-y-2">
              <div className="rounded-xl p-4" style={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))" }}>
                <div className="text-2xl font-black" style={{ color: "hsl(var(--primary))" }}>{items.length}</div>
                <div className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider mt-1">Записей на сегодня</div>
              </div>
              <div className="rounded-xl p-4" style={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))" }}>
                <div className="text-2xl font-black" style={{ color: "hsl(var(--primary))" }}>{employees.length}</div>
                <div className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider mt-1">Сотрудников на смене</div>
              </div>
            </div>
          </section>

          <section>
            <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-3 px-1">Сотрудники</div>
            <div className="space-y-1.5">
              {employees.map((emp) => (
                <div key={emp.id} className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-secondary/50 transition-colors cursor-pointer">
                  <div className="w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-black shrink-0"
                    style={{ background: "hsl(var(--secondary))", color: "hsl(var(--primary))" }}>
                    {empInitials(emp.name)}
                  </div>
                  <div className="min-w-0">
                    <div className="text-xs font-bold text-foreground truncate">{emp.name}</div>
                    <div className="text-[10px] font-bold uppercase tracking-wide" style={{ color: "hsl(var(--primary))" }}>{emp.role}</div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0">
        <div className="flex items-center justify-between px-5 shrink-0 border-b"
          style={{ height: 48, borderColor: "hsl(var(--border))", background: "hsl(var(--card))" }}>
          <div className="flex items-center gap-3">
            <Icon name="Calendar" size={16} className="text-muted-foreground" />
            <span className="text-sm font-bold text-foreground capitalize">{dayStr}</span>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => setSelectedDate(new Date())}
              className="px-3 py-1.5 rounded-md text-xs font-bold hover:bg-secondary transition-colors text-muted-foreground">
              Сегодня
            </button>
            <button onClick={() => handleCellClick(employees[0].id, 0)}
              className="flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-bold text-white hover:opacity-90 transition-opacity"
              style={{ background: "hsl(var(--primary))" }}>
              <Icon name="Plus" size={13} className="text-white" />
              Новая запись
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-auto" ref={gridRef}>
          <div className="inline-block min-w-full">
            <div className="sticky top-0 z-20 flex border-b" style={{ background: "hsl(var(--card))", borderColor: "hsl(var(--border))" }}>
              <div className="w-14 flex-shrink-0 border-r flex items-center justify-center"
                style={{ height: 48, borderColor: "hsl(var(--border))", background: "hsl(var(--secondary))" }}>
                <Icon name="Clock" size={14} className="text-muted-foreground" />
              </div>
              <div className="flex">
                {employees.map((emp) => (
                  <div key={emp.id} className="flex-shrink-0 border-r px-3 flex items-center gap-2.5"
                    style={{ width: COL_W, height: 48, borderColor: "hsl(var(--border))" }}>
                    <div className="w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-black shrink-0"
                      style={{ background: "hsl(var(--secondary))", color: "hsl(var(--primary))" }}>
                      {empInitials(emp.name)}
                    </div>
                    <div className="min-w-0">
                      <div className="text-xs font-bold text-foreground truncate">{emp.name}</div>
                      <div className="text-[10px] font-extrabold uppercase truncate" style={{ color: "hsl(var(--primary))" }}>{emp.role}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex relative">
              <div className="w-14 flex-shrink-0 border-r sticky left-0 z-10"
                style={{ borderColor: "hsl(var(--border))", background: "hsl(var(--secondary))" }}>
                {timeSlots.map((time) => (
                  <div key={time} className="border-b flex items-center justify-center text-[10px] font-bold text-muted-foreground"
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
                        <div className="w-full h-full p-1">
                          <div className="w-full h-full opacity-0 group-hover:opacity-100 border border-dashed rounded-lg flex items-center justify-center
                            text-[9px] font-bold uppercase transition-all hover:border-[hsl(var(--primary))] hover:text-[hsl(var(--primary))]"
                            style={{ borderColor: "hsl(var(--border))", color: "hsl(var(--muted-foreground))" }}>
                            +
                          </div>
                        </div>
                      </div>
                    ))}

                    {locks.filter((l) => l.empId === emp.id).map((lk, i) => (
                      <div key={`lock-${i}`} className="absolute left-0 right-0 px-1 pointer-events-none"
                        style={{ top: lk.startSlot * SLOT_H + 2, height: lk.duration * SLOT_H - 4 }}>
                        <div className="w-full h-full rounded-lg flex flex-col items-center justify-center text-[10px] font-bold uppercase tracking-tight"
                          style={{ background: "hsl(var(--secondary))", border: "1px solid hsl(var(--border))", color: "hsl(var(--muted-foreground))" }}>
                          <Icon name="Lock" size={11} className="mb-1 opacity-50" />
                          <span>{lk.label}</span>
                        </div>
                      </div>
                    ))}

                    {items.filter((it) => it.empId === emp.id).map((it) => (
                      <div key={it.id}
                        className={`absolute left-0 right-0 px-1 transition-opacity ${dragRef.current?.id === it.id && isDragging ? "opacity-30" : ""}`}
                        style={{ top: it.startSlot * SLOT_H + 2, height: it.duration * SLOT_H - 4, zIndex: 5 }}>
                        <div
                          className={`w-full h-full rounded-lg border-l-[3px] p-2.5 text-[11px] leading-tight cursor-grab active:cursor-grabbing
                            transition-shadow hover:shadow-lg relative ${emp.color}`}
                          style={{ borderLeftColor: emp.borderColor }}
                          onMouseDown={(e) => handleDragStart(e, it.id)}
                          onClick={(e) => handleItemClick(e, it.id)}>
                          <div className="font-black text-xs truncate uppercase tracking-tight">
                            {[it.carBrand, it.carModel].filter(Boolean).join(" ") || it.customer}
                          </div>
                          <div className="opacity-70 font-medium truncate mt-0.5">{it.service}</div>
                          {it.duration >= 3 && (
                            <div className="opacity-50 text-[10px] mt-1">{slotToTime(it.startSlot)} — {slotToTime(it.startSlot + it.duration)}</div>
                          )}
                        </div>
                        <div className="absolute bottom-0 left-1 right-1 h-3 cursor-s-resize rounded-b-lg hover:bg-white/10 transition-colors"
                          onMouseDown={(e) => handleResizeStart(e, it.id)} />
                      </div>
                    ))}
                  </div>
                ))}

                {dragGhost && isDragging && (
                  <div className="absolute pointer-events-none z-30 px-1"
                    style={{
                      left: employees.findIndex((e) => e.id === dragGhost.empId) * COL_W,
                      top: dragGhost.slot * SLOT_H + 2,
                      width: COL_W,
                      height: dragGhost.duration * SLOT_H - 4,
                    }}>
                    <div className="w-full h-full rounded-lg border-2 border-dashed"
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
