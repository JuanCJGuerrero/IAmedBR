import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronDown, Menu, X, Mic, Camera, ShieldCheck } from "lucide-react";

const IAmedBRHero = () => {
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setIsScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <div className="relative min-h-screen w-full overflow-hidden font-body">
      {/*
        Background Video — o mp4 do CDN tem tons magenta/violeta baked-in.
        Aplicamos filter na tag video para desaturar e forçar matiz azul,
        depois cobrimos com camadas para garantir que a paleta fique
        100% azul da marca (sem vazar roxo).
      */}
      <video
        autoPlay
        loop
        muted
        playsInline
        className="absolute top-0 left-0 w-full h-full object-cover z-0"
        style={{
          filter:
            "saturate(0.55) hue-rotate(-25deg) brightness(0.85) contrast(1.05)",
        }}
      >
        <source
          src="https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260210_031346_d87182fb-b0af-4273-84d1-c6fd17d6bf0f.mp4"
          type="video/mp4"
        />
      </video>

      {/* 1) Tint azul-marinho com mix-blend-color: re-pinta o video em azul */}
      <div
        aria-hidden
        className="absolute inset-0 z-[5] pointer-events-none"
        style={{
          backgroundColor: "hsl(217 100% 50%)",
          mixBlendMode: "color",
          opacity: 0.55,
        }}
      />

      {/* 2) Overlay escuro principal para contraste do texto */}
      <div
        aria-hidden
        className="absolute inset-0 z-10 pointer-events-none"
        style={{
          background:
            "linear-gradient(180deg, hsl(222 47% 11% / 0.55) 0%, hsl(222 47% 8% / 0.75) 100%)",
        }}
      />

      {/* 3) Glow primario azul (canto superior direito) */}
      <div
        aria-hidden
        className="absolute -top-32 -right-32 w-[42rem] h-[42rem] rounded-full blur-3xl z-[11] pointer-events-none"
        style={{
          background:
            "radial-gradient(circle, hsl(217 100% 50% / 0.35) 0%, transparent 60%)",
        }}
      />

      {/* 4) Glow secundario ciano (canto inferior esquerdo) */}
      <div
        aria-hidden
        className="absolute -bottom-40 -left-32 w-[40rem] h-[40rem] rounded-full blur-3xl z-[11] pointer-events-none"
        style={{
          background:
            "radial-gradient(circle, hsl(190 95% 55% / 0.18) 0%, transparent 55%)",
        }}
      />

      {/* 5) Glow central sutil atras do titulo */}
      <div
        aria-hidden
        className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[60rem] h-[30rem] blur-3xl z-[12] pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse at center, hsl(217 100% 60% / 0.10) 0%, transparent 70%)",
        }}
      />

      {/* Navbar — sticky com transição suave para fundo translúcido escuro */}
      <nav
        className={`fixed top-0 left-0 right-0 z-40 flex items-center justify-between px-6 lg:px-[120px] py-[16px] transition-all duration-300 ${
          isScrolled
            ? "bg-background-dark/70 backdrop-blur-md border-b border-white/10 shadow-lg"
            : "bg-transparent border-b border-transparent"
        }`}
      >
        <div className="flex items-center gap-12">
          <div className="flex items-center gap-2">
            <div className="bg-white p-1.5 rounded-lg shadow-sm">
              <svg width="28" height="28" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M20 5L5 12.5V27.5L20 35L35 27.5V12.5L20 5Z" stroke="hsl(var(--primary))" strokeWidth="3" strokeLinejoin="round" />
                <path d="M12 20H28M20 12V28" stroke="hsl(var(--primary))" strokeWidth="3" strokeLinecap="round" />
              </svg>
            </div>
            <span className="text-white font-sans font-bold text-xl tracking-tight">IAmedBR</span>
          </div>
          <div className="hidden lg:flex items-center gap-8 font-sans font-medium text-[14px] text-white">
            <a href="#" className="hover:opacity-80 transition-opacity">Secretaria</a>
            <a href="#" className="hover:opacity-80 transition-opacity flex items-center gap-1">
              Médico <ChevronDown size={14} />
            </a>
            <a href="#" className="hover:opacity-80 transition-opacity">Laudos com IA</a>
            <a href="#" className="hover:opacity-80 transition-opacity">Preços</a>
          </div>
        </div>

        <div className="hidden lg:flex items-center gap-4">
          <button onClick={() => navigate("/login")} className="bg-white border border-border px-5 py-2 rounded-[8px] text-foreground font-sans font-semibold text-[14px] shadow-sm hover:scale-[1.02] hover:shadow-md transition-all duration-200">
            Acesso Secretaria
          </button>
          <button onClick={() => navigate("/login")} className="bg-primary px-5 py-2 rounded-[8px] text-primary-foreground font-sans font-semibold text-[14px] shadow-primary hover:scale-[1.02] hover:shadow-[0_12px_32px_-8px_hsl(var(--primary)/0.6)] transition-all duration-200">
            Área do Médico
          </button>
        </div>

        <button className="lg:hidden text-white" onClick={() => setIsMenuOpen(true)} aria-label="Abrir menu">
          <Menu size={28} />
        </button>
      </nav>

      {/* Hero Content */}
      <div className="relative z-20 flex flex-col items-center justify-center text-center pt-32 lg:pt-40 px-6 pb-24">
        <div className="flex items-center gap-3 px-3 py-1 h-[38px] rounded-[10px] bg-background-dark/40 backdrop-blur-xl border border-white/15 mb-8">
          <span className="bg-accent px-2 py-0.5 rounded-[6px] text-accent-foreground font-pill font-medium text-[12px]">
            Beta v3.2
          </span>
          <span className="text-white font-pill font-medium text-[14px]">
            O fim da digitação manual de laudos
          </span>
        </div>

        <h1 className="font-serif text-white text-5xl md:text-7xl lg:text-[96px] leading-[1.05] max-w-6xl mb-6">
          Cuide do seu paciente <br />
          <i className="pr-2 italic">enquanto</i> a IA cuida do laudo.
        </h1>

        <p className="font-body font-normal text-white/70 text-lg md:text-xl max-w-[700px] mb-10 leading-relaxed">
          Automação ponta a ponta: do cadastro por foto do RG à geração de laudos estruturados por voz. Economize horas de digitação todos os dias.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 mb-16">
          <button onClick={() => navigate("/login")} className="flex items-center justify-center gap-2 bg-primary px-8 py-4 rounded-[10px] text-primary-foreground font-pill font-medium text-[17px] shadow-primary hover:scale-[1.02] hover:shadow-[0_16px_40px_-8px_hsl(var(--primary)/0.65)] transition-all duration-200">
            <Mic size={18} /> Começar Gratuitamente
          </button>
          <button onClick={() => navigate("/login")} className="flex items-center justify-center gap-2 bg-background-dark/80 backdrop-blur-sm px-8 py-4 rounded-[10px] text-white font-pill font-medium text-[17px] border border-white/15 hover:scale-[1.02] hover:bg-background-dark hover:shadow-[0_12px_32px_-8px_rgba(0,0,0,0.6)] transition-all duration-200">
            Ver Demo do Laudo
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl w-full">
          <div className="flex items-center gap-4 bg-white/5 backdrop-blur-sm p-4 rounded-xl border border-white/10 text-left ring-1 ring-primary/10 hover:ring-primary/30 transition-all duration-200">
            <div className="bg-primary/20 ring-1 ring-primary/30 p-2 rounded-lg text-primary"><Camera size={20} /></div>
            <div>
              <p className="text-white font-sans font-semibold text-sm">Secretaria</p>
              <p className="text-white/50 text-xs font-body">Cadastro via foto do RG</p>
            </div>
          </div>
          <div className="flex items-center gap-4 bg-white/5 backdrop-blur-sm p-4 rounded-xl border border-white/10 text-left ring-1 ring-accent/10 hover:ring-accent/30 transition-all duration-200">
            <div className="bg-accent/20 ring-1 ring-accent/30 p-2 rounded-lg text-accent"><Mic size={20} /></div>
            <div>
              <p className="text-white font-sans font-semibold text-sm">Dictation</p>
              <p className="text-white/50 text-xs font-body">Transcreve e gera o CID</p>
            </div>
          </div>
          <div className="flex items-center gap-4 bg-white/5 backdrop-blur-sm p-4 rounded-xl border border-white/10 text-left ring-1 ring-white/5 hover:ring-white/20 transition-all duration-200">
            <div className="bg-white/15 ring-1 ring-white/20 p-2 rounded-lg text-white"><ShieldCheck size={20} /></div>
            <div>
              <p className="text-white font-sans font-semibold text-sm">Segurança</p>
              <p className="text-white/50 text-xs font-body">Cloud em conformidade LGPD</p>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Menu Overlay */}
      {isMenuOpen && (
        <div className="fixed inset-0 z-50 bg-background-dark flex flex-col p-8 animate-in slide-in-from-right duration-300">
          <div className="flex justify-between items-center">
            <span className="text-white font-sans font-bold text-xl">IAmedBR</span>
            <button className="text-white" onClick={() => setIsMenuOpen(false)} aria-label="Fechar menu">
              <X size={32} />
            </button>
          </div>
          <div className="flex flex-col gap-8 mt-16 text-white font-sans text-3xl font-light">
            <a href="#" onClick={() => setIsMenuOpen(false)}>A Secretaria</a>
            <a href="#" onClick={() => setIsMenuOpen(false)}>O Médico</a>
            <a href="#" onClick={() => setIsMenuOpen(false)}>Laudos IA</a>
            <a href="#" onClick={() => setIsMenuOpen(false)}>Contato</a>
          </div>
          <div className="mt-auto flex flex-col gap-4">
            <button onClick={() => navigate("/login")} className="bg-primary py-5 rounded-xl text-primary-foreground font-sans font-bold text-lg hover:scale-[1.02] hover:shadow-[0_16px_40px_-8px_hsl(var(--primary)/0.65)] transition-all duration-200">
              Criar Conta Grátis
            </button>
            <button onClick={() => navigate("/login")} className="border border-white/20 py-5 rounded-xl text-white font-sans font-bold text-lg hover:scale-[1.02] hover:bg-white/5 transition-all duration-200">
              Login
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default IAmedBRHero;
