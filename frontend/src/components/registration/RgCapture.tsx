import { useEffect, useRef, useState } from "react";
import { Camera, RotateCcw, X, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface RgCaptureProps {
  onCaptured: (dataUrl: string) => void;
  /** Indica se OCR está em andamento (bloqueia botão "Recapturar"). */
  processing?: boolean;
  /** Foto previamente capturada — entra direto no preview. */
  initialPreview?: string;
}

const RgCapture = ({ onCaptured, processing = false, initialPreview }: RgCaptureProps) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [streamActive, setStreamActive] = useState(false);
  const [preview, setPreview] = useState<string | null>(initialPreview ?? null);
  const [error, setError] = useState<string | null>(null);
  const [starting, setStarting] = useState(false);

  const stopStream = () => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    setStreamActive(false);
  };

  const startStream = async () => {
    setError(null);
    setStarting(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment", width: { ideal: 1280 }, height: { ideal: 800 } },
        audio: false,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      setStreamActive(true);
    } catch (err) {
      console.error(err);
      setError("Não foi possível acessar a câmera. Verifique as permissões do navegador.");
      toast.error("Câmera indisponível.");
    } finally {
      setStarting(false);
    }
  };

  useEffect(() => {
    if (!preview) {
      void startStream();
    }
    return () => stopStream();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const capture = () => {
    const video = videoRef.current;
    if (!video || !streamActive) {
      toast.error("Câmera ainda não está pronta.");
      return;
    }
    const canvas = document.createElement("canvas");
    const w = video.videoWidth || 1280;
    const h = video.videoHeight || 800;
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.drawImage(video, 0, 0, w, h);
    const dataUrl = canvas.toDataURL("image/jpeg", 0.9);
    setPreview(dataUrl);
    stopStream();
    onCaptured(dataUrl);
  };

  const cancel = () => {
    stopStream();
    setError(null);
  };

  const retake = () => {
    setPreview(null);
    void startStream();
  };

  return (
    <div className="bg-white rounded-2xl border border-border/60 shadow-card overflow-hidden">
      <div className="px-6 py-4 border-b border-border/60">
        <h3 className="font-sans font-bold text-foreground">Foto do RG</h3>
        <p className="font-body text-sm text-muted-foreground">
          Posicione o documento dentro da moldura verde para capturar.
        </p>
      </div>

      <div className="relative bg-background-dark aspect-[16/10] overflow-hidden">
        {preview ? (
          <img src={preview} alt="Pré-visualização do RG capturado" className="absolute inset-0 w-full h-full object-cover" />
        ) : (
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className={cn(
              "absolute inset-0 w-full h-full object-cover transition-opacity",
              streamActive ? "opacity-100" : "opacity-0",
            )}
          />
        )}

        {/* Overlay moldura RG (1.6:1) */}
        {!preview && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div
              className="relative border-2 border-accent rounded-lg shadow-[0_0_0_9999px_rgba(15,23,42,0.55)]"
              style={{ width: "78%", aspectRatio: "1.6 / 1" }}
            >
              <span className="absolute -top-7 left-0 font-pill text-xs text-accent bg-background-dark/70 px-2 py-0.5 rounded">
                Área de captura · proporção 1,6:1
              </span>
              {/* cantos */}
              {(["tl", "tr", "bl", "br"] as const).map((c) => (
                <span
                  key={c}
                  className={cn(
                    "absolute h-5 w-5 border-accent",
                    c === "tl" && "top-0 left-0 border-t-4 border-l-4 rounded-tl-lg",
                    c === "tr" && "top-0 right-0 border-t-4 border-r-4 rounded-tr-lg",
                    c === "bl" && "bottom-0 left-0 border-b-4 border-l-4 rounded-bl-lg",
                    c === "br" && "bottom-0 right-0 border-b-4 border-r-4 rounded-br-lg",
                  )}
                />
              ))}
            </div>
          </div>
        )}

        {/* Loading inicial / erro */}
        {!preview && !streamActive && !error && (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-white/80">
            <Loader2 className="h-7 w-7 animate-spin" />
            <p className="font-body text-sm mt-2">{starting ? "Iniciando câmera..." : "Aguardando câmera..."}</p>
          </div>
        )}

        {error && (
          <div className="absolute inset-0 flex items-center justify-center p-6">
            <div className="bg-white/95 rounded-xl p-5 max-w-sm text-center">
              <p className="font-sans font-semibold text-foreground">Câmera indisponível</p>
              <p className="font-body text-sm text-muted-foreground mt-1">{error}</p>
              <button
                type="button"
                onClick={() => void startStream()}
                className="mt-4 inline-flex items-center gap-2 bg-primary text-primary-foreground font-sans font-semibold text-sm px-4 py-2 rounded-lg hover:scale-[1.02] transition"
              >
                <RotateCcw size={14} /> Tentar novamente
              </button>
            </div>
          </div>
        )}

        {processing && (
          <div className="absolute inset-0 bg-background-dark/55 flex flex-col items-center justify-center text-white">
            <Loader2 className="h-8 w-8 animate-spin" />
            <p className="font-sans font-semibold mt-3">Lendo RG...</p>
            <p className="font-body text-sm text-white/70">Extraindo dados do documento.</p>
          </div>
        )}
      </div>

      <div className="px-6 py-4 flex flex-wrap items-center gap-3 border-t border-border/60">
        {preview ? (
          <button
            type="button"
            onClick={retake}
            disabled={processing}
            className="inline-flex items-center gap-2 bg-foreground text-white font-sans font-semibold text-sm px-4 h-10 rounded-lg hover:scale-[1.02] transition disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:scale-100"
          >
            <RotateCcw size={16} /> Recapturar
          </button>
        ) : (
          <>
            <button
              type="button"
              onClick={capture}
              disabled={!streamActive}
              className="inline-flex items-center gap-2 bg-accent text-accent-foreground font-sans font-semibold text-sm px-4 h-10 rounded-lg hover:scale-[1.02] hover:shadow-[0_12px_32px_-8px_hsl(var(--accent)/0.45)] transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:scale-100"
            >
              <Camera size={16} /> Capturar RG
            </button>
            <button
              type="button"
              onClick={cancel}
              className="inline-flex items-center gap-2 bg-destructive text-destructive-foreground font-sans font-semibold text-sm px-4 h-10 rounded-lg hover:scale-[1.02] transition"
            >
              <X size={16} /> Cancelar
            </button>
          </>
        )}
        <p className="ml-auto font-body text-xs text-muted-foreground">
          A imagem é processada localmente; nada é enviado sem sua confirmação.
        </p>
      </div>
    </div>
  );
};

export default RgCapture;
