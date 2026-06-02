import { ShieldCheck, Lock, Server, EyeOff } from "lucide-react";

const items = [
  { icon: ShieldCheck, title: "LGPD compliant", desc: "Tratamento de dados pessoais sensíveis em conformidade com a Lei 13.709/2018, com DPO designado." },
  { icon: EyeOff, title: "Anonimização antes da IA", desc: "CPF, nome completo e e-mail são removidos do prompt antes de qualquer chamada ao modelo." },
  { icon: Server, title: "Hospedagem brasileira", desc: "Data residency em São Paulo (AWS sa-east-1). Seus dados não saem do território nacional." },
  { icon: Lock, title: "Criptografia AES-256", desc: "Dados em repouso e em trânsito criptografados. Backups diários com retenção de 30 dias." },
];

const Security = () => {
  return (
    <section id="seguranca" className="bg-surface-muted py-24 px-6 lg:px-[120px]">
      <div className="max-w-7xl mx-auto">
        <div className="max-w-2xl mb-14">
          <p className="font-pill text-primary text-sm uppercase tracking-widest mb-3">Segurança & Conformidade</p>
          <h2 className="font-serif text-foreground text-4xl md:text-5xl lg:text-6xl leading-[1.05]">
            Dados clínicos exigem <i className="italic">o máximo</i>.
          </h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {items.map(({ icon: Icon, title, desc }) => (
            <div key={title} className="bg-white rounded-xl p-7 border border-border/60 shadow-card hover:shadow-card-hover transition-shadow">
              <div className="bg-primary/10 text-primary inline-flex p-3 rounded-lg mb-5">
                <Icon size={24} />
              </div>
              <h3 className="font-sans font-semibold text-foreground text-xl mb-2">{title}</h3>
              <p className="font-body text-muted-foreground leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Security;
