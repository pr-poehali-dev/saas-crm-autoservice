import { useState, useMemo } from "react";
import Icon from "@/components/ui/icon";

const employees = [
  { id: 1, name: "Иван С.", role: "Моторист", color: "border-blue-500 bg-blue-500/15 text-blue-400" },
  { id: 2, name: "Алексей Д.", role: "Электрик", color: "border-yellow-500 bg-yellow-500/15 text-yellow-400" },
  { id: 3, name: "Сергей В.", role: "Ходовая", color: "border-green-500 bg-green-500/15 text-green-400" },
  { id: 4, name: "Дмитрий К.", role: "Диагност", color: "border-purple-500 bg-purple-500/15 text-purple-400" },
  { id: 5, name: "Андрей М.", role: "Кузовщик", color: "border-red-500 bg-red-500/15 text-red-400" },
  { id: 6, name: "Максим П.", role: "Маляр", color: "border-pink-500 bg-pink-500/15 text-pink-400" },
  { id: 7, name: "Владимир Т.", role: "Шиномонтаж", color: "border-indigo-500 bg-indigo-500/15 text-indigo-400" },
];

const scheduleItems = [
  { empId: 1, time: "10:00", customer: "BMW X5", service: "Замена ГРМ", type: "appointment" as const },
  { empId: 1, time: "13:00", label: "Обед", type: "lock" as const },
  { empId: 2, time: "09:30", customer: "Toyota Camry", service: "Проводка", type: "appointment" as const },
  { empId: 2, time: "14:00", label: "Тех. обслуживание", type: "lock" as const },
  { empId: 3, time: "11:00", customer: "Audi A4", service: "Замена стоек", type: "appointment" as const },
  { empId: 3, time: "15:30", customer: "Kia Sportage", service: "Сход-развал", type: "appointment" as const },
  { empId: 4, time: "12:30", customer: "Mercedes C200", service: "Диагностика", type: "appointment" as const },
  { empId: 4, time: "16:00", label: "Обучение", type: "lock" as const },
  { empId: 5, time: "10:30", customer: "Kia Rio", service: "Окрас крыла", type: "appointment" as const },
  { empId: 6, time: "09:00", customer: "Hyundai Tucson", service: "Полировка", type: "appointment" as const },
  { empId: 7, time: "11:30", customer: "VW Polo", service: "Шиномонтаж R16", type: "appointment" as const },
  { empId: 7, time: "14:30", customer: "Honda CR-V", service: "Балансировка", type: "appointment" as const },
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
    return {
      days: Array.from({ length: daysInMonth }, (_, i) => i + 1),
      startOffset: offset,
    };
  }, [viewMonth, viewYear]);

  const prev = () => {
    if (viewMonth === 0) { setViewMonth(11); setViewYear(viewYear - 1); }
    else setViewMonth(viewMonth - 1);
  };

  const next = () => {
    if (viewMonth === 11) { setViewMonth(0); setViewYear(viewYear + 1); }
    else setViewMonth(viewMonth + 1);
  };

  const isSelected = (d: number) =>
    d === selectedDate.getDate() && viewMonth === selectedDate.getMonth() && viewYear === selectedDate.getFullYear();

  const isToday = (d: number) => {
    const now = new Date();
    return d === now.getDate() && viewMonth === now.getMonth() && viewYear === now.getFullYear();
  };

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
        {WEEK_DAYS.map((d) => (
          <span key={d} className="text-[10px] font-bold text-muted-foreground uppercase">{d}</span>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-1">
        {Array.from({ length: startOffset }).map((_, i) => <div key={`e-${i}`} className="h-7" />)}
        {days.map((d) => (
          <button
            key={d}
            onClick={() => onSelect(new Date(viewYear, viewMonth, d))}
            className={`h-7 w-7 text-xs rounded-full flex items-center justify-center transition-colors
              ${isSelected(d) ? "bg-[hsl(var(--primary))] text-white font-bold" :
                isToday(d) ? "ring-1 ring-[hsl(var(--primary))] text-[hsl(var(--primary))] font-bold hover:bg-secondary" :
                "text-muted-foreground hover:bg-secondary"}`}
          >
            {d}
          </button>
        ))}
      </div>
    </div>
  );
}

function empInitials(name: string) {
  return name.split(" ").map((p) => p[0]).join("").toUpperCase();
}

export default function AppointmentsModule() {
  const [selectedDate, setSelectedDate] = useState(new Date(2026, 2, 25));

  const dayStr = selectedDate.toLocaleDateString("ru-RU", { weekday: "long", day: "numeric", month: "long", year: "numeric" });

  return (
    <div className="flex gap-0 -m-6 h-[calc(100vh-4rem)]">
      {/* Sidebar */}
      <aside
        className="w-72 flex-shrink-0 flex flex-col border-r overflow-y-auto"
        style={{ background: "hsl(var(--sidebar-background))", borderColor: "hsl(var(--border))" }}
      >
        <div className="p-5 space-y-5">
          <section>
            <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-3 px-1">Выберите дату</div>
            <MiniCalendar selectedDate={selectedDate} onSelect={setSelectedDate} />
          </section>

          <section>
            <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-3 px-1">Статистика</div>
            <div className="space-y-2">
              <div className="rounded-xl p-4" style={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))" }}>
                <div className="text-2xl font-black" style={{ color: "hsl(var(--primary))" }}>
                  {scheduleItems.filter((i) => i.type === "appointment").length}
                </div>
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
                <div
                  key={emp.id}
                  className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-secondary/50 transition-colors cursor-pointer"
                >
                  <div
                    className="w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-black shrink-0"
                    style={{ background: "hsl(var(--secondary))", color: "hsl(var(--primary))" }}
                  >
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

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header bar */}
        <div
          className="flex items-center justify-between px-5 shrink-0 border-b"
          style={{ height: 56, borderColor: "hsl(var(--border))", background: "hsl(var(--card))" }}
        >
          <div className="flex items-center gap-3">
            <Icon name="Calendar" size={18} className="text-muted-foreground" />
            <span className="text-sm font-bold text-foreground capitalize">{dayStr}</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setSelectedDate(new Date())}
              className="px-3 py-1.5 rounded-md text-xs font-bold hover:bg-secondary transition-colors text-muted-foreground"
            >
              Сегодня
            </button>
            <button
              className="flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-bold text-white hover:opacity-90 transition-opacity"
              style={{ background: "hsl(var(--primary))" }}
            >
              <Icon name="Plus" size={13} className="text-white" />
              Новая запись
            </button>
          </div>
        </div>

        {/* Schedule grid */}
        <div className="flex-1 overflow-auto">
          <div className="inline-block min-w-full">
            {/* Employee header row */}
            <div className="sticky top-0 z-20 flex border-b" style={{ background: "hsl(var(--card))", borderColor: "hsl(var(--border))" }}>
              <div
                className="w-16 flex-shrink-0 border-r flex items-center justify-center"
                style={{ height: 56, borderColor: "hsl(var(--border))", background: "hsl(var(--secondary))" }}
              >
                <Icon name="Clock" size={16} className="text-muted-foreground" />
              </div>
              <div className="flex">
                {employees.map((emp) => (
                  <div
                    key={emp.id}
                    className="w-48 flex-shrink-0 border-r px-3 flex items-center gap-3"
                    style={{ height: 56, borderColor: "hsl(var(--border))" }}
                  >
                    <div
                      className="w-9 h-9 rounded-full flex items-center justify-center text-[10px] font-black shrink-0"
                      style={{ background: "hsl(var(--secondary))", color: "hsl(var(--primary))" }}
                    >
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

            {/* Grid body */}
            <div className="flex">
              {/* Time column */}
              <div
                className="w-16 flex-shrink-0 border-r sticky left-0 z-10"
                style={{ borderColor: "hsl(var(--border))", background: "hsl(var(--secondary))" }}
              >
                {timeSlots.map((time) => (
                  <div
                    key={time}
                    className="h-16 border-b flex items-center justify-center text-[10px] font-bold text-muted-foreground"
                    style={{ borderColor: "hsl(var(--border))" }}
                  >
                    {time}
                  </div>
                ))}
              </div>

              {/* Slots */}
              <div className="flex">
                {employees.map((emp) => (
                  <div key={emp.id} className="w-48 flex-shrink-0 border-r" style={{ borderColor: "hsl(var(--border))" }}>
                    {timeSlots.map((time) => {
                      const item = scheduleItems.find((it) => it.empId === emp.id && it.time === time);

                      return (
                        <div
                          key={`${emp.id}-${time}`}
                          className="h-16 border-b p-1 group"
                          style={{ borderColor: "hsl(var(--border))" }}
                        >
                          {item ? (
                            item.type === "appointment" ? (
                              <div
                                className={`h-full w-full rounded-lg border-l-[3px] p-2.5 text-[11px] leading-tight cursor-pointer
                                  transition-transform hover:scale-[1.02] ${emp.color}`}
                              >
                                <div className="font-black text-xs truncate uppercase tracking-tight">{item.customer}</div>
                                <div className="opacity-70 font-medium truncate mt-0.5">{item.service}</div>
                              </div>
                            ) : (
                              <div
                                className="h-full w-full rounded-lg flex flex-col items-center justify-center text-[10px] font-bold uppercase tracking-tight"
                                style={{ background: "hsl(var(--secondary))", border: "1px solid hsl(var(--border))", color: "hsl(var(--muted-foreground))" }}
                              >
                                <Icon name="Lock" size={11} className="mb-1 opacity-50" />
                                <span>{item.label}</span>
                              </div>
                            )
                          ) : (
                            <button
                              className="w-full h-full opacity-0 group-hover:opacity-100 border border-dashed rounded-lg
                                text-[9px] font-bold uppercase transition-all hover:border-[hsl(var(--primary))]"
                              style={{ borderColor: "hsl(var(--border))", color: "hsl(var(--muted-foreground))" }}
                            >
                              +
                            </button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
