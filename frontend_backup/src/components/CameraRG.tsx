import { useRef, useEffect, useState } from "react";
import { toast } from "sonner";

interface CameraRGProps {
  open: boolean;
  onClose: () => void;
  formData: any;
  setFormData: (data: any) => void;
}

export function CameraRG({ open, onClose, formData, setFormData }: CameraRGProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);

  useEffect(() => {
    if (!open) return;

    navigator.mediaDevices
      .getUserMedia({
        video: {
          facingMode: "environment",
          width: { ideal: 1920 },
          height: { ideal: 1080 },
        },
      })
      .then((stream) => {
        setCameraStream(stream);
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      })
      .catch(() => {
        toast.error("Não foi possível acessar a câmera");
        onClose();
      });

    return () => {
      cameraStream?.getTracks().forEach((t) => t.stop());
    };
  }, [open]);

  if (!open) return null;

  const capturePhoto = () => {
    if (!videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // 📐 Proporção REAL do RG
    const rectWidthRatio = 0.65;
    const aspect = 1.6;

    const cropWidth = video.videoWidth * rectWidthRatio;
    const cropHeight = cropWidth / aspect;

    const sx = (video.videoWidth - cropWidth) / 2;
    const sy = (video.videoHeight - cropHeight) / 2;

    // canvas invertido por causa da rotação
    canvas.width = cropHeight;
    canvas.height = cropWidth;

    ctx.save();
    ctx.translate(canvas.width, 0);
    ctx.rotate(Math.PI / 2);

    ctx.drawImage(
      video,
      sx,
      sy,
      cropWidth,
      cropHeight,
      0,
      0,
      cropWidth,
      cropHeight
    );

    ctx.restore();

    const photo = canvas.toDataURL("image/jpeg", 0.85);
    setFormData((prev: any) => ({ ...prev, rgPhoto: photo }));

    cameraStream?.getTracks().forEach((t) => t.stop());
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
      <div className="bg-white p-4 rounded-lg w-full max-w-xl">

        {/* 📸 CÂMERA */}
        <div className="relative w-full aspect-video bg-black overflow-hidden rounded">
          <video
            ref={videoRef}
            autoPlay
            playsInline
            className="w-full h-full object-cover"
          />

          {/* 🔲 ÁREA DO RG (recorte visível) */}
          <div
            className="absolute z-20 border-2 border-green-400 rounded-md"
            style={{
              width: "65%",
              aspectRatio: "1.6",
              top: "50%",
              left: "50%",
              transform: "translate(-50%, -50%)",
              boxShadow: "0 0 12px rgba(74,222,128,0.9)",
            }}
          />

          {/* 🌑 OVERLAY ESCURECIDO */}
          <div className="absolute inset-0 z-10 pointer-events-none">
            {/* topo */}
            <div className="absolute top-0 left-0 w-full h-[17.5%] bg-black/60" />
            {/* baixo */}
            <div className="absolute bottom-0 left-0 w-full h-[17.5%] bg-black/60" />
            {/* esquerda */}
            <div className="absolute top-[17.5%] left-0 w-[17.5%] h-[65%] bg-black/60" />
            {/* direita */}
            <div className="absolute top-[17.5%] right-0 w-[17.5%] h-[65%] bg-black/60" />
          </div>
        </div>

        {/* 🔘 BOTÕES */}
        <div className="flex gap-2 mt-4">
          <button
            onClick={capturePhoto}
            className="flex-1 bg-green-600 text-white py-2 rounded"
          >
            Capturar RG
          </button>
          <button
            onClick={onClose}
            className="flex-1 bg-red-600 text-white py-2 rounded"
          >
            Cancelar
          </button>
        </div>

        <canvas ref={canvasRef} className="hidden" />
      </div>
    </div>
  );
}
