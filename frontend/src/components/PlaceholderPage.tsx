import type { LucideIcon } from "lucide-react";

interface PlaceholderPageProps {
  title: string;
  description: string;
  icon: LucideIcon;
}

const PlaceholderPage = ({ title, description, icon: Icon }: PlaceholderPageProps) => {
  return (
    <div className="max-w-5xl">
      <div className="flex items-start gap-4 mb-8">
        <div className="bg-primary/10 text-primary p-3 rounded-xl">
          <Icon size={26} />
        </div>
        <div>
          <h1 className="font-serif text-4xl text-foreground leading-tight">{title}</h1>
          <p className="font-body text-muted-foreground mt-1">{description}</p>
        </div>
      </div>

      <div className="rounded-xl border border-dashed border-border bg-white p-10 text-center shadow-card">
        <p className="font-sans font-semibold text-foreground">Em construção</p>
        <p className="font-body text-sm text-muted-foreground mt-1">
          Esta tela será implementada nas próximas etapas.
        </p>
      </div>
    </div>
  );
};

export default PlaceholderPage;
