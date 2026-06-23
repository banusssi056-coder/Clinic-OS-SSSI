import { useMemo, useState, ReactNode, useRef, useEffect } from "react";
import {
  ArrowUpDown, ArrowUp, ArrowDown, Filter, Search, Pencil, Check, X,
  Trash2, MessageCircle, Tag, ChevronDown
} from "lucide-react";

export type ColumnType = "text" | "number" | "date" | "select" | "tags" | "currency" | "custom";

export type Column<T> = {
  key: string;
  label: string;
  type?: ColumnType;
  accessor?: (row: T) => any;
  render?: (row: T) => ReactNode;
  width?: number;
  options?: string[];
  editable?: boolean;
  sortable?: boolean;
  searchable?: boolean;
};

type Props<T extends { id: string }> = {
  rows: T[];
  columns: Column<T>[];
  onUpdate?: (id: string, patch: Partial<T>) => Promise<void> | void;
  onBulkUpdate?: (ids: string[], patch: Partial<T>) => Promise<void> | void;
  onBulkDelete?: (ids: string[]) => Promise<void> | void;
  onRowClick?: (row: T) => void;
  bulkExtraActions?: { label: string; icon?: any; onClick: (ids: string[]) => void }[];
  searchPlaceholder?: string;
  emptyState?: ReactNode;
  initialQuery?: string;
};

