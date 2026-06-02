import { Download, Save, Upload, Mic, Square, Play, Pause, Trash2, Image as ImageIcon, X, FileText, Plus, Calendar, Clock, ChevronDown, ChevronUp } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';
import { toast } from "sonner";
import jsPDF from 'jspdf';
import { AudioRecorder } from "./AudioRecorder";
import { env } from "../config/env";

// Bases centralizadas — toda chamada de rede usa env.* (configurável via VITE_*).
// Ainda usamos `fetch` aqui por compatibilidade enquanto este componente
// (1939 linhas) não é refatorado em hooks/services. Veja Fase 5 do plano.
const API = env.apiUrl;
const TRANSCR = env.transcricaoUrl;

type Patient = {
  id: number;
  nome: string;
  idade: number;
  prontuario: string;
};

type ReportEditorProps = {
  selectedPatient: Patient | null;
};

type ReportStatus = 'pending' | 'in-progress' | 'completed' | 'reviewed';

type AudioRecording = {
  id: string;
  blob: Blob;
  url: string;
  duration: number;
  timestamp: Date;
};

type Template = {
  id: string;
  name: string;
  category: string;
  content: string;
};



type TipoLaudo = {
  id: number;
  nome: string;
};


type AudioDto = {
  id: number;
  laudo_id: number;
  url: string;
  duracao: number;
  data_upload: string;
};

type AudioPreview = {
  file: File;
  preview: string; // blob
};


type ExameDto = {
  id: number;
  tipo: string;
  url: string;
  data_upload?: string;
};


type ExamePreview = {
  file: File;
  preview: string; // blob
};





