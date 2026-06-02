const stats = [
  { v: "85%", l: "menos tempo digitando" },
  { v: "30s", l: "para gerar um laudo completo" },
  { v: "200+", l: "modelos prontos de laudo" },
  { v: "100%", l: "LGPD-compliant" },
];

const Stats = () => {
  return (
    <section id="numeros" className="bg-background-dark py-24 px-6 lg:px-[120px] relative overflow-hidden">
      <div aria-hidden className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,hsl(var(--primary)/0.15),transparent_60%)]" />
      <div className="max-w-7xl mx-auto relative">
        <div className="max-w-2xl mb-14">
          <p className="font-pill text-accent text-sm uppercase tracking-widest mb-3">Números</p>
          <h2 className="font-serif text-white text-4xl md:text-5xl lg:text-6xl leading-[1.05]">
            Resultados que <i className="italic">economizam</i> sua semana.
          </h2>
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-10">
          {stats.map((s) => (
            <div key={s.v} className="text-center lg:text-left">
              <p className="font-serif text-6xl md:text-7xl lg:text-8xl leading-none bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                {s.v}
              </p>
              <p className="font-body text-white/70 text-sm md:text-base mt-3 leading-snug">{s.l}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Stats;
