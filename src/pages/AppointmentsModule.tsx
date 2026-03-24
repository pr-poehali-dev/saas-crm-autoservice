import { useState, useMemo, useRef, useCallback, useEffect } from "react";
import Icon from "@/components/ui/icon";
import { fetchWarehouses, type Warehouse } from "@/api/warehouses";

interface Employee { id: number; name: string; role: string; color: string; borderColor: string; }

interface AppointmentItem {
  id: string; empId: number; startSlot: number; duration: number;
  customer: string; phone: string; carBrand: string; carModel: string; carPlate: string;
  service: string; note: string; warehouseId: string; isLock: boolean;
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

function generateTimeSlots() {
  const s: string[] = [];
  for (let h = 9; h < 21; h++) { s.push(`${h}:00`); s.push(`${h}:30`); }
  return s;
}
const timeSlots = generateTimeSlots();

function slotToTime(slot: number) {
  return `${Math.floor(slot / 2) + 9}:${slot % 2 === 0 ? "00" : "30"}`;
}

let idC = 1;
function genId() { return `a-${Date.now()}-${idC++}`; }

const WEEK_DAYS = ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"];
const MONTHS = ["Январь","Февраль","Март","Апрель","Май","Июнь","Июль","Август","Сентябрь","Октябрь","Ноябрь","Декабрь"];

function MiniCalendar({ selectedDate, onSelect }: { selectedDate: Date; onSelect: (d: Date) => void }) {
  const [vm, setVm] = useState(selectedDate.getMonth());
  const [vy, setVy] = useState(selectedDate.getFullYear());
  const { days, off } = useMemo(() => {
    const dim = new Date(vy, vm + 1, 0).getDate();
    const fd = new Date(vy, vm, 1).getDay();
    return { days: Array.from({ length: dim }, (_, i) => i + 1), off: fd === 0 ? 6 : fd - 1 };
  }, [vm, vy]);
  const prev = () => { if (vm === 0) { setVm(11); setVy(vy - 1); } else setVm(vm - 1); };
  const next = () => { if (vm === 11) { setVm(0); setVy(vy + 1); } else setVm(vm + 1); };
  const isSel = (d: number) => d === selectedDate.getDate() && vm === selectedDate.getMonth() && vy === selectedDate.getFullYear();
  const isNow = (d: number) => { const n = new Date(); return d === n.getDate() && vm === n.getMonth() && vy === n.getFullYear(); };
  return (
    <div className="rounded-xl p-3" style={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))" }}>
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-bold text-foreground">{MONTHS[vm]} {vy}</span>
        <div className="flex gap-0.5">
          <button onClick={prev} className="p-1 rounded hover:bg-secondary text-muted-foreground"><Icon name="ChevronLeft" size={12} /></button>
          <button onClick={next} className="p-1 rounded hover:bg-secondary text-muted-foreground"><Icon name="ChevronRight" size={12} /></button>
        </div>
      </div>
      <div className="grid grid-cols-7 gap-0.5 text-center mb-1">
        {WEEK_DAYS.map((d) => <span key={d} className="text-[9px] font-bold text-muted-foreground uppercase">{d}</span>)}
      </div>
      <div className="grid grid-cols-7 gap-0.5">
        {Array.from({ length: off }).map((_, i) => <div key={`e-${i}`} className="h-6" />)}
        {days.map((d) => (
          <button key={d} onClick={() => onSelect(new Date(vy, vm, d))}
            className={`h-6 w-6 text-[10px] rounded-full flex items-center justify-center transition-colors mx-auto
              ${isSel(d) ? "bg-[hsl(var(--primary))] text-white font-bold" : isNow(d) ? "ring-1 ring-[hsl(var(--primary))] text-[hsl(var(--primary))] font-bold hover:bg-secondary" : "text-muted-foreground hover:bg-secondary"}`}
          >{d}</button>
        ))}
      </div>
    </div>
  );
}

function empInit(name: string) { return name.split(" ").map((p) => p[0]).join("").toUpperCase(); }

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

