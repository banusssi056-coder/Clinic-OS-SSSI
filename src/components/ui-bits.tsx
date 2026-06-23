import { ReactNode, isValidElement } from "react";

export function PageHeader({ title, subtitle, icon: Icon, actions, gradient = "from-purple-500 to-pink-500", gradientFrom, gradientTo, children }: {
  title: string; subtitle?: string; icon?: any; actions?: ReactNode; gradient?: string; gradientFrom?: string; gradientTo?: string; children?: ReactNode;
}) {
  const grad = gradientFrom && gradientTo 
    ? (gradientFrom.startsWith("from-") ? gradientFrom : "from-" + gradientFrom) + " " + (gradientTo.startsWith("to-") ? gradientTo : "to-" + gradientTo)
    : gradient;
  return (
    <div className="flex items-start justify-between mb-6 flex-wrap gap-3">
      <div className="flex items-start gap-3">
        {Icon && (
          <div className={"w-12 h-12 rounded-2xl bg-gradient-to-br " + grad + " text-white flex items-center justify-center shadow-lg shrink-0"}>
            {isValidElement(Icon) ? Icon : <Icon className="w-6 h-6" />}
          </div>
        )}
        <div>
          <h1 className="text-3xl font-bold tracking-tight"><span className="gradient-text">{title}</span></h1>
          {subtitle && <p className="text-muted-foreground text-sm mt-0.5">{subtitle}</p>}
        </div>
      </div>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
      {children}
    </div>
  );
}

export function StatusPill({ value, tone, variant }: { value?: string; tone?: "success" | "warning" | "destructive" | "info" | "muted" | "primary"; variant?: "success" | "warning" | "destructive" | "info" | "muted" | "primary" }) {
  const map: Record<string, string> = {
    Booked: "info", CheckedIn: "primary", Completed: "success", NoShow: "destructive", Cancelled: "muted",
    Active: "success", "At Risk": "warning", Paid: "success", Pending: "warning", New: "info",
    Contacted: "primary", Lost: "destructive", Open: "warning", Done: "success", "On Leave": "warning",
    High: "destructive", Medium: "warning", Low: "muted",
    Generated: "success", "Manually Edited": "warning",
  };
  const t = tone || variant || (value ? (map[value] as any) : "muted") || "muted";
  const cls: Record<string, string> = {
    success: "bg-success/15 text-success border-success/30",
    warning: "bg-warning/15 text-warning border-warning/30",
    destructive: "bg-destructive/15 text-destructive border-destructive/30",
    info: "bg-info/15 text-info border-info/30",
    primary: "bg-primary/15 text-primary border-primary/30",
    muted: "bg-muted text-muted-foreground border-border",
  };
  return <span className={"inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold border " + cls[t]}>{value}</span>;
}

export function KpiCard({ label, value, sub, icon: Icon, gradient = "from-purple-500 to-pink-500", onClick, trend }: {
  label: string; value: ReactNode; sub?: string; icon?: any; gradient?: string; onClick?: () => void; trend?: { value: number; positive?: boolean };
}) {
  return (
    <button
      onClick={onClick}
      className="text-left glow-card rounded-2xl p-5 group relative overflow-hidden w-full"
    >
      <div className={"absolute -right-6 -top-6 w-24 h-24 rounded-full opacity-15 bg-gradient-to-br " + gradient + " blur-2xl group-hover:opacity-30 transition"} />
      <div className="flex items-start justify-between mb-3">
        <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">{label}</div>
        {Icon && (
          <div className={"w-9 h-9 rounded-xl bg-gradient-to-br " + gradient + " text-white flex items-center justify-center shadow-md"}>
            <Icon className="w-4 h-4" />
          </div>
        )}
      </div>
      <div className="text-3xl font-bold gradient-text">{value}</div>
      {(sub || trend) && (
        <div className="text-xs text-muted-foreground mt-1.5 flex items-center gap-1">
          {trend && <span className={trend.positive ? "text-success font-semibold" : "text-destructive font-semibold"}>{trend.positive ? "↑" : "↓"} {Math.abs(trend.value)}%</span>}
          {sub}
        </div>
      )}
    </button>
  );
}

export function SectionCard({ title, subtitle, icon: Icon, action, children, className = "" }: {
  title: string; subtitle?: string; icon?: any; action?: ReactNode; children: ReactNode; className?: string;
}) {
  return (
    <div className={"glass-card rounded-2xl p-5 " + className}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          {Icon && <div className="w-8 h-8 rounded-lg gradient-soft-bg flex items-center justify-center"><Icon className="w-4 h-4 text-primary" /></div>}
          <div>
            <h3 className="font-bold">{title}</h3>
            {subtitle && <p className="text-xs text-muted-foreground">{subtitle}</p>}
          </div>
        </div>
        {action}
      </div>
      {children}
    </div>
  );
}
