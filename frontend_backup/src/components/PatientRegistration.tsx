import { useState, useRef, useEffect } from 'react';
import { toast } from "sonner";
import { Camera, Upload, X, Edit, Trash2, Save, Plus, User, FileText, Calendar, CreditCard, ChevronDown, ChevronUp, Check } from 'lucide-react';
import { CameraRG } from "./CameraRG";
import { pacienteServices } from "../api/pacienteServices";
import { ocrServices } from "../api/ocrServices";
import { ocrClient } from "../api/httpClient";

// Camada de compatibilidade local — mantém os nomes antigos enquanto o
// componente é refatorado em pequenos passos.
const criarPaciente = (p: any) => pacienteServices.criar(p);
const atualizarPaciente = (id: string | number, p: any) =>
  pacienteServices.atualizar(Number(id), p);
const deletarPaciente = (id: string | number) =>
  pacienteServices.deletar(Number(id));


// import { Buffer } from 'buffer'; // Importing Buffer from 'buffer' only if needed


type Patient = {
  id: string;
  fullName: string;
  rg: string;
  cpf: string;
  birthDate: string;
  rgPhoto?: string;
  registrationDate: Date;
};

type FormMode = 'list' | 'create' | 'edit'| 'ocr';

export function PatientRegistration() {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [mode, setMode] = useState<FormMode>('list');
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
const [isCameraOpen, setIsCameraOpen] = useState(false);
const [showCamera, setShowCamera] = useState(false);



  const [searchTerm, setSearchTerm] = useState('');
  const [expandedPatientId, setExpandedPatientId] = useState<string | null>(null);
  const [rgFile, setRgFile] = useState<File | null>(null);





  
  
  // Form fields
  const [formData, setFormData] = useState({
    fullName: '',
    rg: '',
    cpf: '',
    birthDate: '',
    rgPhoto: '',
  });
  
  const [errors, setErrors] = useState<Record<string, string>>({});
 



  //converte Base64 para file
function ensureFile(photo: File | string): File {
  if (photo instanceof File) {
    return photo;
  }

  // se vier base64 (camera)
  const arr = photo.split(',');
  const mime = arr[0].match(/:(.*?);/)?.[1] || 'image/jpeg';
  const bstr = atob(arr[1]);
  let n = bstr.length;
  const u8arr = new Uint8Array(n);

  while (n--) {
    u8arr[n] = bstr.charCodeAt(n);
  }

  return new File([u8arr], 'rg.jpg', { type: mime });
}



async function sendRGToOCR() {
  if (!formData.rgPhoto) {
    toast.error('Nenhuma imagem selecionada');
    return;
  }

  toast.info('Lendo RG...');
  const file = ensureFile(formData.rgPhoto);

  try {
    const result = await ocrServices.lerRG(file);

    if (result.status !== 'sucesso') {
      throw new Error('Não foi possível ler o documento');
    }

    setFormData(prev => ({
      ...prev,
      fullName: result.dados?.nome || '',
      rg: result.dados?.rg || '',
      cpf: result.dados?.cpf || '',
      birthDate: result.dados?.data_nascimento
        ? result.dados.data_nascimento.split('/').reverse().join('-')
        : '',
    }));
  } catch (err) {
    console.error('OCR erro:', err);
    toast.error('Erro ao processar OCR');
  }
}




  /* =========================
     🔥 OCR – BUSCA NA API
     ========================= */
  async function fetchRGFromAPI() {
    try {
      const { data: result } = await ocrClient.get('/api/rg/ultimo');
      if (!result?.dados) return;

      setFormData(prev => ({
        ...prev,
        fullName: result.dados.nome || '',
        rg: result.dados.rg || '',
        cpf: result.dados.cpf || '',
        birthDate: result.dados.data_nascimento
          ? result.dados.data_nascimento.split('/').reverse().join('-')
          : '',
      }));
    } catch (err) {
      console.warn('OCR indisponível:', err);
    }
  }



  /* 🔄 Dispara OCR automaticamente ao criar */
  useEffect(() => {
  if (mode === 'ocr') {
    fetchRGFromAPI().finally(() => {
      setMode('create');
    });
  }
}, [mode]);



  // Validação de CPF
  const validateCPF = (cpf: string): boolean => {
    const cleanCPF = cpf.replace(/\D/g, '');
    
    if (cleanCPF.length !== 11) return false;
    if (/^(\d)\1{10}$/.test(cleanCPF)) return false;
    
    let sum = 0;
    for (let i = 0; i < 9; i++) {
      sum += parseInt(cleanCPF.charAt(i)) * (10 - i);
    }
    let digit = 11 - (sum % 11);
    if (digit >= 10) digit = 0;
    if (digit !== parseInt(cleanCPF.charAt(9))) return false;
    
    sum = 0;
    for (let i = 0; i < 10; i++) {
      sum += parseInt(cleanCPF.charAt(i)) * (11 - i);
    }
    digit = 11 - (sum % 11);
    if (digit >= 10) digit = 0;
    if (digit !== parseInt(cleanCPF.charAt(10))) return false;
    
    return true;
  };

  // Formatação de CPF
  const formatCPF = (value: string): string => {
    const cleaned = value.replace(/\D/g, '');
    if (cleaned.length <= 3) return cleaned;
    if (cleaned.length <= 6) return `${cleaned.slice(0, 3)}.${cleaned.slice(3)}`;
    if (cleaned.length <= 9) return `${cleaned.slice(0, 3)}.${cleaned.slice(3, 6)}.${cleaned.slice(6)}`;
    return `${cleaned.slice(0, 3)}.${cleaned.slice(3, 6)}.${cleaned.slice(6, 9)}-${cleaned.slice(9, 11)}`;
  };

  // Formatação de RG
  const formatRG = (value: string): string => {
    const cleaned = value.replace(/\D/g, '');
    if (cleaned.length <= 2) return cleaned;
    if (cleaned.length <= 5) return `${cleaned.slice(0, 2)}.${cleaned.slice(2)}`;
    if (cleaned.length <= 8) return `${cleaned.slice(0, 2)}.${cleaned.slice(2, 5)}.${cleaned.slice(5)}`;
    return `${cleaned.slice(0, 2)}.${cleaned.slice(2, 5)}.${cleaned.slice(5, 8)}-${cleaned.slice(8, 9)}`;
  };

  // Validação do formulário
  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.fullName.trim()) {
      newErrors.fullName = 'Nome completo é obrigatório';
    } else if (formData.fullName.trim().split(' ').length < 2) {
      newErrors.fullName = 'Digite o nome completo';
    }
    
    if (!formData.rg.trim()) {
      newErrors.rg = 'RG é obrigatório';
    } else if (formData.rg.replace(/\D/g, '').length < 7) {
      newErrors.rg = 'RG inválido';
    }
    
    if (!formData.cpf.trim()) {
      newErrors.cpf = 'CPF é obrigatório';
    } else if (!validateCPF(formData.cpf)) {
      newErrors.cpf = 'CPF inválido';
    }
    
    if (!formData.birthDate) {
      newErrors.birthDate = 'Data de nascimento é obrigatória';
    } else {
      const birthDate = new Date(formData.birthDate);
      const today = new Date();
      const age = today.getFullYear() - birthDate.getFullYear();
      if (age < 0 || age > 150) {
        newErrors.birthDate = 'Data de nascimento inválida';
      }
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  

  // Upload de foto
  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData({ ...formData, rgPhoto: reader.result as string });
      };
      reader.readAsDataURL(file);
    }
  };

