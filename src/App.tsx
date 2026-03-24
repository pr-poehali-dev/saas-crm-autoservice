import { useState } from "react";
import Icon from "@/components/ui/icon";
import AppointmentsModule from "@/pages/AppointmentsModule";

// ─── Types ───────────────────────────────────────────────────────────────────
type ModuleId =
  | "dashboard" | "counterparties" | "appointments" | "services"
  | "products" | "deals" | "finance" | "nomenclature" | "warehouses"
  | "companies" | "cashdesks" | "contracts" | "requisites"
  | "roles" | "reports" | "settings";

interface NavItem {
  id: ModuleId;
  label: string;
  icon: string;
  badge?: number;
  group: string;
}

// ─── Nav config ──────────────────────────────────────────────────────────────
const NAV_ITEMS: NavItem[] = [
  { id: "dashboard",      label: "Дашборд",         icon: "LayoutDashboard", group: "Главное" },
  { id: "appointments",   label: "Записи",           icon: "CalendarClock",  badge: 5, group: "Главное" },
  { id: "deals",          label: "Сделки",           icon: "Handshake",      badge: 3, group: "Главное" },
  { id: "counterparties", label: "Контрагенты",      icon: "Users",          group: "Справочники" },
  { id: "services",       label: "Услуги",           icon: "Wrench",         group: "Справочники" },
  { id: "products",       label: "Товары",           icon: "Package",        group: "Справочники" },
  { id: "nomenclature",   label: "Номенклатура",     icon: "Layers",         group: "Справочники" },
  { id: "warehouses",     label: "Склады",           icon: "Warehouse",      group: "Склад и деньги" },
  { id: "finance",        label: "Деньги",           icon: "Banknote",       group: "Склад и деньги" },
  { id: "cashdesks",      label: "Кассы",            icon: "Receipt",        group: "Склад и деньги" },
  { id: "companies",      label: "Наши фирмы",       icon: "Building2",      group: "Организация" },
  { id: "contracts",      label: "Договоры",         icon: "FileText",       group: "Организация" },
  { id: "requisites",     label: "Реквизиты",        icon: "CreditCard",     group: "Организация" },
  { id: "roles",          label: "Роли",             icon: "ShieldCheck",    group: "Система" },
  { id: "reports",        label: "Отчёты",           icon: "BarChart3",      group: "Система" },
  { id: "settings",       label: "Настройки",        icon: "Settings",       group: "Система" },
];

const GROUPS = ["Главное", "Справочники", "Склад и деньги", "Организация", "Система"];

// ─── Dashboard stats ──────────────────────────────────────────────────────────
const STATS = [
  { label: "Записей сегодня",  value: "18",       delta: "+3",   color: "text-info",    icon: "CalendarClock" },
  { label: "Открытых сделок",  value: "47",       delta: "+12%", color: "text-success", icon: "Handshake" },
  { label: "Выручка, ₽",       value: "284 500",  delta: "+8%",  color: "text-success", icon: "Banknote" },
  { label: "Клиентов всего",   value: "1 203",    delta: "+24",  color: "text-primary",  icon: "Users" },
];

const RECENT_APPOINTMENTS = [
  { id: "REC-0418", client: "Иванов Михаил",  car: "Toyota Camry 2021",   service: "ТО-60000",           status: "active", time: "10:00" },
  { id: "REC-0417", client: "ООО «Логист»",   car: "Lada Granta 2020",    service: "Замена масла",        status: "done",   time: "09:15" },
  { id: "REC-0416", client: "Петрова Анна",   car: "Kia Rio 2022",        service: "Диагностика",         status: "wait",   time: "11:30" },
  { id: "REC-0415", client: "Сидоров ИП",     car: "Ford Transit 2019",   service: "Тормозная система",   status: "active", time: "12:00" },
  { id: "REC-0414", client: "Николаев Д.",    car: "BMW X5 2023",         service: "Шиномонтаж",          status: "done",   time: "08:30" },
];

