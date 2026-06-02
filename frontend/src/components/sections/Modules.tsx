import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Camera, IdCard, FileText, BarChart3, Mic, Sparkles, BookMarked, Kanban, MessageCircle, Check } from "lucide-react";

const Bullet = ({ children }: { children: React.ReactNode }) => (
  <li className="flex items-start gap-3 font-body text-foreground/80">
    <span className="mt-1 flex h-5 w-5 items-center justify-center rounded-full bg-accent/15 text-accent shrink-0">
      <Check size={12} strokeWidth={3} />
    </span>
    <span>{children}</span>
  </li>
);

/* Mockup: Dashboard secretaria */
const SecretariaMockup = () => (
  <div className="relative rounded-2xl overflow-hidden bg-background-dark shadow-2xl border border-white/10">
    <div className="flex items-center gap-1.5 px-4 py-3 bg-white/5 border-b border-white/10">
      <span className="h-2.5 w-2.5 rounded-full bg-destructive/70" />
      <span className="h-2.5 w-2.5 rounded-full bg-warning/70" />
      <span className="h-2.5 w-2.5 rounded-full bg-accent/70" />
      <span className="ml-3 font-pill text-white/50 text-xs">secretaria.iamedbr.com.br</span>
    </div>
    <div className="p-5 grid grid-cols-3 gap-4">
      <div className="col-span-2 space-y-3">
        <div className="bg-white/5 rounded-lg p-4 border border-white/10">
          <div className="flex items-center justify-between mb-3">
            <p className="font-sans font-semibold text-white text-sm">Novo cadastro</p>
            <span className="font-pill text-xs px-2 py-0.5 rounded bg-accent/20 text-accent">RG capturado</span>
          </div>
          <div className="aspect-[16/8] rounded-md bg-gradient-to-br from-primary/20 to-accent/10 border border-white/10 flex items-center justify-center">
            <IdCard className="text-white/60" size={48} />
          </div>
          <div className="grid grid-cols-2 gap-2 mt-3">
            <div className="h-2 rounded bg-white/15" />
            <div className="h-2 rounded bg-white/15" />
            <div className="h-2 rounded bg-white/10" />
            <div className="h-2 rounded bg-white/10" />
          </div>
        </div>
      </div>
      <div className="space-y-3">
        <div className="bg-primary/15 border border-primary/30 rounded-lg p-3">
          <p className="font-pill text-primary text-[10px] uppercase tracking-wider">Hoje</p>
          <p className="font-serif text-white text-3xl">42</p>
          <p className="font-body text-white/50 text-xs">cadastros</p>
        </div>
        <div className="bg-white/5 border border-white/10 rounded-lg p-3">
          <p className="font-pill text-accent text-[10px] uppercase tracking-wider">Validados</p>
          <p className="font-serif text-white text-3xl">98%</p>
          <p className="font-body text-white/50 text-xs">CPFs OK</p>
        </div>
      </div>
    </div>
  </div>
);

/* Mockup: Editor médico + Kanban */
const MedicoMockup = () => (
  <div className="relative rounded-2xl overflow-hidden bg-background-dark shadow-2xl border border-white/10">
    <div className="flex items-center gap-1.5 px-4 py-3 bg-white/5 border-b border-white/10">
      <span className="h-2.5 w-2.5 rounded-full bg-destructive/70" />
      <span className="h-2.5 w-2.5 rounded-full bg-warning/70" />
      <span className="h-2.5 w-2.5 rounded-full bg-accent/70" />
      <span className="ml-3 font-pill text-white/50 text-xs">medico.iamedbr.com.br</span>
    </div>
    <div className="p-5 grid grid-cols-5 gap-4">
      <div className="col-span-3 bg-white/5 rounded-lg p-4 border border-white/10">
        <div className="flex items-center justify-between mb-3">
          <p className="font-sans font-semibold text-white text-sm">Laudo — USG abdome</p>
          <span className="flex items-center gap-1.5 font-pill text-xs px-2 py-0.5 rounded bg-primary/20 text-primary">
            <Mic size={10} /> gravando
          </span>
        </div>
        <div className="space-y-2">
          <div className="h-2 rounded bg-white/15 w-11/12" />
          <div className="h-2 rounded bg-white/15 w-9/12" />
          <div className="h-2 rounded bg-white/10 w-10/12" />
          <div className="h-2 rounded bg-white/10 w-7/12" />
          <div className="mt-4 p-3 rounded-md bg-accent/10 border border-accent/30">
            <p className="font-pill text-accent text-[10px] uppercase tracking-wider mb-1">CID-10 sugerido</p>
            <p className="font-sans text-white text-sm">K76.0 — Degeneração gordurosa do fígado</p>
          </div>
        </div>
      </div>
      <div className="col-span-2 grid grid-cols-2 gap-2">
        {[
          { l: "Pendente", c: "bg-warning/20 text-warning", n: 3 },
          { l: "Em revisão", c: "bg-primary/20 text-primary", n: 5 },
          { l: "Assinados", c: "bg-accent/20 text-accent", n: 12 },
          { l: "Enviados", c: "bg-white/15 text-white", n: 28 },
        ].map((k) => (
          <div key={k.l} className="bg-white/5 border border-white/10 rounded-md p-2">
            <p className={`font-pill text-[9px] uppercase tracking-wider px-1.5 py-0.5 rounded inline-block ${k.c}`}>{k.l}</p>
            <p className="font-serif text-white text-2xl mt-1">{k.n}</p>
          </div>
        ))}
      </div>
    </div>
  </div>
);