export  function ReportEditor({ selectedPatient }: ReportEditorProps) {
  const [reportContent, setReportContent] = useState('');
  const [reportType, setReportType] = useState<string>('');
const [laudoTexto, setLaudoTexto] = useState('');
 
  const [audioRecordings, setAudioRecordings] = useState<AudioRecording[]>([]);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [playingAudioId, setPlayingAudioId] = useState<string | null>(null);
  const [currentReportId, setCurrentReportId] = useState<string | null>(null);
  const [laudoId, setLaudoId] = useState<number | null>(null);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
const [audioPreviews, setAudioPreviews] = useState<AudioPreview[]>([]);
const [audioFiles, setAudioFiles] = useState<File[]>([]);

  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const recordingIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const audioRefs = useRef<Map<string, HTMLAudioElement>>(new Map());
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const statusDropdownRef = useRef<HTMLDivElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [recordedAudioBlob, setRecordedAudioBlob] = useState<Blob | null>(null);
const [recordedAudioDuration, setRecordedAudioDuration] = useState<number>(0);
  
const [categorias, setCategorias] = useState<TipoLaudo[]>([]);
const [laudosList, setLaudosList] = useState<any[]>([]);
const [selectedLaudoFromList, setSelectedLaudoFromList] = useState<number | null>(null);
const [showLaudosDropdown, setShowLaudosDropdown] = useState(false);
const [showConfirmNewReport, setShowConfirmNewReport] = useState(false);
const [selectedTipoLaudoId, setSelectedTipoLaudoId] = useState<number | "">("");


const [patients, setPatients] = useState<Patient[]>([]);
const [patientSearch, setPatientSearch] = useState('');
const [selectedPatientLocal, setSelectedPatientLocal] = useState<Patient | null>(null);
const [showPatientDropdown, setShowPatientDropdown] = useState(false);
  
  const [editHistory, setEditHistory] = useState<string[]>(['']);
  const [historyIndex, setHistoryIndex] = useState(0);
  const [showPreview, setShowPreview] = useState(false);
  const [audioError, setAudioError] = useState<string>('');
  const [reportStatus, setReportStatus] = useState<ReportStatus>('in-progress');
  const [showStatusDropdown, setShowStatusDropdown] = useState(false);
  const [showAudioSection, setShowAudioSection] = useState(false);
  const [showImagesSection, setShowImagesSection] = useState(false);
  const [showTemplatesSection, setShowTemplatesSection] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [transcriptionProgress, setTranscriptionProgress] = useState('');
  const [micPermissionStatus, setMicPermissionStatus] = useState<'unknown' | 'granted' | 'denied' | 'prompt'>('unknown');
  const [showPermissionGuide, setShowPermissionGuide] = useState(false);
const [audios, setAudios] = useState<AudioDto[]>([]);
const [exames, setExames] = useState<ExameDto[]>([]);
const [imageFiles, setImageFiles] = useState<File[]>([]);
const [audioVolume, setAudioVolume] = useState<number>(1);


const [previews, setPreviews] = useState<ExamePreview[]>([]);
const [selectedImage, setSelectedImage] = useState<string | null>(null);
 
const getStatusConfig = (status: ReportStatus | undefined | null) => {
  const configs = {
    pending:     { label: 'Pendente',   color: 'bg-yellow-100 text-yellow-700 border-yellow-300', icon: '⏳' },
    'in-progress': { label: 'Em Andamento', color: 'bg-blue-100 text-blue-700 border-blue-300',   icon: '✏️' },
    completed:   { label: 'Concluído',  color: 'bg-green-100 text-green-700 border-green-300',  icon: '✓' },
    reviewed:    { label: 'Revisado',   color: 'bg-purple-100 text-purple-700 border-purple-300', icon: '✓✓' },
  };

  // Default fallback when status is invalid/missing
  const defaultConfig = {
    label: 'Selecione o status',
    color: 'bg-gray-100 text-gray-700 border-gray-400',
    icon: '?'
  };

  if (!status) return defaultConfig;

  return configs[status] ?? defaultConfig;
};



useEffect(() => {
  if (!laudoId) return;

  const carregarAudios = async () => {
    try {
      const data: AudioDto[] = await fetchAudios(laudoId);
      setAudios(data); // 🔥 FALTAVA ISSO
    } catch (error) {
      console.error("Erro ao carregar áudios", error);
    }
  };

  carregarAudios();
}, [laudoId]);



useEffect(() => {
  if (!laudoId) return;

  const fetchExames = async () => {
    const res = await fetch(`${API}/exames/laudos/${laudoId}/exames`);
    if (!res.ok) return;

    const data: ExameDto[] = await res.json();
    console.log("📦 EXAMES RETORNADOS:", data);
    setExames(data);
  };

  fetchExames().catch(console.error);
  
}, [laudoId]);




  useEffect(() => {
    if (!selectedPatient) return;

    setSelectedPatientLocal({
      id: Number((selectedPatient as any).id),
      nome: (selectedPatient as any).nome ?? (selectedPatient as any).name ?? '',
      idade: (selectedPatient as any).idade ?? (selectedPatient as any).age ?? 0,
      prontuario:
        (selectedPatient as any).prontuario ?? (selectedPatient as any).record ?? '',
    });
  }, [selectedPatient]);
  
  // Load reports list when patient is selected
  useEffect(() => {
    if (!selectedPatientLocal) {
      setLaudosList([]);
      setSelectedLaudoFromList(null);
      return;
    }

    // Resetar dados para evitar exibir laudo anterior ao trocar de paciente
    setLaudoId(null);
    setAudios([]);
    setExames([]);
    setReportContent("");
    setReportStatus("in-progress");
    setCurrentReportId(null);
    setSelectedTipoLaudoId("");
    setSelectedLaudoFromList(null);

    // Buscar todos os laudos do paciente
    fetch(`${API}/laudos/paciente/${selectedPatientLocal.id}/todos`)
      .then(async res => {
        if (!res.ok) {
          // Se não existir endpoint /todos, tentar o antigo
          const oldRes = await fetch(`${API}/laudos/paciente/${selectedPatientLocal.id}`);
          if (!oldRes.ok) return [];
          const singleLaudo = await oldRes.json();
          return singleLaudo ? [singleLaudo] : [];
        }
        return res.json();
      })
      .then(laudos => {
        setLaudosList(laudos || []);
        
        // Se houver laudos, selecionar o mais recente automaticamente
        if (laudos && laudos.length > 0) {
          const maisRecente = laudos[0];
          setSelectedLaudoFromList(maisRecente.id);
          carregarLaudo(maisRecente.id);
        }
      })
      .catch(err => {
        console.error("Erro ao carregar laudos do paciente", err);
        setLaudosList([]);
      });
  }, [selectedPatientLocal]);





 useEffect(() => {
  fetch(`${API}/pacientes`)
    .then(res => {
      if (!res.ok) throw new Error("Erro ao buscar pacientes");
      return res.json();
    })
    .then(data => setPatients(data))
    .catch(err => console.error("Erro ao carregar pacientes", err));
}, []);


 useEffect(() => {
  fetch(`${API}/laudos/tipos`)
    .then(res => res.json())
    .then(data => setCategorias(data))
    .catch(err => console.error("Erro ao buscar categorias", err));
}, []);

const filteredPatients = (patientSearch ? 
  patients.filter(patient =>
    (patient.nome ?? '').toLowerCase().includes(patientSearch.toLowerCase()) ||
    (patient.prontuario ?? '').toLowerCase().includes(patientSearch.toLowerCase())
  ) :
  patients
  .sort((a, b) => (a.nome ?? '').localeCompare(b.nome ?? ''))
  .slice(0, 3)
).slice(0, 3);



useEffect(() => {
  if (!laudoId) return;

  const carregarAudios = async () => {
    try {
      await fetchAudios(laudoId);
    } catch (error) {
      console.error("Erro ao carregar áudios", error);
    }
  };

  carregarAudios();
}, [laudoId]);




//Buscar Audios do Laudo
async function fetchAudios(laudoId: number): Promise<AudioDto[]> {
  try {
    const response = await fetch(
      `${API}/audios/laudos/${laudoId}`
    );

    if (!response.ok) {
      console.warn("Nenhum áudio encontrado");
      return [];
    }

    return await response.json();
  } catch (err) {
    console.error("Erro ao carregar áudios", err);
    return [];
  }
}

// Função para carregar um laudo específico
const carregarLaudo = async (laudoId: number) => {
  try {
    const response = await fetch(`${API}/laudos/${laudoId}`);
    if (!response.ok) {
      throw new Error("Erro ao buscar laudo");
    }

    const laudo = await response.json();
    
    setReportContent(laudo.conteudo ?? "");
    setReportStatus(laudo.status ?? "in-progress");
    setCurrentReportId(laudo.id);
    setLaudoId(laudo.id);
    setSelectedTipoLaudoId(laudo.tipo_laudo_id);
    
    // Buscar tipo de laudo
    const categoria = categorias.find(c => c.id === laudo.tipo_laudo_id);
    setReportType(categoria ? categoria.nome : '');
    
  } catch (err) {
    console.error("Erro ao carregar laudo", err);
  }
};








//Salvar Tudo (Laudo, Audio, Exames)
const handleSalvarTudo = async () => {
  console.log("🚀 Iniciando salvar tudo");

  // 1️⃣ Salvar laudo
  const laudoId = await handleSaveReport();
  if (!laudoId) {
    console.error("❌ Laudo não foi salvo, abortando processo");
    return;
  }
  console.log("🆔 Laudo salvo, ID:", laudoId);

  // 2️⃣ Salvar áudio
  await handleSaveAudio(laudoId);

  // 3️⃣ Salvar exames/imagens
  if (imageFiles.length > 0) {
    await handleSaveExames(laudoId, imageFiles);
    console.log("✅ Imagens salvas com sucesso");
  } else {
    console.log("⚠️ Nenhuma imagem para salvar");
  }

  console.log("✅ Tudo salvo com sucesso!");
};




//Salvar Imagens no banco
const handleSaveExames = async (laudoId: number, files: File[]) => {
  if (!files || files.length === 0) {
    console.warn("⚠️ Nenhum exame para salvar");
    return;
  }

  const formData = new FormData();
  files.forEach(file => formData.append("files", file));
  formData.append("tipo", reportType || "Exame");
  formData.append("descricao", "Imagem do exame");

  try {
    const res = await fetch(`${API}/exames/laudos/${laudoId}/exames`, {
      method: "POST",
      body: formData,
    });

    if (!res.ok) throw new Error("Erro ao salvar exames");

    const novosExames: ExameDto[] = await res.json();
    setExames(prev => [...prev, ...novosExames]);
    
    // 🧹 Limpar previews após salvar
    previews.forEach(p => URL.revokeObjectURL(p.preview));
    setPreviews([]);
    setImageFiles([]);
    
    console.log("✅ Exames salvos com sucesso");
  } catch (err) {
    console.error("❌ Erro ao salvar exames:", err);
    toast.error("Falha ao salvar exames");
  }
};





//Salvar Audio no banco
const handleSaveAudio = async (laudoId: number) => {
  if (!recordedAudioBlob) {
    console.warn("⚠️ Nenhum áudio para salvar");
    return;
  }

  const formData = new FormData();

  // ⚠️ NOME DO CAMPO TEM QUE SER "audio"
  formData.append("audio", recordedAudioBlob, "audio.webm");

  const response = await fetch(
    `${API}/audios/laudos/paciente/${laudoId}/audio?duracao=${recordedAudioDuration}`,
    {
      method: "POST",
      body: formData,
    }
  );

  if (!response.ok) {
    throw new Error("Erro ao salvar áudio");
  }

  console.log("🎧 Áudio salvo com sucesso");
};

//Salvar Laudo no banco
const handleSaveReport = async (): Promise<number | null> => {
  if (!selectedPatientLocal) {
    toast.error("Selecione um paciente");
    return null;
  }

  if (!selectedTipoLaudoId) {
    toast.error("Selecione o tipo de laudo");
    return null;
  }

  const safeContent = (reportContent ?? "").trim();

  if (safeContent.length === 0) {
    toast.error("O conteúdo do laudo está vazio");
    return null;
  }

  const payload = {
    paciente_id: selectedPatientLocal.id,
    tipo_laudo_id: Number(selectedTipoLaudoId),
    status: reportStatus || "in-progress",
    conteudo: safeContent,
  };

  console.log("📤 Enviando payload:", payload);

  try {
    const isUpdate = currentReportId !== null;

    const response = await fetch(
      isUpdate
        ? `${API}/laudos/paciente/${currentReportId}`
        : `${API}/laudos/paciente`,
      {
        method: isUpdate ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      }
    );

    if (!response.ok) {
      const error = await response.json();
      console.error("❌ Erro do backend:", error);
      throw new Error("Erro ao salvar laudo");
    }

    const savedReport = await response.json();

    console.log("📦 Resposta bruta da API:", savedReport);

    // 🔥 normaliza resposta (POST ou PUT)
    const laudo = savedReport.laudo ?? savedReport;

    if (!laudo?.id) {
      throw new Error("ID do laudo não retornado pelo backend");
    }

    // 🟢 atualiza estado
    setCurrentReportId(laudo.id);
    setReportStatus(laudo.status);

    console.log("✅ Laudo salvo com ID:", laudo.id);
    toast.success("Laudo salvo com sucesso");

    return laudo.id; // ✅ ESSENCIAL
  } catch (err) {
    console.error(err);
    toast.error("Erro ao salvar laudo");
    return null; // ✅ garante retorno
  }
};



//Upload Imagens no banco
const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
  const files = e.target.files;
  if (!files) return;

  const novosPreviews: ExamePreview[] = Array.from(files).map(file => ({
    file,
    preview: URL.createObjectURL(file),
  }));

  setPreviews(prev => [...prev, ...novosPreviews]);
  setImageFiles(prev => [...prev, ...Array.from(files)]);
};