const STATUS_CONFIG: Record<string, { label: string; bg: string; text: string }> = {
  active: { label: "В работе",  bg: "bg-blue-500/15",   text: "text-blue-400"   },
  done:   { label: "Выполнено", bg: "bg-green-500/15",  text: "text-green-400"  },
  wait:   { label: "Ожидание",  bg: "bg-yellow-500/15", text: "text-yellow-400" },
  cancel: { label: "Отменено",  bg: "bg-red-500/15",    text: "text-red-400"    },
};

// ─── Module placeholder ───────────────────────────────────────────────────────
function ModulePlaceholder({ item }: { item: NavItem }) {
  return (
    <div className="flex flex-col items-center justify-center gap-4 animate-fade-in" style={{ minHeight: 400 }}>
      <div className="w-16 h-16 rounded-2xl flex items-center justify-center" style={{ background: "hsl(210 100% 56% / 0.12)" }}>
        <Icon name={item.icon} size={32} className="text-primary" />
      </div>
      <div className="text-center">
        <h2 className="text-xl font-semibold text-foreground mb-1">{item.label}</h2>
        <p className="text-sm text-muted-foreground">Модуль в разработке — скоро здесь появится полный функционал</p>
      </div>
      <button
        className="mt-2 px-4 py-2 rounded-md text-sm font-medium text-white transition-opacity hover:opacity-90"
        style={{ background: "hsl(var(--primary))" }}
      >
        Создать первую запись
      </button>
    </div>
  );
}

