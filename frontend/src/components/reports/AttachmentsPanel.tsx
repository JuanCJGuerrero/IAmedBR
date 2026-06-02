import { useRef, useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Plus, Image as ImageIcon, Music, Trash2, Play, Pause, UploadCloud } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export interface ImageAttachment {
  id: string;
  name: string;
  url: string;
  addedAt: number;
}
export interface AudioAttachment {
  id: string;
  name: string;
  url: string;
  durationSec: number;
  addedAt: number;
}
export interface PdfAttachment {
  id: string;
  name: string;
  url: string;
  addedAt: number;
}

interface AttachmentsPanelProps {
  images: ImageAttachment[];
  audios: AudioAttachment[];
  pdfs: PdfAttachment[];
  onAddImages: (files: File[]) => void;
  onAddAudios: (files: File[]) => void;
  onRemoveImage: (id: string) => void;
  onRemoveAudio: (id: string) => void;
  onRemovePdf: (id: string) => void;
}

const formatDur = (sec: number) => {
  const m = Math.floor(sec / 60).toString().padStart(2, "0");
  const s = Math.floor(sec % 60).toString().padStart(2, "0");
  return `${m}:${s}`;
};

const AttachmentsPanel = ({
  images,
  audios,
  pdfs,
  onAddImages,
  onAddAudios,
  onRemoveImage,
  onRemoveAudio,
  onRemovePdf,
}: AttachmentsPanelProps) => {
  const imgInput = useRef<HTMLInputElement>(null);
  const audioInput = useRef<HTMLInputElement>(null);
  const [tab, setTab] = useState<"images" | "audios" | "pdfs">("images");
  const [lightbox, setLightbox] = useState<ImageAttachment | null>(null);
  const [playingId, setPlayingId] = useState<string | null>(null);
  const audioRefs = useRef<Record<string, HTMLAudioElement | null>>({});
  const [dragOver, setDragOver] = useState(false);

  const handleDrop = (ev: React.DragEvent) => {
    ev.preventDefault();
    setDragOver(false);
    const files = Array.from(ev.dataTransfer.files);
    if (files.length === 0) return;
    const imgs = files.filter((f) => f.type.startsWith("image/"));
    const auds = files.filter((f) => f.type.startsWith("audio/"));
    if (imgs.length) {
      onAddImages(imgs);
      setTab("images");
    }
    if (auds.length) {
      onAddAudios(auds);
      setTab("audios");
    }
    if (!imgs.length && !auds.length) {
      toast.error("Apenas imagens ou áudios são suportados.");
    }
  };

  const togglePlay = (id: string) => {
    const el = audioRefs.current[id];
    if (!el) return;
    Object.entries(audioRefs.current).forEach(([k, ref]) => {
      if (k !== id && ref) ref.pause();
    });
    if (el.paused) {
      void el.play();
      setPlayingId(id);
    } else {
      el.pause();
      setPlayingId(null);
    }
  };

  return (
    <div
      onDragOver={(e) => {
        e.preventDefault();
        setDragOver(true);
      }}
      onDragLeave={() => setDragOver(false)}
      onDrop={handleDrop}
      className={cn(
        "bg-white rounded-2xl border border-border/60 shadow-card overflow-hidden flex flex-col",
        dragOver && "ring-2 ring-primary border-primary",
      )}
    >
      <div className="px-5 pt-4">
        <h3 className="font-sans font-bold text-foreground">Anexos</h3>
        <p className="font-body text-xs text-muted-foreground">Arraste e solte arquivos aqui.</p>
      </div>

      <Tabs value={tab} onValueChange={(v) => setTab(v as "images" | "audios" | "pdfs")} className="px-5 pt-3 flex-1 flex flex-col">
        <TabsList className="bg-surface p-1 rounded-lg">
          <TabsTrigger value="images" className="data-[state=active]:bg-white data-[state=active]:text-primary px-3">
            <ImageIcon size={14} className="mr-1.5" /> Imagens
          </TabsTrigger>
          <TabsTrigger value="audios" className="data-[state=active]:bg-white data-[state=active]:text-primary px-3">
            <Music size={14} className="mr-1.5" /> Áudios
          </TabsTrigger>
          <TabsTrigger value="pdfs" className="data-[state=active]:bg-white data-[state=active]:text-primary px-3">
            <UploadCloud size={14} className="mr-1.5" /> PDFs
          </TabsTrigger>
        </TabsList>

        {/* IMAGENS */}
        <TabsContent value="images" className="flex-1 mt-4">
          <button
            type="button"
            onClick={() => imgInput.current?.click()}
            className="w-full inline-flex items-center justify-center gap-2 h-10 rounded-[8px] border border-dashed border-border bg-surface text-foreground/80 hover:bg-white hover:border-primary hover:text-primary transition font-sans font-semibold text-sm"
          >
            <Plus size={14} /> Adicionar imagem
          </button>
          <input
            ref={imgInput}
            type="file"
            accept="image/*"
            multiple
            hidden
            onChange={(e) => {
              const files = Array.from(e.target.files ?? []);
              if (files.length) onAddImages(files);
              e.target.value = "";
            }}
          />

          {images.length === 0 ? (
            <div className="mt-4 text-center py-8 text-muted-foreground">
              <UploadCloud size={28} className="mx-auto mb-2 opacity-50" />
              <p className="font-body text-sm">Nenhuma imagem anexada.</p>
            </div>
          ) : (
            <div className="mt-4 grid grid-cols-2 gap-2">
              {images.map((img) => (
                <div key={img.id} className="group relative aspect-square rounded-lg overflow-hidden border border-border bg-surface">
                  <button
                    type="button"
                    onClick={() => setLightbox(img)}
                    className="absolute inset-0"
                    aria-label={`Abrir ${img.name}`}
                  >
                    <img src={img.url} alt={img.name} className="h-full w-full object-cover" />
                  </button>
                  <button
                    type="button"
                    onClick={() => onRemoveImage(img.id)}
                    aria-label="Excluir imagem"
                    className="absolute top-1.5 right-1.5 h-7 w-7 inline-flex items-center justify-center rounded-md bg-black/60 text-white opacity-0 group-hover:opacity-100 transition"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </TabsContent>

        {/* AUDIOS */}
        <TabsContent value="audios" className="flex-1 mt-4">
          <button
            type="button"
            onClick={() => audioInput.current?.click()}
            className="w-full inline-flex items-center justify-center gap-2 h-10 rounded-[8px] border border-dashed border-border bg-surface text-foreground/80 hover:bg-white hover:border-primary hover:text-primary transition font-sans font-semibold text-sm"
          >
            <Plus size={14} /> Adicionar áudio
          </button>
          <input
            ref={audioInput}
            type="file"
            accept="audio/*"
            multiple
            hidden
            onChange={(e) => {
              const files = Array.from(e.target.files ?? []);
              if (files.length) onAddAudios(files);
              e.target.value = "";
            }}
          />

          {audios.length === 0 ? (
            <div className="mt-4 text-center py-8 text-muted-foreground">
              <Music size={28} className="mx-auto mb-2 opacity-50" />
              <p className="font-body text-sm">Nenhum áudio anexado.</p>
            </div>
          ) : (
            <ul className="mt-4 space-y-2">
              {audios.map((a) => (
                <li
                  key={a.id}
                  className="flex items-center gap-3 p-2.5 rounded-lg border border-border bg-surface"
                >
                  <button
                    type="button"
                    onClick={() => togglePlay(a.id)}
                    aria-label={playingId === a.id ? "Pausar" : "Reproduzir"}
                    className="h-9 w-9 inline-flex items-center justify-center rounded-full bg-primary text-primary-foreground hover:scale-[1.05] transition"
                  >
                    {playingId === a.id ? <Pause size={14} /> : <Play size={14} />}
                  </button>
                  <div className="flex-1 min-w-0">
                    <p className="font-sans font-medium text-foreground text-sm truncate">{a.name}</p>
                    <p className="font-pill text-[11px] text-muted-foreground">
                      {formatDur(a.durationSec)} · {new Date(a.addedAt).toLocaleDateString("pt-BR")}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => onRemoveAudio(a.id)}
                    aria-label="Excluir áudio"
                    className="h-8 w-8 inline-flex items-center justify-center rounded-md text-destructive hover:bg-destructive/10 transition"
                  >
                    <Trash2 size={14} />
                  </button>
                  <audio
                    ref={(el) => {
                      audioRefs.current[a.id] = el;
                    }}
                    src={a.url}
                    onEnded={() => setPlayingId((p) => (p === a.id ? null : p))}
                  />
                </li>
              ))}
            </ul>
          )}
        </TabsContent>

        {/* PDFS */}
        <TabsContent value="pdfs" className="flex-1 mt-4">
          {pdfs.length === 0 ? (
            <div className="mt-4 text-center py-8 text-muted-foreground">
              <UploadCloud size={28} className="mx-auto mb-2 opacity-50" />
              <p className="font-body text-sm">Nenhum PDF anexado.</p>
            </div>
          ) : (
            <ul className="mt-4 space-y-2">
              {pdfs.map((p) => (
                <li
                  key={p.id}
                  className="flex items-center gap-3 p-2.5 rounded-lg border border-border bg-surface"
                >
                  <button
                    type="button"
                    onClick={() => window.open(p.url, "_blank", "noopener,noreferrer")}
                    className="h-9 w-9 inline-flex items-center justify-center rounded-full bg-primary text-primary-foreground hover:scale-[1.05] transition"
                    aria-label={`Abrir ${p.name}`}
                  >
                    <UploadCloud size={14} />
                  </button>
                  <div className="flex-1 min-w-0">
                    <p className="font-sans font-medium text-foreground text-sm truncate">{p.name}</p>
                    <p className="font-pill text-[11px] text-muted-foreground">
                      {new Date(p.addedAt).toLocaleDateString("pt-BR")}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => onRemovePdf(p.id)}
                    aria-label="Excluir PDF"
                    className="h-8 w-8 inline-flex items-center justify-center rounded-md text-destructive hover:bg-destructive/10 transition"
                  >
                    <Trash2 size={14} />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </TabsContent>
      </Tabs>

      <Dialog open={!!lightbox} onOpenChange={(o) => !o && setLightbox(null)}>
        <DialogContent className="max-w-3xl p-2 bg-background-dark border-white/10">
          {lightbox && (
            <img src={lightbox.url} alt={lightbox.name} className="w-full h-auto rounded-lg" />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AttachmentsPanel;