function AppointmentModal({ item, emp, warehouses, onClose, onSave, onDelete }: {
  item: AppointmentItem; emp: Employee; warehouses: Warehouse[];
  onClose: () => void; onSave: (data: AppointmentItem) => void; onDelete?: (id: string) => void;
}) {
  const isEdit = !!(item.customer || item.isLock);
  const [isLock, setIsLock] = useState(item.isLock);
  const [form, setForm] = useState({
    customer: item.customer, phone: item.phone,
    carBrand: item.carBrand, carModel: item.carModel, carPlate: item.carPlate,
    service: item.service, note: item.note, duration: item.duration, warehouseId: item.warehouseId || "",
  });
  const set = (k: string, v: string | number) => setForm((f) => ({ ...f, [k]: v }));
  const canSubmit = isLock || (form.customer.trim() && form.service.trim());

  const submit = () => {
    if (!canSubmit) return;
    onSave({ ...item, ...form, isLock });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: "rgba(0,0,0,0.5)" }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="w-full max-w-lg rounded-xl border overflow-hidden animate-fade-in"
        style={{ background: "hsl(var(--card))", borderColor: "hsl(var(--border))" }}>
        <div className="flex items-center justify-between px-6 py-3 border-b" style={{ borderColor: "hsl(var(--border))" }}>
          <div>
            <h2 className="text-sm font-bold text-foreground">{isEdit ? "Редактирование" : "Новая запись"}</h2>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="text-xs text-muted-foreground">{emp.name} · {emp.role}</span>
              <span className="text-xs font-bold" style={{ color: "hsl(var(--primary))" }}>{slotToTime(item.startSlot)}</span>
            </div>
          </div>
          <button onClick={onClose} className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-secondary"><Icon name="X" size={14} className="text-muted-foreground" /></button>
        </div>

        <div className="px-6 py-4 space-y-3 max-h-[65vh] overflow-y-auto">
          <label className="flex items-center justify-between cursor-pointer">
            <span className="text-xs font-bold text-foreground">Блокировка</span>
            <div className={`relative w-9 h-5 rounded-full transition-colors ${isLock ? "bg-[hsl(var(--primary))]" : "bg-[hsl(var(--border))]"}`}
              onClick={() => setIsLock(!isLock)}>
              <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${isLock ? "translate-x-4" : "translate-x-0.5"}`} />
            </div>
          </label>

          {!isLock && (
            <>
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
                <label className="block text-[11px] font-bold text-muted-foreground uppercase tracking-wide mb-1.5">Склад</label>
                <select value={form.warehouseId} onChange={(e) => set("warehouseId", e.target.value)}
                  className="w-full px-3 py-2 rounded-lg text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-[hsl(var(--primary))]"
                  style={{ background: "hsl(var(--secondary))", border: "1px solid hsl(var(--border))" }}>
                  <option value="">Не выбран</option>
                  {warehouses.map((w) => <option key={w.id} value={w.id}>{w.name}</option>)}
                </select>
              </div>
            </>
          )}

          <div>
            <label className="block text-[11px] font-bold text-muted-foreground uppercase tracking-wide mb-1.5">Длительность</label>
            <div className="flex gap-1.5">
              {[1, 2, 3, 4, 6].map((d) => (
                <button key={d} onClick={() => set("duration", d)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-colors ${form.duration === d ? "text-white" : "text-muted-foreground hover:bg-secondary"}`}
                  style={form.duration === d ? { background: "hsl(var(--primary))" } : {}}>{d * 30}м</button>
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

        <div className="flex gap-2 px-6 py-3 border-t" style={{ borderColor: "hsl(var(--border))" }}>
          {isEdit && onDelete && (
            <button onClick={() => { onDelete(item.id); onClose(); }}
              className="px-3 py-2 rounded-lg text-xs font-bold text-red-500 hover:bg-red-500/10 flex items-center gap-1.5">
              <Icon name="Trash2" size={13} />Удалить</button>
          )}
          <div className="flex-1" />
          <button onClick={onClose} className="px-4 py-2 rounded-lg text-sm font-bold text-muted-foreground hover:bg-secondary">Отмена</button>
          <button onClick={submit} disabled={!canSubmit}
            className="px-5 py-2 rounded-lg text-sm font-bold text-white hover:opacity-90 disabled:opacity-30"
            style={{ background: "hsl(var(--primary))" }}>{isEdit ? "Сохранить" : "Создать"}</button>
        </div>
      </div>
    </div>
  );
}

