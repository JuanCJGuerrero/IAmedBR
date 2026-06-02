import { useEffect, useMemo, useState } from 'react';
import { Search, Eye, Edit, Trash2 } from 'lucide-react';
import { calcularIdade } from '../utils/dateUtils';
import { pacienteServices } from '../api/pacienteServices';

export type Patient = {
  id: number;
  name: string;
  age: number;
  gender: string;
  record: string;
  lastVisit: string | null;
};

type PatientListProps = {
  onPatientSelect: (patient: Patient) => void;
};

export function PatientList({ onPatientSelect }: PatientListProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [patients, setPatients] = useState<Patient[]>([]);

  useEffect(() => {
    let cancelled = false;
    pacienteServices
      .listar()
      .then((data) => {
        if (cancelled) return;
        const mapped: Patient[] = data.map((p) => ({
          id: p.id,
          name: p.nome ?? '',
          age: p.data_nascimento ? calcularIdade(p.data_nascimento) : 0,
          gender: '',
          record: p.prontuario ?? '',
          lastVisit: p.ultima_visita ?? null,
        }));
        setPatients(mapped);
      })
      .catch((err) => console.error('Erro ao buscar pacientes', err));
    return () => {
      cancelled = true;
    };
  }, []);

  const filteredPatients = useMemo(() => {
    const term = searchTerm.toLowerCase();

    return patients.filter(patient =>
      patient.name.toLowerCase().includes(term) ||
      patient.record.toLowerCase().includes(term)
    );
  }, [patients, searchTerm]);

  const getInitials = (name: string) => {
    if (!name) return '--';
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .substring(0, 2)
      .toUpperCase();
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold text-gray-800 mb-2">Pacientes</h2>
        <p className="text-gray-600">Gerencie seus pacientes</p>
      </div>

      {/* Search Bar */}
      <div className="bg-white rounded-xl shadow-sm p-4">
        <div className="relative">
          <Search
            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
            size={20}
          />
          <input
            type="text"
            placeholder="Buscar por nome ou prontuário..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* Patient Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredPatients.map(patient => (
          <div
            key={patient.id}
            className="bg-white rounded-xl shadow-sm p-6 hover:shadow-md transition-shadow"
          >
            <div className="flex items-start justify-between mb-4">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                <span className="text-blue-600 font-bold text-lg">
                  {getInitials(patient.name)}
                </span>
              </div>

              {patient.record && (
                <span className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-xs font-medium">
                  {patient.record}
                </span>
              )}
            </div>

            <h3 className="font-bold text-gray-800 mb-2">
              {patient.name || 'Nome não informado'}
            </h3>

            <div className="space-y-1 text-sm text-gray-600 mb-4">
              <p>
                {patient.age} anos{patient.gender && ` • ${patient.gender}`}
              </p>

              {patient.lastVisit && (
                <p>
                  Última visita:{' '}
                  {new Date(patient.lastVisit).toLocaleDateString('pt-BR')}
                </p>
              )}
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => onPatientSelect(patient)}
                className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100"
              >
                <Eye size={16} />
                Ver Laudos
              </button>

              <button className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg">
                <Edit size={16} />
              </button>

              <button className="p-2 text-red-600 hover:bg-red-50 rounded-lg">
                <Trash2 size={16} />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