{/* EXAMES SALVOS (BACKEND) */}
{exames.map((exame) => (
  <img
    key={exame.id}   // 👈 ESSENCIAL
    src={exame.url}
    alt={exame.tipo}
    className="w-full h-24 object-cover rounded"
  />
))}

{/* previews locais */}
<div className="grid grid-cols-4 gap-2 mt-4">
  {previews.map((p: ExamePreview, i: number) => (
    <img
      key={i}
      src={p.preview}          // ✅ blob
      alt={`Preview ${i}`}
      className="w-full h-24 object-cover rounded opacity-70"
    />
  ))}
</div>

//Remover Imagem da lista de previews
  const removePreview = (index: number) => {
  setPreviews(prev => {
    URL.revokeObjectURL(prev[index].preview);
    return prev.filter((_, i) => i !== index);
  });

  setImageFiles(prev => prev.filter((_, i) => i !== index));
};

// Deletar exame do backend
const removeBackendExame = async (exameId: number) => {
  const confirmDelete = async () => {
    try {
      const response = await fetch(`${API}/exames/${exameId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Erro ao deletar exame');
      }

      setExames(prev => prev.filter(e => e.id !== exameId));
      console.log('✅ Exame deletado com sucesso');
      toast.success('Imagem excluída com sucesso');
    } catch (error) {
      console.error('Erro ao deletar exame:', error);
      toast.error('Falha ao deletar exame');
    }
  };

  toast('Excluir imagem?', {
    description: 'Essa ação não pode ser desfeita.',
    action: {
      label: 'Excluir',
      onClick: confirmDelete,
    },
    cancel: {
      label: 'Cancelar',
      onClick: () => {},
    },
  });
};



  const startRecording = async () => {
    try {
      setAudioError('');
      
      // Verificar se a API está disponível
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        setAudioError('Seu navegador não suporta gravação de áudio. Use Chrome, Firefox ou Edge.');
        setTimeout(() => setAudioError(''), 10000);
        return;
      }
      
      // Detectar se está em iframe (como Figma Make)
      const isInIframe = window.self !== window.top;
      if (isInIframe) {
        setAudioError('⚠️ GRAVAÇÃO EM TEMPO REAL NÃO DISPONÍVEL - O Figma Make roda em iframe e bloqueia acesso ao microfone por segurança. USE O BOTÃO "UPLOAD" ao lado para enviar arquivos de áudio gravados previamente.');
        setTimeout(() => setAudioError(''), 20000);
        return;
      }
      
      // Verificar se está em contexto seguro
      if (window.location.protocol !== 'https:' && window.location.hostname !== 'localhost') {
        setAudioError('Gravação de áudio requer HTTPS. O site precisa estar em uma conexão segura.');
        setTimeout(() => setAudioError(''), 10000);
        return;
      }
      
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          sampleRate: 44100
        } 
      });
      
      streamRef.current = stream;
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };
mediaRecorder.onstop = () => {
  const audioBlob = new Blob(audioChunksRef.current, {
    type: "audio/webm",
  });

  const audioUrl = URL.createObjectURL(audioBlob);

  const newRecording: AudioRecording = {
    id: Date.now().toString(),
    blob: audioBlob,
    url: audioUrl,
    duration: recordingTime,
    timestamp: new Date(),
    
  };

  setAudioRecordings(prev => [...prev, newRecording]);

  // 👇 guarda o último áudio para salvar junto com o laudo
  setRecordedAudioBlob(audioBlob);
  setRecordedAudioDuration(recordingTime);

  setRecordingTime(0);

  if (streamRef.current) {
    streamRef.current.getTracks().forEach(track => track.stop());
    streamRef.current = null;
  }
};

      mediaRecorder.start();
      setIsRecording(true);
      
      recordingIntervalRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);
      
    } catch (error) {
      console.error('Erro ao acessar microfone:', error);
      let errorMessage = '';
      
      // Detectar se está em iframe
      const isInIframe = window.self !== window.top;
      
      if (error instanceof DOMException) {
        if (error.name === 'NotAllowedError') {
          if (isInIframe) {
            errorMessage = '🚫 BLOQUEADO POR IFRAME - O Figma Make não permite gravação direta por rodar em iframe. SOLUÇÃO: Use o botão "UPLOAD" para enviar arquivos de áudio (.mp3, .wav, .m4a, etc) já gravados no seu computador ou celular.';
          } else {
            errorMessage = '🔒 Permissão negada. SOLUÇÃO: Clique no ícone 🔒 ou ℹ️ na barra de endereço do navegador → Permissões → Permitir Microfone. Depois recarregue a página.';
          }
        } else if (error.name === 'NotFoundError') {
          errorMessage = '🎤 Nenhum microfone encontrado. Verifique se há um microfone conectado ao computador.';
        } else if (error.name === 'NotReadableError') {
          errorMessage = '⚠️ Microfone em uso por outro aplicativo. Feche outros programas que possam estar usando o microfone (Zoom, Teams, Discord, etc).';
        } else if (error.name === 'SecurityError') {
          errorMessage = '🔐 Erro de segurança. A gravação de áudio só funciona em páginas HTTPS ou localhost.';
        } else {
          errorMessage = `Erro: ${error.name} - ${error.message}`;
        }
      } else {
        errorMessage = 'Erro desconhecido ao acessar microfone. Use o botão UPLOAD para enviar arquivos de áudio.';
      }
      
      setAudioError(errorMessage);
      setTimeout(() => setAudioError(''), 20000);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      
      if (recordingIntervalRef.current) {
        clearInterval(recordingIntervalRef.current);
      }
    }
  };

  const handleAudioUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
  const files = e.target.files;
  if (!files) return;

  const novosPreviews: AudioPreview[] = Array.from(files).map(file => ({
    file,
    preview: URL.createObjectURL(file),
  }));

  setAudioPreviews(prev => [...prev, ...novosPreviews]);
  setAudioFiles(prev => [...prev, ...Array.from(files)]);
};

  const togglePlayAudio = (id: string, url: string) => {
    if (playingAudioId === id) {
      const audio = audioRefs.current.get(id);
      if (audio) {
        audio.pause();
        setPlayingAudioId(null);
      }
    } else {
      audioRefs.current.forEach(audio => audio.pause());
      
      let audio = audioRefs.current.get(id);
      if (!audio) {
        audio = new Audio(url);
        audio.volume = audioVolume;
        audioRefs.current.set(id, audio);
        audio.onended = () => setPlayingAudioId(null);
      }
      
      audio.volume = audioVolume;
      audio.play();
      setPlayingAudioId(id);
    }
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVolume = parseFloat(e.target.value);
    setAudioVolume(newVolume);
    audioRefs.current.forEach(audio => {
      audio.volume = newVolume;
    });
  };

  const removeAudio = (id: string) => {
    const audio = audioRefs.current.get(id);
    if (audio) {
      audio.pause();
      audioRefs.current.delete(id);
    }
    setAudioRecordings(audioRecordings.filter(a => a.id !== id));
    if (playingAudioId === id) {
      setPlayingAudioId(null);
    }
  };

  // Deletar áudio do backend
  const removeBackendAudio = async (audioId: number) => {
    const confirmDelete = async () => {
      try {
        const response = await fetch(`${API}/audios/${audioId}`, {
          method: 'DELETE',
        });

        if (!response.ok) {
          throw new Error('Erro ao deletar áudio');
        }

        // Remover da lista local
        setAudios(prev => prev.filter(a => a.id !== audioId));

        // Parar reprodução se estiver tocando
        const audioKey = `backend-${audioId}`;
        const audio = audioRefs.current.get(audioKey);
        if (audio) {
          audio.pause();
          audioRefs.current.delete(audioKey);
        }
        if (playingAudioId === audioKey) {
          setPlayingAudioId(null);
        }

        console.log('✅ Áudio deletado com sucesso');
        toast.success('Áudio excluído com sucesso');
      } catch (error) {
        console.error('Erro ao deletar áudio:', error);
        toast.error('Falha ao deletar áudio');
      }
    };

    toast('Excluir áudio?', {
      description: 'Essa ação não pode ser desfeita.',
      action: {
        label: 'Excluir',
        onClick: confirmDelete,
      },
      cancel: {
        label: 'Cancelar',
        onClick: () => {},
      },
    });
  };

  // Transcrever áudio do backend
  const transcribeBackendAudio = async (audioUrl: string, audioId: number) => {
    try {
      setIsTranscribing(true);
      setTranscriptionProgress('Baixando áudio do servidor...');

      // Baixar o áudio do URL
      const audioResponse = await fetch(audioUrl);
      const audioBlob = await audioResponse.blob();

      setTranscriptionProgress('Enviando áudio para análise...');

      const formData = new FormData();
      formData.append(
        'file',
        new File([audioBlob], `audio_${audioId}.webm`, {
          type: audioBlob.type || 'audio/webm',
        })
      );

      const response = await fetch(
        `${TRANSCR}/transcrever-e-gerar-laudo`,
        {
          method: 'POST',
          body: formData,
        }
      );

      if (!response.ok) {
        throw new Error('Erro na API');
      }

      const data = await response.json();
      const laudo = data.laudo;

      if (!laudo) {
        throw new Error('Laudo não retornado pela IA');
      }

      setTranscriptionProgress('Gerando laudo médico...');

      const textoLaudo = `
HIPÓTESE DIAGNÓSTICA:
${laudo.diagnostico_hipotese}

EXAMES SUGERIDOS:
- ${laudo.exames_sugeridos?.join('\n- ')}

RECOMENDAÇÕES:
${laudo.recomendacoes}

CID SUGERIDO: ${laudo.cid_sugerido}
`.trim();

      setReportContent(prev =>
        prev ? `${prev}\n\n${textoLaudo}` : textoLaudo
      );

      setIsTranscribing(false);
      setTranscriptionProgress('');
      console.log('LAUDO INSERIDO COM SUCESSO');
    } catch (error) {
      console.error('Erro ao gerar laudo:', error);
      setIsTranscribing(false);
      setTranscriptionProgress('');
      setAudioError(
        '❌ Erro ao gerar o laudo a partir do áudio. Verifique as APIs.'
      );
      setTimeout(() => setAudioError(''), 10000);
    }
  };

//Slavar Audio no banco
const uploadAudioToBackend = async (audioBlob: Blob) => {
  if (!laudoId) {
    toast.error("Salve o laudo antes de enviar o áudio");
    return;
  }

  const formData = new FormData();
  formData.append("file", audioBlob, "gravacao.webm");

  const response = await fetch(
    `${API}/laudos/${laudoId}/audio`,
    {
      method: "POST",
      body: formData,
    }
  );

  if (!response.ok) {
    throw new Error("Erro ao salvar áudio");
  }
};



  // Função para transcrever áudio usando a API FastAPI   
      // 2. Solicitar transcrição
      
    const transcribeAudio = async (audioBlob: Blob, recordingId: string) => {
  toast.info("Transcrevendo e gerando laudo...");

  try {
    console.log("CHEGOU ATÉ AQUI");

    setIsTranscribing(true);
    setTranscriptionProgress("Enviando áudio para análise...");

    const formData = new FormData();
    formData.append(
      "file",
      new File([audioBlob], `audio_${recordingId}.webm`, {
        type: audioBlob.type || "audio/webm",
      })
    );

    const response = await fetch(
      `${TRANSCR}/transcrever-e-gerar-laudo`,
      {
        method: "POST",
        body: formData,
      }
    );

    if (!response.ok) {
      throw new Error("Erro na API");
    }

    const data = await response.json();
    console.log("RESPOSTA API:", data);

    const laudo = data.laudo;

    if (!laudo) {
      throw new Error("Laudo não retornado pela IA");
    }

    setTranscriptionProgress("Gerando laudo médico...");

    const textoLaudo = `
HIPÓTESE DIAGNÓSTICA:
${laudo.diagnostico_hipotese}

EXAMES SUGERIDOS:
- ${laudo.exames_sugeridos?.join("\n- ")}

RECOMENDAÇÕES:
${laudo.recomendacoes}

CID SUGERIDO: ${laudo.cid_sugerido}
`.trim();

    setReportContent(prev =>
      prev ? `${prev}\n\n${textoLaudo}` : textoLaudo
    );

    setIsTranscribing(false);
    setTranscriptionProgress("");
    console.log("LAUDO INSERIDO COM SUCESSO");

  } catch (error) {
    console.error("Erro ao gerar laudo:", error);

    setIsTranscribing(false);
    setTranscriptionProgress("");

    setAudioError(
      "❌ Erro ao gerar o laudo a partir do áudio. Verifique as APIs."
    );

    setTimeout(() => setAudioError(""), 10000);
  }
};




  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Função para limpar todos os campos do laudo
  const limparCamposLaudo = () => {
    console.log('🧹 Limpando campos do laudo...');
    
    previews.forEach(p => URL.revokeObjectURL(p.preview));
    audioPreviews.forEach(p => URL.revokeObjectURL(p.preview));

    setReportContent('');
    setReportType('');
    setSelectedTipoLaudoId('');
    setPreviews([]);
    setImageFiles([]);
    setExames([]);
    setAudioPreviews([]);
    setAudioFiles([]);
    setAudioRecordings([]);
    setAudios([]);
    setRecordedAudioBlob(null);
    setRecordedAudioDuration(0);
    setLaudoId(null);
    setCurrentReportId(null);
    setSelectedLaudoFromList(null);
    setEditHistory(['']);
    setHistoryIndex(0);
    setReportStatus('in-progress');
    setIsRecording(false);
    setRecordingTime(0);

    audioRefs.current.forEach(audio => audio.pause());
    audioRefs.current.clear();
    setPlayingAudioId(null);
    
    console.log('✅ Campos limpos com sucesso');
    toast.success('Novo laudo iniciado');
  };

  const handleCreateNewReport = () => {
    console.log('🔵 handleCreateNewReport chamado');

    // Verificar se há conteúdo não salvo
    const temConteudo = !!(
      reportContent ||
      reportType ||
      previews.length > 0 ||
      audioPreviews.length > 0 ||
      audioRecordings.length > 0 ||
      audios.length > 0 ||
      exames.length > 0
    );

    console.log('Tem conteúdo não salvo?', temConteudo);

    if (temConteudo) {
      console.log('⚠️ Tem conteúdo, mostrando modal de confirmação...');
      setShowConfirmNewReport(true);
    } else {
      console.log('✅ Sem conteúdo, limpando direto');
      limparCamposLaudo();
    }
  };

  const confirmarNovoLaudo = () => {
    console.log('✅ Usuário confirmou criar novo laudo');
    setShowConfirmNewReport(false);
    limparCamposLaudo();
  };

  const cancelarNovoLaudo = () => {
    console.log('❌ Usuário cancelou criar novo laudo');
    setShowConfirmNewReport(false);
  };

  const handleContentChange = (newContent: string) => {
    setReportContent(newContent);
    
    const newHistory = editHistory.slice(0, historyIndex + 1);
    newHistory.push(newContent);
    setEditHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
  };

  const insertTextAtCursor = (text: string) => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const newContent = reportContent.substring(0, start) + text + reportContent.substring(end);
    
    handleContentChange(newContent);
    
    setTimeout(() => {
      textarea.selectionStart = textarea.selectionEnd = start + text.length;
      textarea.focus();
    }, 0);
  };

 const safeContent = reportContent ?? '';  // ou (reportContent || '')

const wordCount = safeContent.trim().split(/\s+/).filter(word => word.length > 0).length;
const charCount = safeContent.length;

  const handleExportPDF = () => {
  const printWindow = window.open('', '_blank');

  if (!printWindow || !selectedPatientLocal) return;

  // imagens vindas do backend (exames já salvos)
  const examesHTML = exames.length > 0
    ? exames
        .map(
          (exame) =>
            `<img src="${exame.url}" alt="Imagem do exame" />`
        )
        .join('')
    : '';

  // imagens selecionadas localmente (preview)
  const previewsHTML = previews.length > 0
    ? previews
        .map(
          (p) =>
            `<img src="${p.preview}" alt="Imagem do exame" />`
        )
        .join('')
    : '';

  const content = `
    <!DOCTYPE html>
    <html>
      <head>
        <title>Laudo Médico - ${selectedPatientLocal.nome}</title>
        <style>
          body { font-family: Arial, sans-serif; padding: 40px; }
          .header { border-bottom: 2px solid #2563eb; padding-bottom: 20px; margin-bottom: 30px; }
          .header h1 { color: #2563eb; margin: 0; }
          .patient-info { background: #f3f4f6; padding: 20px; border-radius: 8px; margin-bottom: 30px; }
          .patient-info p { margin: 5px 0; }
          .report-content { line-height: 1.6; white-space: pre-wrap; }
          .images { display: grid; grid-template-columns: repeat(2, 1fr); gap: 20px; margin-top: 30px; }
          .images img { width: 100%; border-radius: 8px; }
          .footer { margin-top: 40px; padding-top: 20px; border-top: 1px solid #e5e7eb; text-align: center; color: #6b7280; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>LAUDO MÉDICO</h1>
          <p>MediPlataforma - Sistema de Gestão Médica</p>
        </div>

        <div class="patient-info">
          <h2>Dados do Paciente</h2>
          <p><strong>Nome:</strong> ${selectedPatientLocal.nome}</p>
          <p><strong>Idade:</strong> ${selectedPatientLocal.idade} anos</p>
          <p><strong>Tipo de Exame:</strong> ${reportType || 'Não especificado'}</p>
          <p><strong>Data:</strong> ${new Date().toLocaleDateString('pt-BR')}</p>
        </div>

        <div>
          <h2>Laudo</h2>
          <div class="report-content">
            ${reportContent || 'Nenhum conteúdo adicionado.'}
          </div>
        </div>

        ${(examesHTML || previewsHTML) ? `
          <div>
            <h2>Imagens do Exame</h2>
            <div class="images">
              ${examesHTML}
              ${previewsHTML}
            </div>
          </div>
        ` : ''}

        <div class="footer">
          <p>Dr. João Silva - CRM XXXXX/XX</p>
          <p>Radiologista</p>
          <p>
            Data de emissão:
            ${new Date().toLocaleDateString('pt-BR')}
            às
            ${new Date().toLocaleTimeString('pt-BR')}
          </p>
        </div>
      </body>
    </html>
  `;

  printWindow.document.write(content);
  printWindow.document.close();

  setTimeout(() => {
    printWindow.print();
  }, 500);
};

 

  

  const handleStatusChange = (newStatus: ReportStatus) => {
    setReportStatus(newStatus);
    setShowStatusDropdown(false);
  };
  
  const templates: Template[] = [
    { id: '1', name: 'Modelo de Raio-X', category: 'Raio-X', content: 'Este é um modelo de laudo para exames de Raio-X. Inclua detalhes específicos do exame aqui.' },
    { id: '2', name: 'Modelo de Tomografia', category: 'Tomografia', content: 'Este é um modelo de laudo para exames de Tomografia Computadorizada. Inclua detalhes específicos do exame aqui.' },
    { id: '3', name: 'Modelo de Ressonância', category: 'Ressonância', content: 'Este é um modelo de laudo para exames de Ressonância Magnética. Inclua detalhes específicos do exame aqui.' },
  ];
  
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (statusDropdownRef.current && !statusDropdownRef.current.contains(event.target as Node)) {
        setShowStatusDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between mb-6 pb-4 border-b border-gray-200">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Editor de Laudos</h2>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={handleCreateNewReport}
            className="flex items-center gap-2 px-4 py-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
            title={selectedPatientLocal ? 'Criar novo laudo para este paciente' : 'Criar novo laudo'}
          >
            <Plus size={18} />
            {selectedPatientLocal ? 'Novo Laudo' : 'Novo'}
          </button>
         <button
  onClick={async () => {
    await handleSalvarTudo();
  }}
  className="flex items-center gap-2 px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
>
  <Save size={18} />
  Salvar
</button>


          <button 
            onClick={handleExportPDF}
            disabled={!selectedPatientLocal}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
          >
            <Download size={18} />
            Exportar
          </button>
        </div>
      </div>

      <div className="flex-1 flex gap-6 overflow-hidden">
        {/* Main Content */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Patient & Exam Info Bar */}
          <div className="flex items-center gap-4 mb-4 p-4 bg-gray-50 rounded-lg">
            {/* Patient */}
            <div className="flex-1 min-w-0">
              {selectedPatientLocal ? (
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white text-xs font-bold">
                      {(selectedPatientLocal.nome ?? '')
                        .split(' ')
                        .map(n => n[0])
                        .join('')
                        .substring(0, 2)}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-800">{selectedPatientLocal.nome}</p>
                      <p className="text-xs text-gray-500">{selectedPatientLocal.idade} anos</p>
                    </div>
                  </div>
                  <button 
                    onClick={() => setSelectedPatientLocal(null)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <X size={16} />
                  </button>
                </div>
              ) : (
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Selecionar paciente..."
                    value={patientSearch}
                    onChange={(e) => setPatientSearch(e.target.value)}
                    onFocus={() => setShowPatientDropdown(true)}
                    onBlur={() => setTimeout(() => setShowPatientDropdown(false), 200)}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  {showPatientDropdown && (
                    <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-10 max-h-48 overflow-y-auto">
                     {filteredPatients.map(patient => (
  <button
    key={patient.id}
    onClick={() => {
      setSelectedPatientLocal(patient);
      setPatientSearch('');
    }}
    className="w-full flex items-center gap-2 p-2 hover:bg-gray-50 transition-colors text-left"
  >
    <div className="w-6 h-6 bg-gray-200 rounded-full flex items-center justify-center text-gray-600 text-xs font-bold">
      {(patient.nome ?? '')
        .split(' ')
        .map(n => n[0])
        .join('')
        .substring(0, 2)}
    </div>
    <div>
      <p className="text-xs font-medium text-gray-800">{patient.nome}</p>
      <p className="text-xs text-gray-500">{patient.idade} anos</p>
    </div>
  </button>
))}

                      
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Laudos List */}
            {selectedPatientLocal && laudosList.length > 0 && (
              <div className="flex-1 min-w-0 relative">
                <button
                  onClick={() => setShowLaudosDropdown(!showLaudosDropdown)}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg bg-white hover:bg-gray-50 transition-colors flex items-center justify-between"
                >
                  <span className="truncate">
                    {selectedLaudoFromList ? (
                      <span className="flex items-center gap-2">
                        <span className="text-blue-600">📋</span>
                        <span>
                          {laudosList.find(l => l.id === selectedLaudoFromList)?.tipo_laudo_nome || 'Laudo'}
                          {' - '}
                          {new Date(laudosList.find(l => l.id === selectedLaudoFromList)?.data_criacao || '').toLocaleDateString('pt-BR')}
                        </span>
                      </span>
                    ) : (
                      'Selecionar laudo...'
                    )}
                  </span>
                  <span className="ml-2 text-gray-400">▾</span>
                </button>
                
                {showLaudosDropdown && (
                  <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-20 max-h-60 overflow-y-auto">
                    {laudosList.map(laudo => (
                      <button
                        key={laudo.id}
                        onClick={() => {
                          setSelectedLaudoFromList(laudo.id);
                          carregarLaudo(laudo.id);
                          setShowLaudosDropdown(false);
                        }}
                        className={`w-full text-left px-3 py-2 hover:bg-blue-50 transition-colors border-b border-gray-100 last:border-b-0 ${
                          selectedLaudoFromList === laudo.id ? 'bg-blue-50' : ''
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-800 truncate">
                              {laudo.tipo_laudo_nome || 'Laudo'}
                            </p>
                            <p className="text-xs text-gray-500">
                              {new Date(laudo.data_criacao).toLocaleDateString('pt-BR')} às {new Date(laudo.data_criacao).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                            </p>
                          </div>
                          <div className="ml-2">
                            <span className={`px-2 py-1 rounded text-xs ${
                              getStatusConfig(laudo.status).color
                            }`}>
                              {getStatusConfig(laudo.status).icon}
                            </span>
                          </div>
                        </div>
                      </button>
                    ))}
                    <button
                      onClick={() => {
                        handleCreateNewReport();
                        setShowLaudosDropdown(false);
                      }}
                      className="w-full text-left px-3 py-2 bg-green-50 hover:bg-green-100 transition-colors text-green-700 font-medium text-sm flex items-center gap-2 sticky bottom-0"
                    >
                      <Plus size={14} />
                      Criar novo laudo
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Exam Type */}
            <div className="flex-1 min-w-0">
  <select
    value={selectedTipoLaudoId}
    onChange={(e) => {
  const id = Number(e.target.value);
  setSelectedTipoLaudoId(id);

  const categoria = categorias.find(c => c.id === id);
  setReportType(categoria ? categoria.nome : '');
}}
    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
  >
    <option value="">Tipo de exame...</option>

    {categorias.map((tipo) => (
      <option key={tipo.id} value={tipo.id}>
        {tipo.nome}
      </option>
    ))}
  </select>
</div>

            {/* Status */}
            <div className="relative" ref={statusDropdownRef}>
              <button
                onClick={() => setShowStatusDropdown(!showStatusDropdown)}
                className={`px-3 py-2 rounded-lg border text-sm font-medium flex items-center gap-2 ${getStatusConfig(reportStatus).color}`}
              >
                <span>{getStatusConfig(reportStatus).icon}</span>
                <span>{getStatusConfig(reportStatus).label}</span>
                <span className="ml-1">▾</span>
              </button>
              
              {showStatusDropdown && (
                <div className="absolute right-0 top-full mt-1 z-20 bg-white border border-gray-200 rounded-lg shadow-lg py-1 min-w-[160px]">
                  <button
                    onClick={() => handleStatusChange('pending')}
                    className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-yellow-50 transition-colors flex items-center gap-2"
                  >
                    <span>⏳</span> Pendente
                  </button>
                  <button
                    onClick={() => handleStatusChange('in-progress')}
                    className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-blue-50 transition-colors flex items-center gap-2"
                  >
                    <span>✏️</span> Em Andamento
                  </button>
                  <button
                    onClick={() => handleStatusChange('completed')}
                    className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-green-50 transition-colors flex items-center gap-2"
                  >
                    <span>✓</span> Concluído
                  </button>
                  <button
                    onClick={() => handleStatusChange('reviewed')}
                    className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-purple-50 transition-colors flex items-center gap-2"
                  >
                    <span>✓✓</span> Revisado
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Editor */}
          <div className="flex-1 flex flex-col bg-white rounded-lg border border-gray-200 overflow-hidden">
            {/* Toolbar */}
            <div className="flex items-center justify-between px-4 py-2 border-b border-gray-200 bg-gray-50">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => insertTextAtCursor(new Date().toLocaleDateString('pt-BR'))}
                  className="px-3 py-1 text-xs text-gray-600 hover:bg-gray-200 rounded transition-colors flex items-center gap-1"
                  title="Inserir data atual"
                >
                  <Calendar size={14} />
                  Data
                </button>
                <button
                  onClick={() => insertTextAtCursor(new Date().toLocaleTimeString('pt-BR'))}
                  className="px-3 py-1 text-xs text-gray-600 hover:bg-gray-200 rounded transition-colors flex items-center gap-1"
                  title="Inserir hora atual"
                >
                  <Clock size={14} />
                  Hora
                </button>
              </div>
              
              <div className="flex items-center gap-3 text-xs text-gray-500">
                <span>{wordCount} palavras</span>
                <span>•</span>
                <span>{charCount} caracteres</span>
              </div>
            </div>

            {/* Text Area */}
           <textarea
          ref={textareaRef}
          value={reportContent}
          onChange={(e) => handleContentChange(e.target.value)}  // ← corrigido!
          className="report-textarea flex-1 p-4 resize-none focus:outline-none"
          placeholder="Digite o laudo aqui..."
        />
      </div>
        </div>

        {/* Sidebar */}
        <div className="w-80 flex flex-col gap-3 overflow-y-auto">
          {/* Templates */}
          <div className="bg-white rounded-lg border border-gray-200">
            <button
              onClick={() => setShowTemplatesSection(!showTemplatesSection)}
              className="w-full flex items-center justify-between p-3 hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-center gap-2">
                <FileText size={18} className="text-gray-600" />
                <span className="font-medium text-gray-800">Modelos</span>
              </div>
              {showTemplatesSection ? <ChevronUp size={18} className="text-gray-400" /> : <ChevronDown size={18} className="text-gray-400" />}
            </button>
            
            {showTemplatesSection && (
              <div className="border-t border-gray-200 p-3 space-y-2">
                {templates.map((template) => (
                  <button
                    key={template.id}
                    onClick={() => {
                      setReportContent(template.content);
                      setReportType(template.category);
                    }}
                    className="w-full text-left p-2 hover:bg-blue-50 rounded transition-colors"
                  >
                    <p className="text-sm font-medium text-gray-800">{template.name}</p>
                    <p className="text-xs text-gray-500">{template.category}</p>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Audio */}
          <div className="bg-white rounded-lg border border-gray-200">
            <button
              onClick={() => setShowAudioSection(!showAudioSection)}
              className="w-full flex items-center justify-between p-3 hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-center gap-2">
                <Mic size={18} className="text-gray-600" />
                <span className="font-medium text-gray-800">Áudio</span>
                {audioRecordings.length > 0 && (
                  <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs rounded-full">{audioRecordings.length}</span>
                )}
              </div>
              {showAudioSection ? <ChevronUp size={18} className="text-gray-400" /> : <ChevronDown size={18} className="text-gray-400" />}
            </button>
            
            {showAudioSection && (
              <div className="border-t border-gray-200 p-3">
                {/* Error Message */}
                {audioError && (
                  <div className="mb-3 p-2 bg-red-50 border border-red-200 rounded text-xs text-red-700 flex items-start gap-2">
                    <span className="flex-shrink-0 mt-0.5">⚠️</span>
                    <div className="flex-1">
                      <p>{audioError}</p>
                    </div>
                    <button onClick={() => setAudioError('')} className="flex-shrink-0 text-red-500 hover:text-red-700">
                      <X size={14} />
                    </button>
                  </div>
                )}

                {/* Controls */}
                <div className="flex gap-2 mb-3">
                  {!isRecording ? (
                    <button 
                      onClick={startRecording}
                      className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm"
                    >
                      <Mic size={16} />
                      Gravar
                    </button>
                  ) : (
                    <button 
                      onClick={stopRecording}
                      className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-900 transition-colors text-sm animate-pulse"
                    >
                      <Square size={16} />
                      {formatTime(recordingTime)}
                    </button>
                  )}
                  <label className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors cursor-pointer text-sm">
                    <Upload size={16} />
                    Upload
                    <input
                      type="file"
                      multiple
                      accept="audio/*"
                      onChange={handleAudioUpload}
                      className="hidden"
                    />
                  </label>
                </div>

                
{/* 🔵 ÁUDIOS SALVOS NO BACKEND */}
{audios.length > 0 && (
  <div className="space-y-2 mb-3">
    <p className="text-xs text-gray-500 mb-1">Áudios salvos:</p>
    {audios.map(audio => {
      const audioKey = `backend-${audio.id}`;
      return (
        <div
          key={`audio-backend-${audio.id}`}
          className="flex items-center gap-2 p-2 bg-blue-50 rounded border border-blue-200"
        >
          <button
            onClick={() => togglePlayAudio(audioKey, audio.url)}
            className="flex-shrink-0 p-1 text-blue-600 hover:bg-blue-100 rounded transition-colors"
          >
            {playingAudioId === audioKey ? <Pause size={14} /> : <Play size={14} />}
          </button>
          
          <div className="flex-1 flex flex-col text-xs">
            <span className="text-gray-700 font-medium">
              {formatTime(audio.duracao)}
            </span>
            <span className="text-gray-400 text-[10px]">
              {new Date(audio.data_upload).toLocaleDateString('pt-BR', {
                day: '2-digit',
                month: '2-digit',
                year: '2-digit'
              })}
            </span>
          </div>
          
          <div className="flex flex-col items-center gap-0.5">
            <span className="text-[9px] text-gray-500 font-medium">{Math.round(audioVolume * 100)}%</span>
            <input
              type="range"
              min="0"
              max="1"
              step="0.01"
              value={audioVolume}
              onChange={handleVolumeChange}
              className="w-16 h-0.5 bg-gray-200 rounded-lg appearance-none cursor-pointer slider-thumb"
              style={{
                background: `linear-gradient(to right, #3b82f6 0%, #3b82f6 ${audioVolume * 100}%, #e5e7eb ${audioVolume * 100}%, #e5e7eb 100%)`
              }}
              title="Ajustar volume"
            />
          </div>
          
          <button
            onClick={() => transcribeBackendAudio(audio.url, audio.id)}
            className="flex-shrink-0 p-1 text-green-600 hover:bg-green-50 rounded transition-colors"
            disabled={isTranscribing}
            title="Gerar laudo com IA"
          >
            {isTranscribing ? (
              <span className="text-xs">Processando...</span>
            ) : (
              <Mic size={14} />
            )}
          </button>
          
          <button
            onClick={() => removeBackendAudio(audio.id)}
            className="flex-shrink-0 p-1 text-red-600 hover:bg-red-50 rounded transition-colors"
            title="Excluir áudio"
          >
            <Trash2 size={14} />
          </button>
        </div>
      );
    })}
  </div>
)}

{/* 🟡 PREVIEW LOCAL DE ÁUDIO */}
{audioPreviews.length > 0 && (
  <div className="space-y-2 mb-3">
    {audioPreviews.map((p, index) => (
      <audio
        key={`audio-preview-${index}`}
        src={p.preview}
        controls
        className="w-full opacity-70"
      />
    ))}
  </div>
)}

{/* Recordings List (gravações em memória) */}
{audioRecordings.length > 0 && (
  <div className="space-y-2">
    {audioRecordings.map((recording) => (
      <div
        key={recording.id}
        className="flex items-center gap-2 p-2 bg-gray-50 rounded"
      >
        <button
          onClick={() => togglePlayAudio(recording.id, recording.url)}
          className="flex-shrink-0 p-1 text-blue-600 hover:bg-blue-50 rounded transition-colors"
        >
          {playingAudioId === recording.id ? <Pause size={14} /> : <Play size={14} />}
        </button>
        
        <div className="flex-1 text-xs text-gray-600">
          {formatTime(recording.duration)}
        </div>
        
        <div className="flex flex-col items-center gap-0.5">
          <span className="text-[9px] text-gray-500 font-medium">{Math.round(audioVolume * 100)}%</span>
          <input
            type="range"
            min="0"
            max="1"
            step="0.01"
            value={audioVolume}
            onChange={handleVolumeChange}
            className="w-16 h-0.5 bg-gray-200 rounded-lg appearance-none cursor-pointer slider-thumb"
            style={{
              background: `linear-gradient(to right, #3b82f6 0%, #3b82f6 ${audioVolume * 100}%, #e5e7eb ${audioVolume * 100}%, #e5e7eb 100%)`
            }}
            title="Ajustar volume"
          />
        </div>
        
        <button
          onClick={() => transcribeAudio(recording.blob, recording.id)}
          className="flex-shrink-0 p-1 text-green-600 hover:bg-green-50 rounded transition-colors"
          disabled={isTranscribing}
          title="Gerar laudo com IA"
        >
          {isTranscribing ? (
            <span className="text-xs">Transcrevendo...</span>
          ) : (
            <Mic size={14} />
          )}
        </button>
        
        <button
          onClick={() => removeAudio(recording.id)}
          className="flex-shrink-0 p-1 text-red-600 hover:bg-red-50 rounded transition-colors"
        >
          <Trash2 size={14} />
        </button>
      </div>
    ))}
  </div>
)}
              </div>
            )}
          </div>

          {/* Images */}
          <div className="bg-white rounded-lg border border-gray-200">
  <button
    onClick={() => setShowImagesSection(!showImagesSection)}
    className="w-full flex items-center justify-between p-3 hover:bg-gray-50 transition-colors"
  >
    <div className="flex items-center gap-2">
      <ImageIcon size={18} className="text-gray-600" />
      <span className="font-medium text-gray-800">Imagens</span>
      {(previews.length + exames.length) > 0 && (
        <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs rounded-full">
          {previews.length + exames.length}
        </span>
      )}
    </div>
    {showImagesSection ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
  </button>

  {showImagesSection && (
    <div className="border-t border-gray-200 p-3">
      <label className="flex items-center justify-center gap-2 px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 cursor-pointer text-sm mb-3">
        <Upload size={16} />
        Upload
        <input
          type="file"
          multiple
          accept="image/*"
          onChange={handleImageUpload}
          className="hidden"
        />
      </label>

      <div className="grid grid-cols-3 gap-2 max-h-80 overflow-y-auto">
        {/* 🔵 IMAGENS DO BACKEND */}
        {exames.map(exame => (
          <div key={`exame-${exame.id}`} className="relative group bg-gray-100 rounded p-1">
            <img
              src={exame.url}
              alt={exame.tipo}
              onClick={() => setSelectedImage(exame.url)}
              className="w-full h-32 object-contain rounded cursor-pointer hover:opacity-90 transition-opacity"
            />
            <button
              onClick={(e) => {
                e.stopPropagation();
                removeBackendExame(exame.id);
              }}
              className="absolute top-2 right-2 p-1 bg-red-600 text-white rounded opacity-0 group-hover:opacity-100 transition-opacity shadow-lg"
              title="Excluir imagem"
            >
              <X size={14} />
            </button>
          </div>
        ))}

        {/* 🟡 PREVIEW LOCAL */}
        {previews.map((p, index) => (
          <div key={`preview-${index}`} className="relative group bg-gray-100 rounded p-1">
            <img
              src={p.preview}
              alt={`Preview ${index + 1}`}
              onClick={() => setSelectedImage(p.preview)}
              className="w-full h-32 object-contain rounded opacity-80 cursor-pointer hover:opacity-70 transition-opacity"
            />
            <button
              onClick={(e) => {
                e.stopPropagation();
                removePreview(index);
              }}
              className="absolute top-2 right-2 p-1 bg-red-600 text-white rounded opacity-0 group-hover:opacity-100 transition-opacity shadow-lg"
            >
              <X size={14} />
            </button>
          </div>
        ))}
      </div>

      {previews.length === 0 && exames.length === 0 && (
        <p className="text-xs text-gray-400 text-center py-4">
          Nenhuma imagem
        </p>
      )}
    </div>
  )}

          </div>
        </div>
      </div>

      {/* Modal de visualização de imagem */}
      {selectedImage && (
        <div
          className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50 p-8"
          onClick={() => setSelectedImage(null)}
        >
          <div className="relative w-auto h-auto bg-white rounded-lg shadow-2xl p-4">
            <button
              onClick={() => setSelectedImage(null)}
              className="absolute -top-12 right-0 text-white hover:text-gray-300 transition-colors bg-gray-800 rounded-full p-2"
              title="Fechar"
            >
              <X size={24} />
            </button>
            <img
              src={selectedImage}
              alt="Visualização ampliada"
                className="max-w-md max-h-100 object-contain mx-auto rounded"
              onClick={(e) => e.stopPropagation()}
            />
          </div>
        </div>
      )}

      {/* Modal de confirmação para novo laudo */}
      {showConfirmNewReport && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
          onClick={cancelarNovoLaudo}
        >
          <div 
            className="bg-white rounded-lg shadow-2xl p-6 max-w-md w-full mx-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start gap-4 mb-4">
              <div className="flex-shrink-0 w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center">
                <span className="text-2xl">⚠️</span>
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  {selectedPatientLocal ? 'Criar novo laudo para este paciente?' : 'Criar novo laudo?'}
                </h3>
                <p className="text-sm text-gray-600">
                  As alterações não salvas serão perdidas. Deseja continuar?
                </p>
              </div>
            </div>
            
            <div className="flex gap-3 justify-end">
              <button
                onClick={cancelarNovoLaudo}
                className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors font-medium"
              >
                Cancelar
              </button>
              <button
                onClick={confirmarNovoLaudo}
                className="px-4 py-2 text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors font-medium"
              >
                Confirmar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