// ─── Dashboard ─────────────────────────────────────────────────────────────────
function Dashboard() {
  return (
    <div className="space-y-5 animate-fade-in">
      {/* Stats */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        {STATS.map((s) => (
          <div key={s.label} className="stat-card flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{s.label}</span>
              <div className="w-8 h-8 rounded-md flex items-center justify-center" style={{ background: "hsl(var(--secondary))" }}>
                <Icon name={s.icon} size={16} className={s.color} />
              </div>
            </div>
            <div className="flex items-end gap-2">
              <span className="text-2xl font-semibold font-mono tracking-tight text-foreground">{s.value}</span>
              <span className={`text-xs font-medium pb-0.5 ${s.color}`}>{s.delta}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Content */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        {/* Appointments table */}
        <div className="xl:col-span-2 rounded-lg border overflow-hidden" style={{ background: "hsl(var(--card))", borderColor: "hsl(var(--border))" }}>
          <div className="flex items-center justify-between px-5 py-3.5 border-b" style={{ borderColor: "hsl(var(--border))" }}>
            <h3 className="text-sm font-semibold text-foreground">Последние записи</h3>
            <button className="text-xs text-primary hover:underline">Все записи →</button>
          </div>
          <div>
            {RECENT_APPOINTMENTS.map((a, i) => {
              const s = STATUS_CONFIG[a.status];
              return (
                <div
                  key={a.id}
                  className="flex items-center gap-4 px-5 py-3 table-row-hover cursor-pointer transition-colors"
                  style={{ borderBottom: i < RECENT_APPOINTMENTS.length - 1 ? "1px solid hsl(var(--border))" : "none" }}
                >
                  <div className="font-mono text-xs text-muted-foreground w-20 shrink-0">{a.id}</div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{a.client}</p>
                    <p className="text-xs text-muted-foreground truncate">{a.car} · {a.service}</p>
                  </div>
                  <div className="text-xs text-muted-foreground shrink-0">{a.time}</div>
                  <span className={`badge-status shrink-0 ${s.bg} ${s.text}`}>
                    <span className="w-1.5 h-1.5 rounded-full bg-current"></span>
                    {s.label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right column */}
        <div className="flex flex-col gap-4">
          {/* Quick actions */}
          <div className="rounded-lg border p-4" style={{ background: "hsl(var(--card))", borderColor: "hsl(var(--border))" }}>
            <h3 className="text-sm font-semibold text-foreground mb-3">Быстрые действия</h3>
            <div className="grid grid-cols-2 gap-2">
              {[
                { label: "Новая запись",     icon: "CalendarPlus"     },
                { label: "Добавить клиента", icon: "UserPlus"         },
                { label: "Новая сделка",     icon: "Plus"             },
                { label: "Приходный ордер",  icon: "ArrowDownToLine"  },
              ].map((a) => (
                <button
                  key={a.label}
                  className="flex flex-col items-center gap-2 p-3 rounded-md text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
                  style={{ background: "hsl(var(--secondary))" }}
                >
                  <Icon name={a.icon} size={18} className="text-primary" />
                  <span className="text-center leading-tight">{a.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Finance */}
          <div className="rounded-lg border p-4" style={{ background: "hsl(var(--card))", borderColor: "hsl(var(--border))" }}>
            <h3 className="text-sm font-semibold text-foreground mb-3">Финансы сегодня</h3>
            <div className="space-y-3">
              {[
                { label: "Приход",  value: "+142 000 ₽", color: "text-green-400", bold: false },
                { label: "Расход",  value: "−38 400 ₽",  color: "text-red-400",   bold: false },
                { label: "Итого",   value: "103 600 ₽",  color: "text-foreground",bold: true  },
              ].map((r) => (
                <div key={r.label} className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">{r.label}</span>
                  <span className={`text-sm font-mono ${r.color} ${r.bold ? "font-semibold" : ""}`}>{r.value}</span>
                </div>
              ))}
              <div className="h-px" style={{ background: "hsl(var(--border))" }} />
              <div>
                <div className="w-full rounded-full overflow-hidden mb-1.5" style={{ height: 4, background: "hsl(var(--secondary))" }}>
                  <div className="h-full rounded-full" style={{ width: "73%", background: "hsl(var(--primary))" }} />
                </div>
                <p className="text-xs text-muted-foreground">73% от плана на месяц</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── App ──────────────────────────────────────────────────────────────────────
export default function App() {
  const [activeModule, setActiveModule] = useState<ModuleId>("dashboard");
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const tenant = "АвтоМастер Плюс";

  const activeItem = NAV_ITEMS.find((n) => n.id === activeModule)!;

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Sidebar */}
      <aside
        className="flex flex-col shrink-0 h-full border-r transition-all duration-200 overflow-hidden"
        style={{
          width: sidebarOpen ? 220 : 56,
          background: "hsl(var(--sidebar-background))",
          borderColor: "hsl(var(--sidebar-border))",
        }}
      >
        {/* Logo */}
        <div
          className="flex items-center justify-center px-3 py-4 border-b shrink-0"
          style={{ borderColor: "hsl(var(--sidebar-border))" }}
        >
          <img
            src="https://cdn.poehali.dev/projects/bb9a0de0-c4f3-43a3-86ce-c6d3cbe383e8/bucket/f5ecea76-05c7-4ea3-8a23-e7fd1b8ad69a.png"
            alt="VINADMIN"
            className={sidebarOpen ? "h-8" : "h-6"}
          />
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto py-3 px-2">
          {GROUPS.map((group) => {
            const items = NAV_ITEMS.filter((n) => n.group === group);
            return (
              <div key={group} className="mb-4">
                {sidebarOpen && (
                  <p
                    className="px-3 py-1 text-xs font-semibold uppercase tracking-widest mb-0.5"
                    style={{ color: "hsl(var(--muted-foreground))", opacity: 0.55 }}
                  >
                    {group}
                  </p>
                )}
                <div className="space-y-0.5">
                  {items.map((item) => (
                    <div
                      key={item.id}
                      className={`nav-item relative ${activeModule === item.id ? "active" : ""}`}
                      onClick={() => setActiveModule(item.id)}
                      title={!sidebarOpen ? item.label : undefined}
                    >
                      <Icon name={item.icon} size={16} className="shrink-0" />
                      {sidebarOpen && (
                        <span className="flex-1 truncate text-sm">{item.label}</span>
                      )}
                      {sidebarOpen && item.badge !== undefined && (
                        <span
                          className="text-xs font-mono px-1.5 py-0.5 rounded font-semibold"
                          style={{ background: "hsl(210 100% 56% / 0.15)", color: "hsl(var(--primary))" }}
                        >
                          {item.badge}
                        </span>
                      )}
                      {!sidebarOpen && item.badge !== undefined && (
                        <span
                          className="absolute right-1.5 top-1.5 w-1.5 h-1.5 rounded-full"
                          style={{ background: "hsl(var(--primary))" }}
                        />
                      )}
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </nav>

        {/* User */}
        <div className="border-t px-2 py-3 shrink-0" style={{ borderColor: "hsl(var(--sidebar-border))" }}>
          <div className="nav-item">
            <div
              className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold shrink-0"
              style={{ background: "hsl(210 100% 56% / 0.2)", color: "hsl(var(--primary))" }}
            >
              АД
            </div>
            {sidebarOpen && (
              <div className="flex-1 min-w-0 animate-slide-in">
                <p className="text-xs font-medium text-foreground truncate">Алексей Дмитриев</p>
                <p className="text-xs text-muted-foreground">Администратор</p>
              </div>
            )}
          </div>
        </div>
      </aside>

      {/* Main */}
      <div className="flex flex-col flex-1 overflow-hidden">
        {/* Topbar */}
        {activeModule !== "appointments" && (
          <header
            className="flex items-center gap-4 px-6 py-3 border-b shrink-0"
            style={{ background: "hsl(var(--card))", borderColor: "hsl(var(--border))" }}
          >
            <button
              className="w-8 h-8 flex items-center justify-center rounded-md hover:bg-secondary transition-colors"
              onClick={() => setSidebarOpen(!sidebarOpen)}
            >
              <Icon
                name={sidebarOpen ? "PanelLeftClose" : "PanelLeft"}
                size={16}
                className="text-muted-foreground"
              />
            </button>

            <div className="flex items-center gap-2 text-sm">
              <span className="text-muted-foreground">AutoCRM</span>
              <Icon name="ChevronRight" size={14} className="text-muted-foreground" />
              <span className="font-medium text-foreground">{activeItem.label}</span>
            </div>

            <div className="flex-1" />

            <div
              className="flex items-center gap-2 px-3 py-1.5 rounded-md text-sm text-muted-foreground border cursor-text"
              style={{ background: "hsl(var(--secondary))", borderColor: "hsl(var(--border))", minWidth: 200 }}
            >
              <Icon name="Search" size={14} />
              <span>Поиск...</span>
              <span className="ml-auto font-mono text-xs opacity-40">⌘K</span>
            </div>

            <button className="relative w-8 h-8 flex items-center justify-center rounded-md hover:bg-secondary transition-colors">
              <Icon name="Bell" size={16} className="text-muted-foreground" />
              <span
                className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full border-2"
                style={{ background: "hsl(var(--primary))", borderColor: "hsl(var(--card))" }}
              />
            </button>

            <button className="w-8 h-8 flex items-center justify-center rounded-md hover:bg-secondary transition-colors">
              <Icon name="HelpCircle" size={16} className="text-muted-foreground" />
            </button>
          </header>
        )}

        {/* Page */}
        {activeModule === "appointments" ? (
          <main className="flex-1 overflow-hidden flex flex-col">
            <AppointmentsModule />
          </main>
        ) : (
          <main className="flex-1 overflow-y-auto p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h1 className="text-lg font-semibold text-foreground">{activeItem.label}</h1>
                <p className="text-sm text-muted-foreground mt-0.5">
                  {activeModule === "dashboard"
                    ? "24 марта 2026 · Понедельник"
                    : `Управление разделом «${activeItem.label}»`}
                </p>
              </div>
              {activeModule !== "dashboard" && (
                <button
                  className="flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium text-white hover:opacity-90 transition-opacity"
                  style={{ background: "hsl(var(--primary))" }}
                >
                  <Icon name="Plus" size={15} className="text-white" />
                  Создать
                </button>
              )}
            </div>

            {activeModule === "dashboard" && <Dashboard />}
            {activeModule !== "dashboard" && (
              <ModulePlaceholder item={activeItem} />
            )}
          </main>
        )}
      </div>
    </div>
  );
}