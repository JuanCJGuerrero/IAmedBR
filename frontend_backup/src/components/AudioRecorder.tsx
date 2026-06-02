import { useRef, useState } from "react";
import { toast } from "sonner";
import { transcricaoClient } from "../api/httpClient";

type Props = {
  onTranscription: (text: string) => void;
};

export function AudioRecorder({ onTranscription }: Props) {
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  const [status, setStatus] = useState<"idle" | "recording" | "processing">(
    "idle"
  );

  async function startRecording() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        audioChunksRef.current.push(e.data);
      };

      mediaRecorder.onstop = sendAudio;

      mediaRecorder.start();
      setStatus("recording");
    } catch (err) {
      toast.error("Erro ao acessar microfone");
      console.error(err);
    }
  }

  function stopRecording() {
    mediaRecorderRef.current?.stop();
    setStatus("processing");
  }

  async function sendAudio() {
    const audioBlob = new Blob(audioChunksRef.current, {
      type: "audio/webm",
    });

    const formData = new FormData();
    formData.append("file", audioBlob, "audio.webm");

    try {
      const { data } = await transcricaoClient.post("/transcrever", formData, {
        headers: { "Content-Type": "multipart/form-data" },
        timeout: 120_000,
      });

      onTranscription(data.texto_transcrito);
      setStatus("idle");
    } catch (err) {
      console.error(err);
      toast.error("Erro ao transcrever áudio");
      setStatus("idle");
    }
  }

  return (
    <div className="flex items-center gap-4">
      <button
        onClick={startRecording}
        disabled={status !== "idle"}
        className="px-4 py-2 bg-blue-600 text-white rounded"
      >
        🎙️ Gravar
      </button>

      <button
        onClick={stopRecording}
        disabled={status !== "recording"}
        className="px-4 py-2 bg-red-600 text-white rounded"
      >
        ⏹️ Parar
      </button>

      <span className="text-sm text-gray-600">
        {status === "recording" && "Gravando..."}
        {status === "processing" && "Processando áudio..."}
      </span>
    </div>
  );
}
