import { useState, useRef, useEffect } from "react";
import { Calendar as CalIcon, ChevronLeft, ChevronRight, Clock } from "lucide-react";
import { fmtDateTime12 } from "@/lib/format";

type Props = {
  value: Date | null;
  onChange: (d: Date) => void;
  placeholder?: string;
  className?: string;
  minDate?: Date;
};

const SLOTS: { label: string; h: number; m: number }[] = (() => {
  const out: { label: string; h: number; m: number }[] = [];
  for (let h = 6; h <= 23; h++) {
    for (const m of [0, 30]) {
      if (h === 23 && m > 30) continue;
      const period = h >= 12 ? "PM" : "AM";
      const hh = h % 12 === 0 ? 12 : h % 12;
      out.push({ label: `${hh}:${m === 0 ? "00" : "30"} ${period}`, h, m });
    }
  }
  return out;
})();

const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
const WK = ["S", "M", "T", "W", "T", "F", "S"];

export function DateTimePicker({ value, onChange, placeholder = "Pick date & time", className = "", minDate }: Props) {
  const [open, setOpen] = useState(false);
  const [pickedDate, setPickedDate] = useState<Date | null>(value);
  const [view, setView] = useState(() => value ?? new Date());
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  useEffect(() => { setPickedDate(value); if (value) setView(value); }, [value]);

  const year = view.getFullYear();
  const month = view.getMonth();
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const today = new Date(); today.setHours(0,0,0,0);

  const cells: (number | null)[] = [];
  for (let i = 0; i < firstDay; i++) cells.push(null);
  for (let i = 1; i <= daysInMonth; i++) cells.push(i);

  const pickDay = (d: number) => {
    const dt = new Date(year, month, d, pickedDate?.getHours() ?? 0, pickedDate?.getMinutes() ?? 0);
    setPickedDate(dt);
  };

  const pickSlot = (h: number, m: number) => {
    const base = pickedDate ?? new Date();
    const dt = new Date(base.getFullYear(), base.getMonth(), base.getDate(), h, m);
    onChange(dt);
    setOpen(false);
  };

  const isSameDay = (a: Date | null, b: Date) => !!a && a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
  const dateLocked = !!pickedDate;

  return (
    <div ref={ref} className={`relative ${className}`}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center gap-2 px-3 py-2 rounded-lg bg-muted/60 border border-border hover:bg-muted transition text-sm text-left"
      >
        <CalIcon className="w-4 h-4 text-primary" />
        <span className={value ? "" : "text-muted-foreground"}>{value ? fmtDateTime12(value) : placeholder}</span>
      </button>

      {open && (
        <div className="absolute z-50 mt-2 left-0 w-[640px] max-w-[92vw] glow-card rounded-2xl p-4 animate-scale-in shadow-2xl">
          <div className="flex gap-4">
            {/* LEFT: small month */}
            <div className="w-[230px] shrink-0">
              <div className="flex items-center justify-between mb-2">
                <button type="button" onClick={() => setView(new Date(year, month - 1, 1))} className="p-1 rounded hover:bg-muted">
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <div className="text-sm font-semibold">{MONTHS[month]} {year}</div>
                <button type="button" onClick={() => setView(new Date(year, month + 1, 1))} className="p-1 rounded hover:bg-muted">
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
              <div className="grid grid-cols-7 gap-0.5 mb-1">
                {WK.map((w, i) => (
                  <div key={i} className="text-[10px] text-center text-muted-foreground font-semibold py-1">{w}</div>
                ))}
              </div>
              <div className="grid grid-cols-7 gap-0.5">
                {cells.map((d, i) => {
                  if (d === null) return <div key={i} />;
                  const dt = new Date(year, month, d);
                  const isToday = isSameDay(today, dt);
                  const isPicked = isSameDay(pickedDate, dt);
                  const disabled = minDate ? dt < new Date(minDate.getFullYear(), minDate.getMonth(), minDate.getDate()) : false;
                  return (
                    <button
                      type="button"
                      key={i}
                      disabled={disabled}
                      onClick={() => pickDay(d)}
                      className={`text-xs h-7 rounded-md transition ${
                        isPicked ? "gradient-bg text-white font-bold shadow"
                          : isToday ? "bg-primary/15 text-primary font-semibold"
                          : disabled ? "text-muted-foreground/30 cursor-not-allowed"
                          : "hover:bg-muted text-foreground"
                      }`}
                    >
                      {d}
                    </button>
                  );
                })}
              </div>
              <div className="mt-3 text-[10px] text-muted-foreground leading-tight">
                <div className="font-semibold mb-0.5">3 clicks to book:</div>
                <div>1. Open · 2. Pick date · 3. Pick time</div>
              </div>
            </div>

            {/* RIGHT: time slots */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-2">
                <Clock className="w-4 h-4 text-primary" />
                <div className="text-sm font-semibold">
                  {dateLocked
                    ? `Pick a time on ${pickedDate!.toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short" })}`
                    : "Select a date first"}
                </div>
              </div>
              <div className="grid grid-cols-4 gap-1.5 max-h-[280px] overflow-y-auto scrollbar-thin pr-1">
                {SLOTS.map((s) => {
                  const isCurrent = pickedDate && pickedDate.getHours() === s.h && pickedDate.getMinutes() === s.m;
                  return (
                    <button
                      type="button"
                      key={s.label}
                      disabled={!dateLocked}
                      onClick={() => pickSlot(s.h, s.m)}
                      className={`text-xs py-2 rounded-lg border transition font-medium ${
                        !dateLocked ? "border-border/40 text-muted-foreground/40 cursor-not-allowed"
                        : isCurrent ? "gradient-bg text-white border-transparent shadow"
                        : "border-border hover:border-primary hover:bg-primary/5 text-foreground"
                      }`}
                    >
                      {s.label}
                    </button>
                  );
                })}
              </div>
              <div className="text-[10px] text-muted-foreground mt-2">6:00 AM – 11:30 PM · 30-min slots · 12-hour format</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
