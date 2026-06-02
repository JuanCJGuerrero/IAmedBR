import { useState, FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
  Shield,
  Brain,
  Sparkles,
  Zap,
  Loader2,
  ShieldCheck,
} from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "../../auth/AuthContext";
import "./index.css";

type FeatureProps = {
  icon: React.ReactNode;
  title: string;
  description: string;
};

const Feature = ({ icon, title, description }: FeatureProps) => (
  <div className="feature">
    <div className="feature-icon">{icon}</div>
    <div>
      <p className="feature-title">{title}</p>
      <p className="feature-desc">{description}</p>
    </div>
  </div>
);

const Login = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const navigate = useNavigate();
  const { signIn } = useAuth();

  const handleSubmit = async (e: FormEvent<HTMLFormElement>): Promise<void> => {
    e.preventDefault();
    if (!email || !password) {
      toast.error("Preencha e-mail e senha");
      return;
    }
    setSubmitting(true);
    try {
      await signIn(email, password, rememberMe);
      navigate("/dashboard", { replace: true });
    } catch (err: any) {
      const status = err?.response?.status;
      toast.error(
        status === 401 || status === 400
          ? "E-mail ou senha invalidos"
          : "Erro ao entrar. Tente novamente."
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="login-page">
      {/* ============== LADO ESQUERDO (visual) ============== */}
      <aside className="login-hero">
        <div className="brand">
          <span className="brand-mark"><Brain /></span>
          <span className="brand-name">MediPlataforma</span>
        </div>

        <div className="hero-copy">
          <h1>Laudos precisos<br />em segundos.</h1>
          <p>
            Automatize a estruturacao de dados clinicos e gere laudos com o
            apoio da IA. Reduza o tempo de analise e aumente a seguranca
            diagnostica da sua clinica.
          </p>
        </div>

        <div className="hero-features">
          <Feature
            icon={<Zap />}
            title="Laudos em tempo real"
            description="Suporte clinico instantaneo."
          />
          <Feature
            icon={<Brain />}
            title="Organizacao inteligente"
            description="Dados estruturados automaticamente."
          />
          <Feature
            icon={<ShieldCheck />}
            title="Maior seguranca"
            description="Precisao e reducao de tempo na analise."
          />
        </div>
      </aside>

      {/* ============== LADO DIREITO (formulario) ============== */}
      <main className="login-side">
        <div className="form-card">
          <div className="brand-mobile">
            <span className="brand-mark"><Brain /></span>
            <span className="brand-name">MediPlataforma</span>
          </div>

          <h2 className="form-title">Acessar plataforma</h2>
          <p className="form-subtitle">
            Use suas credenciais profissionais para entrar.
          </p>

          <form
            onSubmit={handleSubmit}
            autoComplete="on"
            noValidate
            className="login-form"
          >
            {/* E-mail */}
            <div className="field">
              <label htmlFor="email">E-mail profissional</label>
              <div className="input-wrap">
                <Mail className="input-icon" />
                <input
                  type="email"
                  id="email"
                  name="email"
                  autoComplete="username"
                  placeholder="medico@clinica.com.br"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
            </div>

            {/* Senha */}
            <div className="field">
              <div className="field-label-row">
                <label htmlFor="password">Senha</label>
                <Link to="/forgot-password" className="forgot-link">
                  Recuperar acesso
                </Link>
              </div>
              <div className="input-wrap">
                <Lock className="input-icon" />
                <input
                  type={showPassword ? "text" : "password"}
                  id="password"
                  name="password"
                  autoComplete="current-password"
                  placeholder="********"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  minLength={6}
                  required
                />
                <button
                  type="button"
                  className="password-toggle"
                  onClick={() => setShowPassword((p) => !p)}
                  aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
                >
                  {showPassword ? <Eye /> : <EyeOff />}
                </button>
              </div>
            </div>

            {/* Manter conectado */}
            <label className="remember-row">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
              />
              Manter conectado
            </label>

            {/* Botao Entrar */}
            <button
              type="submit"
              className="btn-submit"
              disabled={submitting}
              aria-busy={submitting}
            >
              {submitting ? (
                <>
                  <Loader2 className="spin" />
                  Entrando...
                </>
              ) : (
                <>
                  Entrar
                  <ArrowRight />
                </>
              )}
            </button>
          </form>

          <p className="register-text">
            Ainda nao usa IA no consultorio?{" "}
            <Link to="/register">Ativar acesso</Link>
          </p>

          <div className="trust-row">
            <span><Brain className="trust-blue" /> IA em tempo real</span>
            <span><Shield className="trust-green" /> LGPD</span>
            <span><Sparkles className="trust-amber" /> CFM</span>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Login;
