import { useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { z } from "zod";
import { Mail, Lock, Eye, EyeOff, Zap, Brain, ShieldCheck, Loader2, ArrowRight } from "lucide-react";
import Logo from "@/components/Logo";
import { auth } from "@/lib/auth";

const loginSchema = z.object({
  // Sem exigir TLD (admin@local funciona em modo real e em demo).
  email: z.string().trim().nonempty({ message: "Informe seu e-mail." }).max(255),
  password: z.string().min(6, { message: "A senha precisa ter ao menos 6 caracteres." }).max(128),
});

const features = [
  { icon: Zap, title: "Laudos em tempo real", desc: "Suporte clínico instantâneo." },
  { icon: Brain, title: "Organização inteligente", desc: "Dados estruturados automaticamente." },
  { icon: ShieldCheck, title: "Maior segurança", desc: "Precisão e redução de tempo na análise." },
];

const Login = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [keepConnected, setKeepConnected] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const parsed = loginSchema.safeParse({ email, password });
    if (!parsed.success) {
      toast.error(parsed.error.issues[0]?.message ?? "Verifique seus dados.");
      return;
    }

    setSubmitting(true);
    try {
      await auth.signIn(parsed.data.email, parsed.data.password, keepConnected);
      toast.success("Bem-vindo(a) de volta.");
      navigate("/dashboard");
    } catch (err: any) {
      const status = err?.response?.status;
      toast.error(
        status === 401 || status === 400
          ? "Credenciais invalidas. Verifique e tente novamente."
          : err?.message ?? "Erro ao entrar. Tente novamente.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="min-h-screen w-full grid grid-cols-1 lg:grid-cols-2 bg-white">
      {/* LADO ESQUERDO — visual */}
      <aside className="hidden lg:flex relative overflow-hidden flex-col justify-between p-12 bg-gradient-to-br from-blue-700 via-blue-800 to-slate-900 text-white">
        {/* Padrão de pontos */}
        <div
          aria-hidden
          className="absolute inset-0 opacity-[0.08]"
          style={{
            backgroundImage: "radial-gradient(rgb(255 255 255) 1px, transparent 1px)",
            backgroundSize: "20px 20px",
          }}
        />
        {/* Glows */}
        <div aria-hidden className="absolute -top-24 -right-24 h-96 w-96 rounded-full bg-blue-300/30 blur-3xl" />
        <div aria-hidden className="absolute -bottom-32 -left-24 h-[28rem] w-[28rem] rounded-full bg-cyan-400/25 blur-3xl" />

        <div className="relative z-10">
          <Logo size="md" variant="dark" />
        </div>

        <div className="relative z-10 max-w-md">
          <h1 className="font-serif text-5xl xl:text-6xl leading-[1.05] mb-5">
            Laudos <i className="italic">precisos</i> em segundos.
          </h1>
          <p className="font-body text-white/75 text-base leading-relaxed mb-10">
            Automatize a estruturação de dados clínicos e gere laudos com o apoio da IA. Reduza o tempo de análise e aumente a segurança diagnóstica da sua clínica.
          </p>

          <ul className="space-y-5">
            {features.map(({ icon: Icon, title, desc }) => (
              <li key={title} className="flex items-start gap-4">
                <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-white/10 border border-white/15 backdrop-blur-sm">
                  <Icon size={18} className="text-white" />
                </span>
                <div>
                  <p className="font-sans font-semibold text-[15px] leading-tight">{title}</p>
                  <p className="font-body text-white/65 text-sm">{desc}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>

        <div className="relative z-10">
          <p className="font-body text-white/50 text-xs">
            © {new Date().getFullYear()} IAmedBR · Cuide do seu paciente enquanto a IA cuida do laudo.
          </p>
        </div>
      </aside>

      {/* LADO DIREITO — formulário */}
      <section className="flex items-center justify-center p-6 sm:p-10">
        <div className="w-full max-w-md">
          {/* Logo mobile */}
          <div className="lg:hidden mb-10 flex justify-center">
            <Logo size="md" variant="light" />
          </div>

          <h2 className="font-sans font-bold text-foreground text-[28px] leading-tight">Acessar plataforma</h2>
          <p className="font-body text-muted-foreground mt-2">Use suas credenciais profissionais para entrar.</p>

          <form onSubmit={handleSubmit} className="mt-8 space-y-5" noValidate>
            {/* E-mail */}
            <div>
              <label htmlFor="email" className="block font-sans font-medium text-sm text-foreground mb-1.5">
                E-mail
              </label>
              <div className="relative">
                <Mail size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
                <input
                  id="email"
                  type="email"
                  autoComplete="email"
                  inputMode="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="seu@clinica.com.br"
                  className="w-full h-11 pl-11 pr-4 rounded-[8px] border border-slate-200 bg-white text-foreground font-body text-sm placeholder:text-muted-foreground/70 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition"
                />
              </div>
            </div>

            {/* Senha */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label htmlFor="password" className="block font-sans font-medium text-sm text-foreground">
                  Senha
                </label>
                <a href="#" className="font-sans text-sm text-primary hover:underline">
                  Recuperar acesso
                </a>
              </div>
              <div className="relative">
                <Lock size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full h-11 pl-11 pr-11 rounded-[8px] border border-slate-200 bg-white text-foreground font-body text-sm placeholder:text-muted-foreground/70 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-muted-foreground hover:text-foreground transition"
                  aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {/* Manter conectado */}
            <label className="flex items-center gap-2.5 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={keepConnected}
                onChange={(e) => setKeepConnected(e.target.checked)}
                className="h-4 w-4 rounded border-slate-300 text-primary focus:ring-primary/30 cursor-pointer"
              />
              <span className="font-body text-sm text-foreground/80">Manter conectado</span>
            </label>

            {/* Submit */}
            <button
              type="submit"
              disabled={submitting}
              className="w-full h-11 inline-flex items-center justify-center gap-2 bg-primary text-primary-foreground font-sans font-semibold text-[15px] rounded-[8px] shadow-primary hover:scale-[1.02] hover:shadow-[0_16px_40px_-8px_hsl(var(--primary)/0.65)] transition-all duration-200 disabled:opacity-70 disabled:cursor-not-allowed disabled:hover:scale-100"
            >
              {submitting ? (
                <>
                  <Loader2 size={18} className="animate-spin" /> Entrando...
                </>
              ) : (
                <>
                  Entrar <ArrowRight size={16} />
                </>
              )}
            </button>

            <p className="font-body text-sm text-center text-muted-foreground">
              Ainda não usa IA no consultório?{" "}
              <a href="#" className="text-primary font-sans font-semibold hover:underline">
                Ativar acesso
              </a>
            </p>
          </form>

          {/* Selos */}
          <div className="mt-10 pt-6 border-t border-slate-200">
            <div className="flex flex-wrap items-center justify-center gap-2">
              <span className="font-pill text-xs px-3 py-1.5 rounded-full bg-primary/10 text-primary border border-primary/15">
                🧠 IA em tempo real
              </span>
              <span className="font-pill text-xs px-3 py-1.5 rounded-full bg-accent/10 text-accent border border-accent/15">
                🛡 LGPD
              </span>
              <span className="font-pill text-xs px-3 py-1.5 rounded-full bg-warning/10 text-warning border border-warning/20">
                ✨ CFM
              </span>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
};

export default Login;
