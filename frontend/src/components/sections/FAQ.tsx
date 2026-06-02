import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

const faqs = [
  {
    q: "A IA substitui o médico?",
    a: "Não. A IAmedBR é uma ferramenta de suporte que acelera a redação do laudo. A decisão clínica, a interpretação e a assinatura final são sempre do médico responsável.",
  },
  {
    q: "Os dados do paciente vão para a OpenAI/Groq?",
    a: "Não enviamos dados identificáveis. Antes de qualquer chamada à IA, removemos automaticamente CPF, nome completo, RG, e-mail e telefone do prompt — apenas o conteúdo clínico anonimizado é processado.",
  },
  {
    q: "Quanto tempo leva para implantar?",
    a: "Planos Solo e Clínica começam no mesmo dia: cadastro, login e uso imediato. Para o plano Hospital, o onboarding com integração HIS/RIS leva em média de 2 a 4 semanas.",
  },
  {
    q: "Funciona offline?",
    a: "A geração de laudos por IA exige conexão. Porém, a captura de áudio e o cadastro continuam funcionando offline e sincronizam automaticamente quando a internet retorna.",
  },
  {
    q: "A plataforma é homologada pelo CFM?",
    a: "A IAmedBR segue as recomendações do CFM (Resolução 2.314/2022 sobre telemedicina) e do Manual de Certificação para Sistemas de Registro Eletrônico em Saúde (SBIS/CFM). A homologação SBIS NGS2 está em andamento.",
  },
  {
    q: "Posso exportar todos os laudos se cancelar?",
    a: "Sim. Você pode exportar 100% dos seus laudos em PDF e dos seus dados estruturados em CSV/JSON a qualquer momento, inclusive após o cancelamento. Os dados ficam disponíveis por 90 dias após o término do contrato.",
  },
];

const FAQ = () => {
  return (
    <section id="faq" className="bg-surface py-24 px-6 lg:px-[120px]">
      <div className="max-w-3xl mx-auto">
        <div className="text-center mb-14">
          <p className="font-pill text-primary text-sm uppercase tracking-widest mb-3">Perguntas frequentes</p>
          <h2 className="font-serif text-foreground text-4xl md:text-5xl lg:text-6xl leading-[1.05]">
            Tudo o que você <i className="italic">precisa</i> saber.
          </h2>
        </div>

        <Accordion type="single" collapsible className="space-y-3">
          {faqs.map((f, i) => (
            <AccordionItem
              key={i}
              value={`item-${i}`}
              className="bg-white rounded-xl border border-border/60 px-6 shadow-card"
            >
              <AccordionTrigger className="font-sans font-semibold text-foreground text-left text-base md:text-lg hover:no-underline py-5">
                {f.q}
              </AccordionTrigger>
              <AccordionContent className="font-body text-muted-foreground leading-relaxed text-[15px] pb-5">
                {f.a}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </section>
  );
};

export default FAQ;