const Modules = () => {
  return (
    <section id="modulos" className="bg-white py-24 px-6 lg:px-[120px]">
      <div className="max-w-7xl mx-auto">
        <div className="max-w-2xl mb-12">
          <p className="font-pill text-primary text-sm uppercase tracking-widest mb-3">Módulos</p>
          <h2 className="font-serif text-foreground text-4xl md:text-5xl lg:text-6xl leading-[1.05]">
            Dois aplicativos, <i className="italic">um</i> só fluxo.
          </h2>
        </div>

        <Tabs defaultValue="secretaria" className="w-full">
          <TabsList className="h-auto bg-surface p-1.5 rounded-xl mb-10">
            <TabsTrigger
              value="secretaria"
              className="font-sans font-semibold text-base px-6 py-3 rounded-lg data-[state=active]:bg-white data-[state=active]:text-primary data-[state=active]:shadow-card"
            >
              Para Secretaria
            </TabsTrigger>
            <TabsTrigger
              value="medico"
              className="font-sans font-semibold text-base px-6 py-3 rounded-lg data-[state=active]:bg-white data-[state=active]:text-primary data-[state=active]:shadow-card"
            >
              Para Médico
            </TabsTrigger>
          </TabsList>

          <TabsContent value="secretaria" className="mt-0">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
              <div>
                <h3 className="font-serif text-3xl md:text-4xl text-foreground mb-4">Cadastro em segundos, dashboard em tempo real.</h3>
                <p className="font-body text-muted-foreground mb-8 leading-relaxed">
                  A IA lê o RG do paciente, valida o CPF na Receita e cria o prontuário digital sem digitação.
                </p>
                <ul className="space-y-3">
                  <Bullet>Cadastro automático por foto do RG <Camera className="inline ml-1 text-primary" size={14} /></Bullet>
                  <Bullet>Validação de CPF na Receita Federal</Bullet>
                  <Bullet>Prontuário digital unificado</Bullet>
                  <Bullet>Dashboard de métricas e agenda <BarChart3 className="inline ml-1 text-primary" size={14} /></Bullet>
                </ul>
              </div>
              <SecretariaMockup />
            </div>
          </TabsContent>

          <TabsContent value="medico" className="mt-0">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
              <div>
                <h3 className="font-serif text-3xl md:text-4xl text-foreground mb-4">Ditou, gerou, assinou.</h3>
                <p className="font-body text-muted-foreground mb-8 leading-relaxed">
                  Editor de laudos com IA, biblioteca de modelos prontos e Kanban para você acompanhar tudo.
                </p>
                <ul className="space-y-3">
                  <Bullet>Ditado por voz com Whisper <Mic className="inline ml-1 text-primary" size={14} /></Bullet>
                  <Bullet>Geração de laudo estruturado com IA <Sparkles className="inline ml-1 text-primary" size={14} /></Bullet>
                  <Bullet>Biblioteca de +200 modelos <BookMarked className="inline ml-1 text-primary" size={14} /></Bullet>
                  <Bullet>Kanban de status (pendente, revisão, assinado) <Kanban className="inline ml-1 text-primary" size={14} /></Bullet>
                  <Bullet>Chat IA de apoio clínico <MessageCircle className="inline ml-1 text-primary" size={14} /></Bullet>
                </ul>
              </div>
              <MedicoMockup />
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </section>
  );
};

export default Modules;
