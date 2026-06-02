import { Camera, Mic, Brain, FileCheck } from "lucide-react";

const steps = [
  { n: "01", icon: Camera, title: "Cadastro por foto", desc: "Secretaria fotografa o RG e a IA preenche todos os campos do cadastro automaticamente." },
  { n: "02", icon: Mic, title: "Ditado por voz", desc: "Médico grava áudio descrevendo a consulta. O Whisper transcreve em tempo real." },
  { n: "03", icon: Brain, title: "Estruturação por IA", desc: "A IA monta o laudo com hipótese, exames, conduta e CID-10 sugerido." },
  { n: "04", icon: FileCheck, title: "Revisão e exportação", desc: "Médico revisa, ajusta e exporta o laudo final em PDF assinado." },
];

const HowItWorks = () => {
  return (
    <section id="como-funciona" className="bg-surface py-24 px-6 lg:px-[120px]">
      <div className="max-w-7xl mx-auto">
        <div className="max-w-2xl mb-16">
          <p className="font-pill text-primary text-sm uppercase tracking-widest mb-3">Como funciona</p>
          <h2 className="font-serif text-foreground text-4xl md:text-5xl lg:text-6xl leading-[1.05]">
            Do <i className="italic">RG</i> ao laudo final em minutos.
          </h2>
        </div>

        <div className="relative grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-6">
          {/* Linha conectora desktop */}
          <div aria-hidden className="hidden lg:block absolute top-10 left-0 right-0 h-px bg-gradient-to-r from-transparent via-border to-transparent" />

          {steps.map(({ n, icon: Icon, title, desc }) => (
            <div key={n} className="relative bg-white rounded-xl p-6 shadow-card hover:shadow-card-hover transition-shadow border border-border/60">
              <div className="flex items-center justify-between mb-4">
                <span className="font-serif text-5xl text-primary leading-none">{n}</span>
                <div className="bg-primary/10 text-primary p-2.5 rounded-lg">
                  <Icon size={22} />
                </div>
              </div>
              <h3 className="font-sans font-semibold text-foreground text-lg mb-2">{title}</h3>
              <p className="font-body text-muted-foreground text-sm leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default HowItWorks;
