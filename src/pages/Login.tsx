import { useState } from "react";
import { useAuth } from "@/lib/auth";
import { useNavigate } from "react-router-dom";
import { Sparkles, Lock, User, LogIn } from "lucide-react";
import { toast } from "sonner";

export default function Login() {
  const { login } = useAuth();
  const nav = useNavigate();
  const [u, setU] = useState("");
  const [p, setP] = useState("");
  const [loading, setLoading] = useState(false);

  const handle = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => {
      if (login(u.trim(), p)) {
        toast.success("Welcome back to ClinicOS");
        nav("/", { replace: true });
      } else {
        toast.error("Invalid credentials");
      }
      setLoading(false);
    }, 400);
  };

  return (
    <div className="min-h-screen relative overflow-hidden flex items-center justify-center p-4" style={{ background: "var(--gradient-glow), hsl(var(--background))" }}>
      <div className="absolute -top-24 -left-24 w-96 h-96 rounded-full opacity-30 blur-3xl float-anim" style={{ background: "var(--gradient-primary)" }} />
      <div className="absolute -bottom-24 -right-24 w-96 h-96 rounded-full opacity-30 blur-3xl float-anim" style={{ background: "var(--gradient-primary)", animationDelay: "2s" }} />

      <div className="relative z-10 w-full max-w-md animate-scale-in">
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 mb-4">
            <div className="w-14 h-14 rounded-2xl gradient-bg flex items-center justify-center shadow-lg">
              <Sparkles className="w-7 h-7 text-white" />
            </div>
          </div>
          <h1 className="text-4xl font-bold tracking-tight">
            <span className="gradient-text">ClinicOS</span>
          </h1>
          <p className="text-muted-foreground mt-2">The Operating System for Clinic Growth</p>
        </div>

        <form onSubmit={handle} className="glow-card rounded-3xl p-8 space-y-5">
          <div>
            <label className="text-sm font-medium mb-2 block">Username</label>
            <div className="relative">
              <User className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input
                autoFocus
                value={u}
                onChange={(e) => setU(e.target.value)}
                className="w-full pl-10 pr-3 py-3 rounded-xl bg-muted/50 border border-border focus:outline-none focus:ring-2 focus:ring-primary transition"
                placeholder="Enter username"
                autoComplete="off"
              />
            </div>
          </div>
          <div>
            <label className="text-sm font-medium mb-2 block">Password</label>
            <div className="relative">
              <Lock className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input
                type="password"
                value={p}
                onChange={(e) => setP(e.target.value)}
                className="w-full pl-10 pr-3 py-3 rounded-xl bg-muted/50 border border-border focus:outline-none focus:ring-2 focus:ring-primary transition"
                placeholder="Enter password"
                autoComplete="off"
              />
            </div>
          </div>
          <button
            type="submit"
            disabled={loading}
            className="btn-glossy w-full py-3 rounded-xl font-semibold flex items-center justify-center gap-2 disabled:opacity-60"
          >
            <LogIn className="w-4 h-4" />
            {loading ? "Signing in..." : "Sign in to ClinicOS"}
          </button>
          <p className="text-xs text-center text-muted-foreground pt-2">Secure clinic access · India · INR</p>
        </form>
      </div>
    </div>
  );
}
