import { NavLink, useLocation, useNavigate } from "react-router-dom";
import {
  LayoutDashboard, Sparkles, Calendar, Users, IndianRupee, MessageCircle,
  Megaphone, Star, UserCog, Workflow, FileBarChart2, Settings, LogOut, Search, Bell, Sparkle, Stethoscope, HeartPulse, Wifi, WifiOff, BatteryCharging, FlaskConical, ClipboardList, Mic, Activity
} from "lucide-react";
import { useAuth } from "@/lib/auth";
import { useState, useEffect, ReactNode } from "react";

const nav = [
  { to: "/", label: "Dashboard", icon: LayoutDashboard, color: "from-purple-500 to-violet-500" },
  { to: "/ai", label: "AI Insights", icon: Sparkles, color: "from-pink-500 to-rose-500" },
  { to: "/clinical", label: "Clinical Workspace", icon: Stethoscope, color: "from-blue-500 to-indigo-500" },
  { to: "/consultation", label: "AI Consultation", icon: Mic, color: "from-teal-400 to-emerald-500", badge: "NEW" },
  { to: "/diagnosis", label: "Predictive Diagnosis", icon: Activity, color: "from-rose-400 to-orange-500" },
  { to: "/clinical-notes", label: "Voice Notes & Rx", icon: ClipboardList, color: "from-cyan-500 to-blue-500" },
  { to: "/lab-interpreter", label: "Lab Interpreter", icon: FlaskConical, color: "from-indigo-400 to-cyan-500", badge: "NEW" },
  { to: "/wellness", label: "Patient Wellness", icon: HeartPulse, color: "from-rose-400 to-red-500" },
  { to: "/appointments", label: "Appointments", icon: Calendar, color: "from-blue-500 to-cyan-500" },
  { to: "/patients", label: "Patients", icon: Users, color: "from-emerald-500 to-teal-500" },
  { to: "/family-dashboard", label: "Family Dashboard", icon: Users, color: "from-emerald-400 to-teal-500", badge: "NEW" },
  { to: "/billing", label: "Billing & Revenue", icon: IndianRupee, color: "from-amber-500 to-orange-500" },
  { to: "/messages", label: "Communications", icon: MessageCircle, color: "from-green-500 to-emerald-500" },
  { to: "/campaigns", label: "Campaigns & Leads", icon: Megaphone, color: "from-fuchsia-500 to-pink-500" },
  { to: "/reviews", label: "Reviews & Referrals", icon: Star, color: "from-yellow-500 to-amber-500" },
  { to: "/staff", label: "Staff & Tasks", icon: UserCog, color: "from-indigo-500 to-purple-500" },
  { to: "/automations", label: "Automations", icon: Workflow, color: "from-orange-500 to-red-500" },
  { to: "/reports", label: "Reports", icon: FileBarChart2, color: "from-sky-500 to-blue-500" },
  { to: "/admin", label: "Admin Panel", icon: Settings, color: "from-slate-500 to-slate-700" },
];