export default function AppointmentsModule() {
  const [selectedDate, setSelectedDate] = useState(new Date(2026, 2, 25));
  const [items, setItems] = useState<AppointmentItem[]>([]);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [modalState, setModalState] = useState<{ item: AppointmentItem; emp: Employee } | null>(null);
  const dragRef = useRef<{ id: string; offsetSlot: number } | null>(null);
  const [dragGhost, setDragGhost] = useState<{ empId: number; slot: number; duration: number } | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const gridRef = useRef<HTMLDivElement>(null);
  const clickBlockRef = useRef(false);

  useEffect(() => {
    fetchWarehouses().then(setWarehouses).catch(() => {});
  }, []);

  const getSlotFromY = useCallback((y: number) => {
    if (!gridRef.current) return 0;
    const r = gridRef.current.getBoundingClientRect();
    return Math.max(0, Math.min(timeSlots.length - 1, Math.floor((y - r.top + gridRef.current.scrollTop) / SLOT_H)));
  }, []);

  const getEmpFromX = useCallback((x: number) => {
    if (!gridRef.current) return employees[0].id;
    const r = gridRef.current.getBoundingClientRect();
    const idx = Math.max(0, Math.min(employees.length - 1, Math.floor((x - r.left + gridRef.current.scrollLeft - 48) / COL_W)));
    return employees[idx].id;
  }, []);

  const isOccupied = useCallback((empId: number, slot: number, dur: number, excl?: string) => {
    for (const it of items) {
      if (it.id === excl) continue;
      if (it.empId === empId && slot < it.startSlot + it.duration && slot + dur > it.startSlot) return true;
    }
    return false;
  }, [items]);

  const handleDragStart = (e: React.MouseEvent, id: string) => {
    e.preventDefault(); e.stopPropagation();
    const item = items.find((i) => i.id === id);
    if (!item) return;
    const slot = getSlotFromY(e.clientY);
    dragRef.current = { id, offsetSlot: slot - item.startSlot };
    setDragGhost({ empId: item.empId, slot: item.startSlot, duration: item.duration });
    clickBlockRef.current = false;
    const onMove = (ev: MouseEvent) => {
      clickBlockRef.current = true; setIsDragging(true);
      setDragGhost({ empId: getEmpFromX(ev.clientX), slot: Math.max(0, getSlotFromY(ev.clientY) - (dragRef.current?.offsetSlot || 0)), duration: item.duration });
    };
    const onUp = (ev: MouseEvent) => {
      window.removeEventListener("mousemove", onMove); window.removeEventListener("mouseup", onUp);
      if (clickBlockRef.current) {
        const fs = Math.max(0, Math.min(timeSlots.length - item.duration, getSlotFromY(ev.clientY) - (dragRef.current?.offsetSlot || 0)));
        const fe = getEmpFromX(ev.clientX);
        if (!isOccupied(fe, fs, item.duration, id)) setItems((p) => p.map((i) => i.id === id ? { ...i, empId: fe, startSlot: fs } : i));
      }
      setIsDragging(false); setDragGhost(null); dragRef.current = null;
      setTimeout(() => { clickBlockRef.current = false; }, 50);
    };
    window.addEventListener("mousemove", onMove); window.addEventListener("mouseup", onUp);
  };

  const handleResizeStart = (e: React.MouseEvent, id: string) => {
    e.preventDefault(); e.stopPropagation(); clickBlockRef.current = true;
    const item = items.find((i) => i.id === id);
    if (!item) return; setIsResizing(true);
    const onMove = (ev: MouseEvent) => {
      const nd = Math.max(1, Math.min(12, getSlotFromY(ev.clientY) - item.startSlot + 1));
      if (!isOccupied(item.empId, item.startSlot, nd, id)) setItems((p) => p.map((i) => i.id === id ? { ...i, duration: nd } : i));
    };
    const onUp = () => { window.removeEventListener("mousemove", onMove); window.removeEventListener("mouseup", onUp); setIsResizing(false); setTimeout(() => { clickBlockRef.current = false; }, 50); };
    window.addEventListener("mousemove", onMove); window.addEventListener("mouseup", onUp);
  };

  const handleCellClick = (empId: number, slot: number) => {
    if (isDragging || isResizing || clickBlockRef.current) return;
    if (isOccupied(empId, slot, 1)) return;
    const emp = employees.find((e) => e.id === empId)!;
    const dur = isOccupied(empId, slot, 2) ? 1 : 2;
    setModalState({ item: { id: genId(), empId, startSlot: slot, duration: dur, customer: "", phone: "", carBrand: "", carModel: "", carPlate: "", service: "", note: "", warehouseId: "", isLock: false }, emp });
  };

  const handleItemClick = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (isDragging || isResizing || clickBlockRef.current) return;
    const item = items.find((i) => i.id === id);
    if (!item) return;
    setModalState({ item, emp: employees.find((em) => em.id === item.empId)! });
  };

  const handleSave = (data: AppointmentItem) => {
    setItems((p) => { const ex = p.find((i) => i.id === data.id); return ex ? p.map((i) => i.id === data.id ? data : i) : [...p, data]; });
  };

  const handleDelete = (id: string) => { setItems((p) => p.filter((i) => i.id !== id)); };

  return (
    <div className="flex gap-0 h-full">
      <aside className="w-64 flex-shrink-0 flex flex-col border-r overflow-y-auto"
        style={{ background: "hsl(var(--sidebar-background))", borderColor: "hsl(var(--border))" }}>
        <div className="p-4 space-y-4">
          {warehouses.length > 0 && (
            <section>
              <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-2 px-1 flex items-center gap-1.5">
                <Icon name="Warehouse" size={11} className="text-muted-foreground" />Склады
              </div>
              <div className="space-y-1">
                {warehouses.map((w) => (
                  <div key={w.id} className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-[11px]"
                    style={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))" }}>
                    <Icon name="Warehouse" size={11} className="text-muted-foreground" />
                    <div className="min-w-0 flex-1">
                      <div className="font-bold text-foreground truncate">{w.name}</div>
                      {w.address && <div className="text-muted-foreground text-[9px] truncate">{w.address}</div>}
                    </div>
                    {w.is_default && <span className="text-[8px] font-bold uppercase px-1.5 py-0.5 rounded-full" style={{ background: "hsl(var(--primary) / 0.1)", color: "hsl(var(--primary))" }}>осн</span>}
                  </div>
                ))}
              </div>
            </section>
          )}

          <section>
            <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-2 px-1">Дата</div>
            <MiniCalendar selectedDate={selectedDate} onSelect={setSelectedDate} />
          </section>

          <section>
            <div className="rounded-lg px-3 py-2.5 flex items-center justify-between" style={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))" }}>
              <span className="text-[10px] text-muted-foreground font-bold uppercase">Записей</span>
              <span className="text-lg font-black" style={{ color: "hsl(var(--primary))" }}>{items.filter((i) => !i.isLock).length}</span>
            </div>
          </section>
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0">
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
                      style={{ background: "hsl(var(--secondary))", color: "hsl(var(--primary))" }}>{empInit(emp.name)}</div>
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
                {timeSlots.map((t) => (
                  <div key={t} className="border-b flex items-center justify-center text-[9px] font-bold text-muted-foreground"
                    style={{ height: SLOT_H, borderColor: "hsl(var(--border))" }}>{t}</div>
                ))}
              </div>

              <div className="flex relative">
                {employees.map((emp) => (
                  <div key={emp.id} className="flex-shrink-0 border-r relative" style={{ width: COL_W, borderColor: "hsl(var(--border))" }}>
                    {timeSlots.map((_, si) => (
                      <div key={si} className="border-b group cursor-pointer" style={{ height: SLOT_H, borderColor: "hsl(var(--border))" }}
                        onClick={() => handleCellClick(emp.id, si)}>
                        <div className="w-full h-full p-0.5">
                          <div className="w-full h-full opacity-0 group-hover:opacity-100 border border-dashed rounded flex items-center justify-center text-[8px] font-bold uppercase transition-all hover:border-[hsl(var(--primary))] hover:text-[hsl(var(--primary))]"
                            style={{ borderColor: "hsl(var(--border))", color: "hsl(var(--muted-foreground))" }}>+</div>
                        </div>
                      </div>
                    ))}

                    {items.filter((it) => it.empId === emp.id).map((it) => (
                      <div key={it.id} className={`absolute left-0 right-0 px-0.5 transition-opacity ${dragRef.current?.id === it.id && isDragging ? "opacity-30" : ""}`}
                        style={{ top: it.startSlot * SLOT_H + 1, height: it.duration * SLOT_H - 2, zIndex: 5 }}>
                        {it.isLock ? (
                          <div className="w-full h-full rounded border px-2 py-1 flex flex-col items-center justify-center cursor-grab active:cursor-grabbing"
                            style={{ background: "hsl(var(--secondary))", borderColor: "hsl(var(--border))", color: "hsl(var(--muted-foreground))" }}
                            onMouseDown={(e) => handleDragStart(e, it.id)} onClick={(e) => handleItemClick(e, it.id)}>
                            <Icon name="Lock" size={12} className="mb-0.5 opacity-60" />
                            {it.note && <div className="text-[9px] font-bold truncate w-full text-center opacity-70">{it.note}</div>}
                          </div>
                        ) : (
                          <div className={`w-full h-full rounded border-l-[3px] px-2 py-1 text-[10px] leading-tight cursor-grab active:cursor-grabbing transition-shadow hover:shadow-lg relative overflow-hidden ${emp.color}`}
                            style={{ borderLeftColor: emp.borderColor }}
                            onMouseDown={(e) => handleDragStart(e, it.id)} onClick={(e) => handleItemClick(e, it.id)}>
                            <div className="font-black truncate uppercase tracking-tight" style={{ fontSize: 10 }}>
                              {[it.carBrand, it.carModel].filter(Boolean).join(" ") || it.customer}
                            </div>
                            <div className="opacity-70 font-medium truncate" style={{ fontSize: 9 }}>{it.service}</div>
                            {it.warehouseId && (
                              <div className="flex items-center gap-0.5 opacity-50 mt-0.5" style={{ fontSize: 8 }}>
                                <Icon name="Warehouse" size={8} />
                                <span>{warehouses.find((w) => w.id === it.warehouseId)?.name || ""}</span>
                              </div>
                            )}
                          </div>
                        )}
                        <div className="absolute bottom-0 left-0.5 right-0.5 h-2.5 cursor-s-resize rounded-b hover:bg-black/5 transition-colors"
                          onMouseDown={(e) => handleResizeStart(e, it.id)} />
                      </div>
                    ))}
                  </div>
                ))}

                {dragGhost && isDragging && (
                  <div className="absolute pointer-events-none z-30 px-0.5"
                    style={{ left: employees.findIndex((e) => e.id === dragGhost.empId) * COL_W, top: dragGhost.slot * SLOT_H + 1, width: COL_W, height: dragGhost.duration * SLOT_H - 2 }}>
                    <div className="w-full h-full rounded border-2 border-dashed" style={{ borderColor: "hsl(var(--primary))", background: "hsl(var(--primary) / 0.1)" }} />
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {modalState && (
        <AppointmentModal item={modalState.item} emp={modalState.emp} warehouses={warehouses}
          onClose={() => setModalState(null)} onSave={handleSave}
          onDelete={(modalState.item.customer || modalState.item.isLock) ? handleDelete : undefined} />
      )}
    </div>
  );
}