export function DataGrid<T extends { id: string; [k: string]: any }>({
  rows, columns, onUpdate, onBulkUpdate, onBulkDelete, onRowClick, bulkExtraActions,
  searchPlaceholder = "Smart search...", emptyState, initialQuery = "",
}: Props<T>) {
  const [query, setQuery] = useState(initialQuery);
  const [sort, setSort] = useState<{ key: string; dir: "asc" | "desc" } | null>(null);
  const [filters, setFilters] = useState<Record<string, string>>({});
  const [openFilter, setOpenFilter] = useState<string | null>(null);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [editMode, setEditMode] = useState(false);
  const [colWidths, setColWidths] = useState<Record<string, number>>(
    () => Object.fromEntries(columns.map((c) => [c.key, c.width ?? 160]))
  );
  const [showBulkEdit, setShowBulkEdit] = useState(false);

  const getVal = (row: T, c: Column<T>) => (c.accessor ? c.accessor(row) : row[c.key]);

  const filtered = useMemo(() => {
    let out = rows;
    if (query.trim()) {
      const q = query.toLowerCase();
      out = out.filter((r) =>
        columns.some((c) => {
          if (c.searchable === false) return false;
          const v = getVal(r, c);
          if (v == null) return false;
          if (Array.isArray(v)) return v.some((x) => String(x).toLowerCase().includes(q));
          return String(v).toLowerCase().includes(q);
        })
      );
    }
    Object.entries(filters).forEach(([k, v]) => {
      if (!v) return;
      const c = columns.find((x) => x.key === k);
      if (!c) return;
      const lv = v.toLowerCase();
      out = out.filter((r) => {
        const val = getVal(r, c);
        if (val == null) return false;
        if (Array.isArray(val)) return val.some((x) => String(x).toLowerCase().includes(lv));
        return String(val).toLowerCase().includes(lv);
      });
    });
    if (sort) {
      const c = columns.find((x) => x.key === sort.key);
      if (c) {
        out = [...out].sort((a, b) => {
          const av = getVal(a, c);
          const bv = getVal(b, c);
          if (av == null) return 1;
          if (bv == null) return -1;
          if (c.type === "number" || c.type === "currency") {
            return (Number(av) - Number(bv)) * (sort.dir === "asc" ? 1 : -1);
          }
          if (c.type === "date") {
            return (new Date(av).getTime() - new Date(bv).getTime()) * (sort.dir === "asc" ? 1 : -1);
          }
          return String(av).localeCompare(String(bv)) * (sort.dir === "asc" ? 1 : -1);
        });
      }
    }
    return out;
  }, [rows, query, filters, sort, columns]);

  const allSelected = filtered.length > 0 && filtered.every((r) => selected.has(r.id));
  const toggleAll = () => {
    setSelected((cur) => {
      const next = new Set(cur);
      if (allSelected) filtered.forEach((r) => next.delete(r.id));
      else filtered.forEach((r) => next.add(r.id));
      return next;
    });
  };

  const toggleSort = (key: string) => {
    const c = columns.find((x) => x.key === key);
    if (!c || c.sortable === false) return;
    setSort((s) => {
      if (!s || s.key !== key) return { key, dir: "asc" };
      if (s.dir === "asc") return { key, dir: "desc" };
      return null;
    });
  };

  return (
    <div className="space-y-3">
      {/* Toolbar */}
      <div className="flex items-center gap-2 flex-wrap">
        <div className="relative flex-1 min-w-[240px] max-w-md">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={searchPlaceholder}
            className="w-full pl-10 pr-3 py-2 rounded-xl bg-muted/60 border border-transparent focus:bg-card focus:border-primary/30 focus:outline-none focus:ring-2 focus:ring-primary/20 text-sm transition"
          />
        </div>
        <button
          onClick={() => setEditMode((e) => !e)}
          className={`px-3 py-2 rounded-xl text-sm font-medium flex items-center gap-1.5 transition ${editMode ? "btn-glossy" : "bg-muted hover:bg-muted/70"}`}
        >
          <Pencil className="w-4 h-4" /> {editMode ? "Editing" : "Edit Mode"}
        </button>
        {(Object.values(filters).some(Boolean) || sort || query) && (
          <button
            onClick={() => { setFilters({}); setSort(null); setQuery(""); }}
            className="px-3 py-2 rounded-xl text-sm bg-muted hover:bg-muted/70 flex items-center gap-1.5"
          >
            <X className="w-3.5 h-3.5" /> Clear
          </button>
        )}
        <div className="text-xs text-muted-foreground ml-auto">{filtered.length} of {rows.length}</div>
      </div>

      {/* Bulk action bar */}
      {selected.size > 0 && (
        <div className="flex items-center gap-2 px-4 py-2 rounded-xl gradient-soft-bg border border-primary/30 animate-fade-in">
          <span className="text-sm font-semibold gradient-text">{selected.size} selected</span>
          <div className="flex-1" />
          {onBulkUpdate && (
            <button onClick={() => setShowBulkEdit(true)} className="px-3 py-1.5 rounded-lg bg-card hover:bg-muted text-sm flex items-center gap-1.5">
              <Pencil className="w-3.5 h-3.5" /> Bulk Edit
            </button>
          )}
          {bulkExtraActions?.map((a) => (
            <button key={a.label} onClick={() => a.onClick([...selected])} className="px-3 py-1.5 rounded-lg bg-card hover:bg-muted text-sm flex items-center gap-1.5">
              {a.icon && <a.icon className="w-3.5 h-3.5" />} {a.label}
            </button>
          ))}
          {onBulkDelete && (
            <button onClick={() => { if (confirm(`Delete ${selected.size} item(s)?`)) { onBulkDelete([...selected]); setSelected(new Set()); } }} className="px-3 py-1.5 rounded-lg bg-destructive/10 text-destructive hover:bg-destructive/20 text-sm flex items-center gap-1.5">
              <Trash2 className="w-3.5 h-3.5" /> Delete
            </button>
          )}
          <button onClick={() => setSelected(new Set())} className="p-1.5 rounded-lg hover:bg-muted">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Table */}
      <div className="glass-card rounded-2xl overflow-hidden">
        <div className="max-h-[calc(100vh-300px)] overflow-auto scrollbar-thin">
          <table className="w-full text-sm" style={{ tableLayout: "fixed" }}>
            <colgroup>
              <col style={{ width: 44 }} />
              {columns.map((c) => <col key={c.key} style={{ width: colWidths[c.key] }} />)}
            </colgroup>
            <thead className="sticky top-0 z-20 bg-card/95 backdrop-blur-xl">
              <tr className="border-b border-border">
                <th className="px-3 py-3 text-left">
                  <input type="checkbox" checked={allSelected} onChange={toggleAll} className="accent-primary cursor-pointer" />
                </th>
                {columns.map((c) => {
                  const isSorted = sort?.key === c.key;
                  return (
                    <th key={c.key} className="px-3 py-3 text-left font-semibold text-foreground/80 relative group select-none">
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => toggleSort(c.key)}
                          className="flex items-center gap-1 hover:text-primary transition flex-1 truncate"
                          title={`Sort by ${c.label}`}
                        >
                          <span className="truncate">{c.label}</span>
                          {c.sortable !== false && (
                            isSorted
                              ? sort.dir === "asc" ? <ArrowUp className="w-3 h-3 text-primary shrink-0" /> : <ArrowDown className="w-3 h-3 text-primary shrink-0" />
                              : <ArrowUpDown className="w-3 h-3 opacity-30 shrink-0" />
                          )}
                        </button>
                        <button
                          onClick={() => setOpenFilter(openFilter === c.key ? null : c.key)}
                          className={`p-0.5 rounded hover:bg-muted ${filters[c.key] ? "text-primary" : "opacity-30 hover:opacity-100"}`}
                          title="Filter"
                        >
                          <Filter className="w-3 h-3" />
                        </button>
                      </div>
                      {openFilter === c.key && (
                        <FilterPopover
                          column={c}
                          value={filters[c.key] || ""}
                          onChange={(v) => setFilters((f) => ({ ...f, [c.key]: v }))}
                          onClose={() => setOpenFilter(null)}
                        />
                      )}
                      {/* Resize handle */}
                      <ResizeHandle
                        onResize={(dx) => setColWidths((w) => ({ ...w, [c.key]: Math.max(80, (w[c.key] ?? 160) + dx) }))}
                      />
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan={columns.length + 1} className="text-center py-16 text-muted-foreground">{emptyState ?? "No data"}</td></tr>
              ) : filtered.map((row) => (
                <tr
                  key={row.id}
                  className={`border-b border-border/50 transition group ${selected.has(row.id) ? "bg-primary/5" : "hover:bg-muted/40"}`}
                >
                  <td className="px-3 py-2.5">
                    <input
                      type="checkbox"
                      checked={selected.has(row.id)}
                      onChange={(e) => {
                        setSelected((s) => {
                          const n = new Set(s);
                          if (e.target.checked) n.add(row.id); else n.delete(row.id);
                          return n;
                        });
                      }}
                      className="accent-primary cursor-pointer"
                    />
                  </td>
                  {columns.map((c) => (
                    <td key={c.key} className="px-3 py-2.5 truncate" onClick={(e) => {
                      if (!editMode && onRowClick && (e.target as HTMLElement).tagName !== "INPUT" && (e.target as HTMLElement).tagName !== "SELECT") onRowClick(row);
                    }}>
                      <Cell row={row} column={c} editMode={editMode && c.editable !== false} onUpdate={onUpdate} />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {showBulkEdit && onBulkUpdate && (
        <BulkEditDialog
          columns={columns.filter((c) => c.editable !== false)}
          count={selected.size}
          onClose={() => setShowBulkEdit(false)}
          onApply={async (patch) => {
            await onBulkUpdate([...selected], patch as Partial<T>);
            setShowBulkEdit(false);
            setSelected(new Set());
          }}
        />
      )}
    </div>
  );
}

function ResizeHandle({ onResize }: { onResize: (dx: number) => void }) {
  const startX = useRef(0);
  const dragging = useRef(false);
  const onMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    startX.current = e.clientX;
    dragging.current = true;
    let last = e.clientX;
    const move = (ev: MouseEvent) => {
      if (!dragging.current) return;
      const dx = ev.clientX - last;
      last = ev.clientX;
      onResize(dx);
    };
    const up = () => {
      dragging.current = false;
      window.removeEventListener("mousemove", move);
      window.removeEventListener("mouseup", up);
    };
    window.addEventListener("mousemove", move);
    window.addEventListener("mouseup", up);
  };
  return <span onMouseDown={onMouseDown} className="absolute right-0 top-0 bottom-0 w-1.5 cursor-col-resize hover:bg-primary/40 transition" />;
}

function FilterPopover<T>({ column, value, onChange, onClose }: { column: Column<T>; value: string; onChange: (v: string) => void; onClose: () => void }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const onDoc = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) onClose(); };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [onClose]);
  return (
    <div ref={ref} className="absolute top-full left-0 mt-1 w-56 z-30 glow-card rounded-xl p-2 shadow-xl">
      {column.type === "select" && column.options ? (
        <select autoFocus value={value} onChange={(e) => onChange(e.target.value)} className="w-full px-2 py-1.5 rounded-lg bg-muted border border-border text-sm font-normal">
          <option value="">All</option>
          {column.options.map((o) => <option key={o} value={o}>{o}</option>)}
        </select>
      ) : (
        <input autoFocus value={value} onChange={(e) => onChange(e.target.value)} placeholder="Filter..." className="w-full px-2 py-1.5 rounded-lg bg-muted border border-border text-sm font-normal" />
      )}
    </div>
  );
}

function Cell<T extends { id: string; [k: string]: any }>({ row, column, editMode, onUpdate }: { row: T; column: Column<T>; editMode: boolean; onUpdate?: (id: string, patch: Partial<T>) => any }) {
  const raw = column.accessor ? column.accessor(row) : row[column.key];
  const [value, setValue] = useState<any>(raw);
  useEffect(() => setValue(raw), [raw]);

  if (!editMode || !onUpdate) {
    if (column.render) return <>{column.render(row)}</>;
    return <span className="block truncate">{formatVal(raw, column)}</span>;
  }

  const commit = (v: any) => {
    if (v === raw) return;
    onUpdate(row.id, { [column.key]: v } as Partial<T>);
  };

  if (column.type === "select" && column.options) {
    return (
      <select
        value={value ?? ""}
        onChange={(e) => { setValue(e.target.value); commit(e.target.value); }}
        className="w-full px-1.5 py-1 rounded bg-card border border-primary/30 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
      >
        {column.options.map((o) => <option key={o} value={o}>{o}</option>)}
      </select>
    );
  }
  if (column.type === "number" || column.type === "currency") {
    return (
      <input
        type="number"
        value={value ?? 0}
        onChange={(e) => setValue(e.target.value)}
        onBlur={() => commit(Number(value))}
        onKeyDown={(e) => { if (e.key === "Enter") (e.target as HTMLInputElement).blur(); }}
        className="w-full px-1.5 py-1 rounded bg-card border border-primary/30 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
      />
    );
  }
  return (
    <input
      value={value ?? ""}
      onChange={(e) => setValue(e.target.value)}
      onBlur={() => commit(value)}
      onKeyDown={(e) => { if (e.key === "Enter") (e.target as HTMLInputElement).blur(); }}
      className="w-full px-1.5 py-1 rounded bg-card border border-primary/30 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
    />
  );
}

function formatVal(v: any, c: Column<any>) {
  if (v == null || v === "") return "—";
  if (Array.isArray(v)) return v.join(", ");
  if (c.type === "date" && v) try { return new Date(v).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }); } catch { return v; }
  if (c.type === "currency") return "₹" + Number(v).toLocaleString("en-IN");
  return String(v);
}

function BulkEditDialog({ columns, count, onClose, onApply }: { columns: Column<any>[]; count: number; onClose: () => void; onApply: (p: Record<string, any>) => void }) {
  const [field, setField] = useState(columns[0]?.key || "");
  const [value, setValue] = useState<any>("");
  const col = columns.find((c) => c.key === field);
  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in" onClick={onClose}>
      <div onClick={(e) => e.stopPropagation()} className="glow-card rounded-2xl p-6 w-full max-w-md animate-scale-in">
        <h3 className="text-lg font-bold mb-1">Bulk Edit {count} item{count !== 1 ? "s" : ""}</h3>
        <p className="text-sm text-muted-foreground mb-4">Field changes will apply to all selected rows.</p>
        <div className="space-y-3">
          <div>
            <label className="text-xs font-semibold mb-1 block">Field</label>
            <select value={field} onChange={(e) => { setField(e.target.value); setValue(""); }} className="w-full px-3 py-2 rounded-lg bg-muted border border-border">
              {columns.map((c) => <option key={c.key} value={c.key}>{c.label}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs font-semibold mb-1 block">New value</label>
            {col?.type === "select" && col.options ? (
              <select value={value} onChange={(e) => setValue(e.target.value)} className="w-full px-3 py-2 rounded-lg bg-muted border border-border">
                <option value="">— choose —</option>
                {col.options.map((o) => <option key={o} value={o}>{o}</option>)}
              </select>
            ) : (
              <input value={value} onChange={(e) => setValue(e.target.value)} className="w-full px-3 py-2 rounded-lg bg-muted border border-border" placeholder="Enter value..." />
            )}
          </div>
        </div>
        <div className="flex gap-2 justify-end mt-6">
          <button onClick={onClose} className="px-4 py-2 rounded-lg bg-muted hover:bg-muted/70 text-sm">Cancel</button>
          <button onClick={() => { if (field && value !== "") onApply({ [field]: col?.type === "number" || col?.type === "currency" ? Number(value) : value }); }} className="btn-glossy px-4 py-2 rounded-lg text-sm font-semibold flex items-center gap-1.5">
            <Check className="w-4 h-4" /> Apply
          </button>
        </div>
      </div>
    </div>
  );
}