export function AppShell({ children }: { children: ReactNode }) {
  const { logout, user } = useAuth();
  const navigate = useNavigate();
  const loc = useLocation();
  const [search, setSearch] = useState("");
  const [isOffline, setIsOffline] = useState(!navigator.onLine);
  const [lightweightMode, setLightweightMode] = useState(false);

  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const onSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!search.trim()) return;
    navigate(`/patients?q=${encodeURIComponent(search.trim())}`);
  };

  const bgStyle = lightweightMode ? {} : { backgroundImage: "var(--gradient-glow)" };

  return (
    <div className={`min-h-screen flex bg-background ${lightweightMode ? 'lightweight-mode' : ''}`} style={bgStyle}>
      {/* Sidebar */}
      <aside className="w-64 shrink-0 border-r border-sidebar-border bg-sidebar/80 backdrop-blur-xl sticky top-0 h-screen flex flex-col">
        <div className="px-5 py-5 border-b border-sidebar-border">
          <button onClick={() => navigate("/")} className="flex items-center gap-2.5 group">
            <div className="w-10 h-10 rounded-xl gradient-bg flex items-center justify-center shadow-md group-hover:scale-105 transition">
              <Sparkle className="w-5 h-5 text-white" />
            </div>
            <div className="text-left">
              <div className="font-bold text-lg leading-none gradient-text">ClinicOS</div>
              <div className="text-[10px] text-muted-foreground mt-0.5">Growth · Retention · Revenue</div>
            </div>
          </button>
        </div>
        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1 scrollbar-thin">
          {nav.map((item) => {
            const Icon = item.icon;
            const active = loc.pathname === item.to || (item.to !== "/" && loc.pathname.startsWith(item.to));
            return (
              <NavLink
                key={item.to}
                to={item.to}
                className={`group relative flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition ${
                  active
                    ? "bg-sidebar-accent text-sidebar-accent-foreground shadow-sm"
                    : "text-sidebar-foreground hover:bg-sidebar-accent/60"
                }`}
              >
                {active && (
                  <span className="absolute left-0 top-2 bottom-2 w-1 rounded-r-full gradient-bg" />
                )}
                <span className={`w-8 h-8 rounded-lg flex items-center justify-center bg-gradient-to-br ${item.color} text-white shadow-sm shrink-0`}>
                  <Icon className="w-4 h-4" />
                </span>
                <span className="flex-1">{item.label}</span>
                {item.badge && (
                  <span className="text-[9px] px-1.5 py-0.5 rounded-full gradient-bg text-white font-bold">{item.badge}</span>
                )}
              </NavLink>
            );
          })}
        </nav>
        <div className="p-3 border-t border-sidebar-border">
          <div className="flex items-center gap-2 px-2 py-2 rounded-xl bg-sidebar-accent/40">
            <div className="w-8 h-8 rounded-full gradient-bg flex items-center justify-center text-white font-bold text-xs">
              {user?.[0]?.toUpperCase() || "M"}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-semibold truncate">{user || "User"}</div>
              <div className="text-[10px] text-muted-foreground">Clinic Admin</div>
            </div>
            <button onClick={() => { logout(); navigate("/login"); }} className="p-1.5 rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition" title="Sign out">
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-16 border-b border-border bg-background/70 backdrop-blur-xl sticky top-0 z-30 flex items-center gap-4 px-6">
          <form onSubmit={onSearch} className="flex-1 max-w-xl relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Smart search across patients, invoices, appointments..."
              className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-muted/60 border border-transparent focus:bg-card focus:border-primary/30 focus:outline-none focus:ring-2 focus:ring-primary/20 transition text-sm"
            />
          </form>
          <button className="relative p-2.5 rounded-xl hover:bg-muted transition">
            <Bell className="w-5 h-5 text-muted-foreground" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-secondary" />
          </button>
          
          <button 
            onClick={() => setLightweightMode(!lightweightMode)}
            className={`hidden md:flex items-center gap-2 px-3 py-1.5 rounded-xl border transition-colors ${lightweightMode ? 'bg-amber-500/10 border-amber-500/30 text-amber-600' : 'bg-muted/50 border-border hover:bg-muted'}`}
            title="Toggle Lightweight Mode for low battery/internet"
          >
            <BatteryCharging className="w-4 h-4" />
            <span className="text-xs font-medium">{lightweightMode ? 'Lightweight ON' : 'Standard Mode'}</span>
          </button>

          {isOffline ? (
            <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive">
              <WifiOff className="w-4 h-4" />
              <span className="text-xs font-medium">Offline Mode (Syncing Paused)</span>
            </div>
          ) : (
            <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-xl gradient-soft-bg border border-border">
              <Wifi className="w-4 h-4 text-success" />
              <span className="text-xs font-medium">Online</span>
            </div>
          )}

          <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-xl gradient-soft-bg border border-border">
            <span className="w-2 h-2 rounded-full bg-success animate-pulse" />
            <span className="text-xs font-medium">Kapoor Family Clinic</span>
          </div>
        </header>
        <main className="flex-1 p-6 overflow-x-hidden animate-fade-in">{children}</main>
      </div>
    </div>
  );
}
