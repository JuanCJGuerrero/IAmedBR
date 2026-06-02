import { Check } from "lucide-react";

type Plan = {
  name: string;
  price: string;
  period?: string;
  desc: string;
  features: string[];
  cta: string;
  highlight?: boolean;
};

const plans: Plan[] = [
  {
    name: "Solo",
    price: "R$ 199",
    period: "/mês",
    desc: "Para o médico individual que quer ganhar tempo.",
    features: ["Até 200 laudos/mês", "1 usuário médico", "Modelos prontos", "Ditado por voz", "Suporte por e-mail"],
    cta: "Começar grátis 14 dias",
  },
  {
    name: "Clínica",
    price: "R$ 599",
    period: "/mês",
    desc: "Para clínicas com equipe completa.",
    features: ["Até 2.000 laudos/mês", "Até 5 médicos + 2 secretárias", "Dashboard de métricas", "Kanban e prontuário", "Suporte prioritário"],
    cta: "Começar grátis 14 dias",
    highlight: true,
  },
  {
    name: "Hospital",
    price: "Sob consulta",
    desc: "Operação multi-clínica e integrações.",
    features: ["Laudos ilimitados", "Multi-clínica", "SLA dedicado", "Integração HIS/RIS", "Onboarding assistido"],
    cta: "Falar com vendas",
  },
];

const Pricing = () => {
  return (
    <section id="precos" className="bg-white py-24 px-6 lg:px-[120px]">
      <div className="max-w-7xl mx-auto">
        <div className="max-w-2xl mx-auto text-center mb-14">
          <p className="font-pill text-primary text-sm uppercase tracking-widest mb-3">Preços</p>
          <h2 className="font-serif text-foreground text-4xl md:text-5xl lg:text-6xl leading-[1.05]">
            Planos <i className="italic">claros</i>, sem surpresas.
          </h2>
          <p className="font-body text-muted-foreground mt-4">14 dias grátis. Sem cartão de crédito.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8">
          {plans.map((p) => (
            <div
              key={p.name}
              className={`relative rounded-2xl p-8 flex flex-col ${
                p.highlight
                  ? "bg-white border-2 border-primary shadow-primary lg:scale-[1.03]"
                  : "bg-white border border-border/60 shadow-card"
              }`}
            >
              {p.highlight && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground font-pill text-xs px-3 py-1 rounded-full">
                  Recomendado
                </span>
              )}
              <h3 className="font-sans font-bold text-foreground text-xl">{p.name}</h3>
              <p className="font-body text-muted-foreground text-sm mt-1 mb-6">{p.desc}</p>
              <div className="flex items-baseline gap-1 mb-8">
                <span className="font-serif text-5xl text-foreground leading-none">{p.price}</span>
                {p.period && <span className="font-body text-muted-foreground">{p.period}</span>}
              </div>
              <ul className="space-y-3 mb-10 flex-1">
                {p.features.map((f) => (
                  <li key={f} className="flex items-start gap-3 font-body text-foreground/80 text-sm">
                    <span className="mt-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-accent/15 text-accent shrink-0">
                      <Check size={12} strokeWidth={3} />
                    </span>
                    {f}
                  </li>
                ))}
              </ul>
              <button
                className={`w-full font-sans font-semibold text-[15px] py-3.5 rounded-[10px] transition-all duration-200 hover:scale-[1.02] ${
                  p.highlight
                    ? "bg-primary text-primary-foreground shadow-primary hover:shadow-[0_16px_40px_-8px_hsl(var(--primary)/0.65)]"
                    : "bg-foreground text-white hover:shadow-[0_12px_32px_-8px_rgba(0,0,0,0.4)]"
                }`}
              >
                {p.cta}
              </button>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Pricing;
