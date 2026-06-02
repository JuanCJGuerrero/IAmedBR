import { Linkedin, Instagram, Youtube, Twitter } from "lucide-react";

const cols = [
  { title: "Produto", links: ["Para Secretaria", "Para Médico", "Laudos com IA", "Modelos", "Integrações"] },
  { title: "Empresa", links: ["Sobre", "Blog clínico", "Carreiras", "Imprensa", "Contato"] },
  { title: "Recursos", links: ["Documentação", "Central de ajuda", "Status", "Webinars", "Comunidade"] },
  { title: "Legal", links: ["Termos de uso", "Política de privacidade", "LGPD", "DPO", "Sub-processadores"] },
];

const Footer = () => {
  return (
    <footer className="bg-background-dark text-white pt-20 pb-10 px-6 lg:px-[120px]">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 mb-14">
          {/* Marca + newsletter */}
          <div className="lg:col-span-4">
            <div className="flex items-center gap-2 mb-5">
              <div className="bg-white p-1.5 rounded-lg">
                <svg width="24" height="24" viewBox="0 0 40 40" fill="none">
                  <path d="M20 5L5 12.5V27.5L20 35L35 27.5V12.5L20 5Z" stroke="hsl(var(--primary))" strokeWidth="3" strokeLinejoin="round" />
                  <path d="M12 20H28M20 12V28" stroke="hsl(var(--primary))" strokeWidth="3" strokeLinecap="round" />
                </svg>
              </div>
              <span className="font-sans font-bold text-lg">IAmedBR</span>
            </div>
            <p className="font-body text-white/60 text-sm leading-relaxed mb-6 max-w-sm">
              Cuide do seu paciente enquanto a IA cuida do laudo.
            </p>
            <form
              onSubmit={(e) => e.preventDefault()}
              className="flex gap-2 max-w-sm"
            >
              <input
                type="email"
                placeholder="seu@email.com"
                className="flex-1 h-11 px-4 rounded-[8px] bg-white/5 border border-white/15 text-white placeholder:text-white/40 font-body text-sm focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/30 transition"
              />
              <button
                type="submit"
                className="bg-primary text-primary-foreground font-sans font-semibold text-sm px-5 rounded-[8px] hover:scale-[1.02] hover:shadow-[0_12px_32px_-8px_hsl(var(--primary)/0.6)] transition-all duration-200"
              >
                Inscrever
              </button>
            </form>
          </div>

          {/* Colunas */}
          <div className="lg:col-span-8 grid grid-cols-2 md:grid-cols-4 gap-8">
            {cols.map((c) => (
              <div key={c.title}>
                <p className="font-sans font-semibold text-white text-sm mb-4">{c.title}</p>
                <ul className="space-y-2.5">
                  {c.links.map((l) => (
                    <li key={l}>
                      <a href="#" className="font-body text-white/60 hover:text-white text-sm transition-colors">
                        {l}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        {/* Disclaimer clínico */}
        <div className="rounded-xl bg-white/5 border border-white/10 p-5 mb-10">
          <p className="font-body text-white/70 text-xs leading-relaxed text-center">
            <strong className="text-white/90 font-sans">Importante:</strong> A IA atua apenas como suporte e não substitui o julgamento médico. Toda decisão clínica é de responsabilidade do profissional habilitado.
          </p>
        </div>

        {/* Bottom */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 pt-8 border-t border-white/10">
          <p className="font-body text-white/50 text-xs">
            © {new Date().getFullYear()} IAmedBR. Todos os direitos reservados. CNPJ 00.000.000/0001-00.
          </p>
          <div className="flex items-center gap-3">
            {[Linkedin, Instagram, Youtube, Twitter].map((Icon, i) => (
              <a
                key={i}
                href="#"
                className="h-9 w-9 inline-flex items-center justify-center rounded-lg bg-white/5 border border-white/10 text-white/70 hover:text-white hover:bg-white/10 hover:scale-105 transition-all"
                aria-label="Rede social"
              >
                <Icon size={16} />
              </a>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
