import { useEffect, useRef, useState } from "react";
import { Mic, Square, Pause, Play, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface RecordingStudioProps {
  onStop: (durationSec: number, audioBlob?: Blob) => Promise<void> | void;
  /** Indica se há processamento em andamento após parar (transcrição+IA). */
  processing?: boolean;
}

const BARS = 32;

const formatTime = (sec: number) => {
  const m = Math.floor(sec / 60).toString().padStart(2, "0");
  const s = Math.floor(sec % 60).toString().padStart(2, "0");
  return `${m}:${s}`;
};

const RecordingStudio = ({ onStop, processing = false }: RecordingStudioProps) => {
  const [recording, setRecording] = useState(false);
  const [paused, setPaused] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const tickRef = useRef<number | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    if (recording && !paused) {
      tickRef.current = window.setInterval(() => setSeconds((s) => s + 1), 1000);
    }
    return () => {
      if (tickRef.current) window.clearInterval(tickRef.current);
      tickRef.current = null;
    };
  }, [recording, paused]);

  const start = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      chunksRef.current = [];
      recorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) chunksRef.current.push(e.data);
      };
      recorder.start();
      streamRef.current = stream;
      mediaRecorderRef.current = recorder;
      setSeconds(0);
      setPaused(false);
      setRecording(true);
    } catch (err) {
      console.error("Falha ao iniciar gravação", err);
      setRecording(false);
      setPaused(false);
    }
  };

  const togglePause = () => {
    const recorder = mediaRecorderRef.current;
    if (!recorder) return;
    if (recorder.state === "recording") recorder.pause();
    else if (recorder.state === "paused") recorder.resume();
    setPaused((p) => !p);
  };

  const stop = async () => {
    const recorder = mediaRecorderRef.current;
    const stream = streamRef.current;
    if (recorder && recorder.state !== "inactive") {
      await new Promise<void>((resolve) => {
        recorder.onstop = () => resolve();
        recorder.stop();
      });
    }
    stream?.getTracks().forEach((t) => t.stop());
    const dur = seconds;
    const mime = recorder?.mimeType || "audio/webm";
    const audioBlob = chunksRef.current.length
      ? new Blob(chunksRef.current, { type: mime })
      : undefined;
    mediaRecorderRef.current = null;
    streamRef.current = null;
    chunksRef.current = [];
    setRecording(false);
    setPaused(false);
    await onStop(dur, audioBlob);
  };

  const isLive = recording && !paused;
  const isIdle = !recording && !processing;

  return (
    <div className="relative bg-white rounded-2xl border border-border/60 shadow-card p-6">
      <div className="flex items-start justify-between gap-4 mb-5">
        <div>
          <h3 className="font-sans font-bold text-foreground">Estúdio de gravação</h3>
          <p className="font-body text-sm text-muted-foreground">
            Dite o laudo. A IA transcreve e estrutura automaticamente.
          </p>
        </div>
        <div className="font-mono text-2xl text-foreground tabular-nums">{formatTime(seconds)}</div>
      </div>

      <div className="flex flex-col items-center gap-5">
        {/* Botão gigante */}
        <button
          type="button"
          onClick={recording ? stop : start}
          disabled={processing}
          aria-label={recording ? "Parar gravação" : "Iniciar gravação"}
          className={cn(
            "relative h-24 w-24 rounded-full inline-flex items-center justify-center text-white font-sans font-semibold transition-all duration-200 shadow-lg disabled:opacity-60 disabled:cursor-not-allowed",
            recording
              ? "bg-red-500 hover:bg-red-600"
              : "bg-primary hover:bg-primary hover:scale-[1.04] hover:shadow-[0_16px_40px_-8px_hsl(var(--primary)/0.65)]",
          )}
        >
          {isLive && (
            <span aria-hidden className="absolute inset-0 rounded-full bg-red-500/40 animate-ping" />
          )}
          {recording ? <Square size={28} fill="currentColor" /> : <Mic size={32} />}
        </button>

        {/* Waveform */}
        <div className="h-16 w-full flex items-center justify-center gap-1">
          {Array.from({ length: BARS }).map((_, i) => (
            <span
              key={i}
              className={cn(
                "block w-1.5 rounded-full transition-colors",
                isLive ? "bg-red-500/80 animate-pulse" : recording ? "bg-yellow-500/60" : "bg-slate-200",
              )}
              style={{
                height: `${
                  isLive
                    ? 12 + Math.abs(Math.sin((Date.now() / 180) + i * 0.6)) * 40 + (i % 5) * 4
                    : 8 + (i % 4) * 3
                }px`,
                animationDelay: `${i * 40}ms`,
              }}
            />
          ))}
        </div>

        {/* Controles secundários */}
        <div className="flex items-center gap-2">
          {recording && (
            <button
              type="button"
              onClick={togglePause}
              className="inline-flex items-center gap-2 bg-white border border-border text-foreground font-sans font-semibold text-sm h-10 px-4 rounded-[8px] hover:bg-surface transition"
            >
              {paused ? <Play size={14} /> : <Pause size={14} />}
              {paused ? "Continuar" : "Pausar"}
            </button>
          )}
          {recording && (
            <button
              type="button"
              onClick={stop}
              className="inline-flex items-center gap-2 bg-foreground text-white font-sans font-semibold text-sm h-10 px-4 rounded-[8px] hover:scale-[1.02] transition"
            >
              <Square size={14} fill="currentColor" /> Parar
            </button>
          )}
          {isIdle && (
            <span className="font-pill text-xs text-muted-foreground">Pronto para gravar — toque no microfone</span>
          )}
        </div>

        {processing && (
          <div className="w-full mt-2 rounded-lg bg-primary/5 border border-primary/15 p-4 flex items-center gap-3">
            <Loader2 size={18} className="text-primary animate-spin" />
            <div>
              <p className="font-sans font-semibold text-foreground text-sm">Processando áudio...</p>
              <p className="font-body text-xs text-muted-foreground">Transcrevendo e estruturando o laudo.</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default RecordingStudio;