const fromApiPaciente = (api: any): Patient => ({
  id: api.id,
  fullName: api.nome,
  rg: api.rg,
  cpf: api.cpf,
  birthDate: api.data_nascimento,
  rgPhoto: api.foto_rg_base64,
  registrationDate: api.data_cadastro ?? new Date().toISOString(),
});



  
 // Salvar paciente
const handleSave = async () => {
  if (!validateForm()) return;

  try {
    // DTO no formato EXATO que o FastAPI espera
    const pacienteDTO = {
      nome: formData.fullName,
      rg: formData.rg,
      cpf: formData.cpf,
      data_nascimento: formData.birthDate,
      foto_rg_base64: formData.rgPhoto || null,
    };

    if (mode === "edit" && selectedPatient) {
      const atualizado = await atualizarPaciente(
        selectedPatient.id,
        pacienteDTO
      );

      const paciente = fromApiPaciente(atualizado);

      setPatients(patients.map(p =>
        p.id === paciente.id ? paciente : p
      ));
    } else {
      const novo = await criarPaciente(pacienteDTO);

      const paciente = fromApiPaciente(novo);

      setPatients([...patients, paciente]);
    }

    resetForm();
    setMode("create");
    setSelectedPatient(null);
    toast.success("Paciente salvo com sucesso!");
  } catch (error) {
    console.error(error);
    toast.error("Erro ao salvar paciente");
  }
};


  // Editar paciente
  const handleEdit = (patient: Patient) => {
    setSelectedPatient(patient);
    setFormData({
      fullName: patient.fullName,
      rg: patient.rg,
      cpf: patient.cpf,
      birthDate: patient.birthDate,
      rgPhoto: patient.rgPhoto || '',
    });
    setMode('edit');
    setErrors({});
  };

  // Deletar paciente
  const handleDelete = async (id: string) => {
  if (!confirm("Tem certeza que deseja excluir este paciente?")) return;

  try {
    await deletarPaciente(id);
    setPatients(patients.filter(p => p.id !== id));
  } catch (error) {
    console.error(error);
    toast.error("Erro ao excluir paciente");
  }
};


  // Resetar formulário
  const resetForm = () => {
    setFormData({
      fullName: '',
      rg: '',
      cpf: '',
      birthDate: '',
      rgPhoto: '',
    });
    setMode('list');
    setSelectedPatient(null);
    setErrors({});
  };

  // Filtrar pacientes
  const filteredPatients = patients.filter(p =>
    p.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.cpf.includes(searchTerm) ||
    p.rg.includes(searchTerm)
  );

  /* Cleanup camera on unmount
  useEffect(() => {
    return () => {
      if (cameraStream) {
        cameraStream.getTracks().forEach(track => track.stop());
      }
    };
  }, [cameraStream]);
*/

  // Lista de pacientes
  if (mode === 'list') {
    return (
      <div className="h-full flex flex-col">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4 md:mb-6 pb-3 md:pb-4 border-b border-gray-200">
          <div>
            <h2 className="text-xl md:text-2xl font-bold text-gray-800">Cadastro de Pacientes</h2>
            <p className="text-xs md:text-sm text-gray-500 mt-1">{patients.length} paciente(s) cadastrado(s)</p>
          </div>
          <button
            onClick={() => setMode('create')}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus size={18} />
            Novo Paciente
          </button>
        </div>

        {/* Search */}
        <div className="mb-4">
          <input
            type="text"
            placeholder="Buscar por nome, CPF ou RG..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm md:text-base"
          />
        </div>

        {/* Patient List */}
        <div className="flex-1 overflow-y-auto">
          {filteredPatients.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-gray-400">
              <User size={64} className="mb-4 opacity-50" />
              <p className="text-lg">
                {searchTerm ? 'Nenhum paciente encontrado' : 'Nenhum paciente cadastrado'}
              </p>
              {!searchTerm && (
                <button
                  onClick={() => setMode('create')}
                  className="mt-4 text-blue-600 hover:text-blue-700 underline"
                >
                  Cadastrar primeiro paciente
                </button>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              {/* Desktop Table */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Foto RG</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Nome Completo</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">CPF</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">RG</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Data Nasc.</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredPatients.map((patient) => (
                      <tr key={patient.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3">
                          {patient.rgPhoto ? (
                            <img
                              src={patient.rgPhoto}
                              alt="RG"
                              className="w-16 h-10 object-cover rounded border border-gray-200"
                            />
                          ) : (
                            <div className="w-16 h-10 bg-gray-100 rounded flex items-center justify-center">
                              <FileText size={16} className="text-gray-400" />
                            </div>
                          )}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-800">{patient.fullName}</td>
                        <td className="px-4 py-3 text-sm text-gray-600">{patient.cpf}</td>
                        <td className="px-4 py-3 text-sm text-gray-600">{patient.rg}</td>
                        <td className="px-4 py-3 text-sm text-gray-600">
                          {new Date(patient.birthDate).toLocaleDateString('pt-BR')}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => handleEdit(patient)}
                              className="p-1.5 text-blue-600 hover:bg-blue-50 rounded transition-colors"
                              title="Editar"
                            >
                              <Edit size={16} />
                            </button>
                            <button
                              onClick={() => handleDelete(patient.id)}
                              className="p-1.5 text-red-600 hover:bg-red-50 rounded transition-colors"
                              title="Excluir"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile Cards */}
              <div className="md:hidden space-y-3">
                {filteredPatients.map((patient) => (
                  <div key={patient.id} className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                    <button
                      onClick={() => setExpandedPatientId(expandedPatientId === patient.id ? null : patient.id)}
                      className="w-full p-4 flex items-center gap-3 hover:bg-gray-50 transition-colors"
                    >
                      {patient.rgPhoto ? (
                        <img
                          src={patient.rgPhoto}
                          alt="RG"
                          className="w-16 h-16 object-cover rounded border border-gray-200 flex-shrink-0"
                        />
                      ) : (
                        <div className="w-16 h-16 bg-gray-100 rounded flex items-center justify-center flex-shrink-0">
                          <User size={24} className="text-gray-400" />
                        </div>
                      )}
                      <div className="flex-1 text-left min-w-0">
                        <p className="font-medium text-gray-800 truncate">{patient.fullName}</p>
                        <p className="text-sm text-gray-500">CPF: {patient.cpf}</p>
                      </div>
                      {expandedPatientId === patient.id ? (
                        <ChevronUp size={20} className="text-gray-400 flex-shrink-0" />
                      ) : (
                        <ChevronDown size={20} className="text-gray-400 flex-shrink-0" />
                      )}
                    </button>

                    {expandedPatientId === patient.id && (
                      <div className="border-t border-gray-200 p-4 space-y-3 bg-gray-50">
                        <div>
                          <p className="text-xs text-gray-500 mb-1">RG</p>
                          <p className="text-sm text-gray-800">{patient.rg}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500 mb-1">Data de Nascimento</p>
                          <p className="text-sm text-gray-800">
                            {new Date(patient.birthDate).toLocaleDateString('pt-BR')}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500 mb-1">Cadastrado em</p>
                          <p className="text-sm text-gray-800">
                            {new Date(patient.registrationDate).toLocaleDateString('pt-BR')}
                          </p>
                        </div>
                        <div className="flex gap-2 pt-2">
                          <button
                            onClick={() => handleEdit(patient)}
                            className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                          >
                            <Edit size={16} />
                            Editar
                          </button>
                          <button
                            onClick={() => handleDelete(patient.id)}
                            className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                          >
                            <Trash2 size={16} />
                            Excluir
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Formulário de criação/edição
  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between mb-4 md:mb-6 pb-3 md:pb-4 border-b border-gray-200">
        <div>
          <h2 className="text-xl md:text-2xl font-bold text-gray-800">
            {mode === 'create' ? 'Novo Paciente' : 'Editar Paciente'}
          </h2>
        </div>
        <button
          onClick={resetForm}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          title="Fechar"
        >
          <X size={20} />
        </button>
      </div>

      {/* Form */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-2xl mx-auto space-y-6">
         {/* Foto do RG */}
<div>
  <label className="block text-sm font-medium text-gray-700 mb-2">
    Foto do RG
  </label>

  {/* Preview da imagem */}
  {formData.rgPhoto && (
    <div className="relative mb-3">
      <img
        src={formData.rgPhoto}
        alt="RG"
        className="w-full max-w-md h-auto rounded-lg border-2 border-gray-200"
      />

      {/* Remover foto */}
      <button
        onClick={() => setFormData({ ...formData, rgPhoto: '' })}
        className="absolute top-2 right-2 p-2 bg-red-600 text-white rounded-full hover:bg-red-700 transition-colors shadow-lg"
        title="Remover foto"
      >
        <X size={16} />
      </button>
    </div>
  )}
  


  {/* Botões */}
  <div className="flex flex-col sm:flex-row gap-3">
    {/* Tirar foto */}
    {!formData.rgPhoto && (
      <button
       onClick={() => setShowCamera(true)}

        className="flex-1 flex items-center justify-center gap-2 px-4 py-3 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors"
      >
        <Camera size={20} className="text-gray-600" />
        <span className="text-sm text-gray-600">Tirar Foto</span>
      </button>
    )}

    {/* Upload */}
    {!formData.rgPhoto && (
      <label className="flex-1 flex items-center justify-center gap-2 px-4 py-3 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors cursor-pointer">
        <Upload size={20} className="text-gray-600" />
        <span className="text-sm text-gray-600">Enviar Arquivo</span>
        <input
          type="file"
          accept="image/*"
          onChange={handlePhotoUpload}
          className="hidden"
        />
      </label>

      
    )}

    {/* 🔥 BOTÃO LER RG — SEMPRE VISÍVEL SE TIVER FOTO */}
 <button
  type="button"
  onClick={sendRGToOCR}
  disabled={!formData.rgPhoto}
  className={`
   flex items-center justify-center gap-2
    px-5 py-3
    rounded-xl
    shadow-lg
    transition-all
    ${formData.rgPhoto
      ? 'bg-green-600 hover:bg-green-700 text-white'
      : 'bg-gray-400 cursor-not-allowed text-gray-700'}

    ${formData.rgPhoto
      ? 'bg-blue-600 text-white hover:bg-blue-700 border border-blue-700'
      : 'bg-gray-300 text-gray-600 cursor-not-allowed border border-gray-300'}
  `}
>
  <Upload size={20} />
  <span className="text-sm">
    {formData.rgPhoto ? 'Ler RG' : 'Nenhuma imagem Selecionada'}
  </span>
</button>



</div>
</div>


          {/* Nome Completo */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Nome Completo *
            </label>
            <input
              type="text"
              value={formData.fullName}
              onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
              className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                errors.fullName ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="Ex: João Silva Santos"
            />
            {errors.fullName && (
              <p className="mt-1 text-sm text-red-600">{errors.fullName}</p>
            )}
          </div>

          {/* RG */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              RG *
            </label>
            <input
              type="text"
              value={formData.rg}
              onChange={(e) => setFormData({ ...formData, rg: formatRG(e.target.value) })}
              className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                errors.rg ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="Ex: 12.345.678-9"
              maxLength={12}
            />
            {errors.rg && (
              <p className="mt-1 text-sm text-red-600">{errors.rg}</p>
            )}
          </div>

          {/* CPF */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              CPF *
            </label>
            <input
              type="text"
              value={formData.cpf}
              onChange={(e) => setFormData({ ...formData, cpf: formatCPF(e.target.value) })}
              className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                errors.cpf ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="Ex: 123.456.789-00"
              maxLength={14}
            />
            {errors.cpf && (
              <p className="mt-1 text-sm text-red-600">{errors.cpf}</p>
            )}
          </div>

          {/* Data de Nascimento */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Data de Nascimento *
            </label>
            <input
              type="date"
              value={formData.birthDate}
              onChange={(e) => setFormData({ ...formData, birthDate: e.target.value })}
              className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                errors.birthDate ? 'border-red-500' : 'border-gray-300'
              }`}
              max={new Date().toISOString().split('T')[0]}
            />
            {errors.birthDate && (
              <p className="mt-1 text-sm text-red-600">{errors.birthDate}</p>
            )}
          </div>

          {/* Botões */}
          <div className="flex gap-3 pt-4 sticky bottom-0 bg-white pb-4">
            <button
              onClick={resetForm}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancelar
            </button>
            <button
              onClick={handleSave}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Save size={18} />
              Salvar
            </button>
          </div>
        </div>
      </div>

     

         
         <CameraRG
  open={showCamera}
  onClose={() => setShowCamera(false)}
  formData={formData}
  setFormData={setFormData}
/>

        </div>
      )}
    
  

