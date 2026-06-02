import { Users, FileText, Clock, TrendingUp } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

type ReportStatus = 'Pendente' | 'Em Andamento' | 'Concluído' | 'Revisado';

export function Dashboard() {
  const navigate = useNavigate();

  const [reports, setReports] = useState([
    { id: '1', patient: 'Maria Santos', type: 'Raio-X Tórax', date: '2026-01-07', status: 'Concluído' as ReportStatus },
    { id: '2', patient: 'João Oliveira', type: 'Tomografia', date: '2026-01-07', status: 'Concluído' as ReportStatus },
    { id: '3', patient: 'Ana Costa', type: 'Ressonância', date: '2026-01-06', status: 'Pendente' as ReportStatus },
    { id: '4', patient: 'Pedro Alves', type: 'Ultrassom', date: '2026-01-06', status: 'Em Andamento' as ReportStatus },
  ]);
  const [openDropdownId, setOpenDropdownId] = useState<string | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setOpenDropdownId(null);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const getStatusColor = (status: ReportStatus) => {
    const colors = {
      'Pendente': 'bg-yellow-100 text-yellow-700',
      'Em Andamento': 'bg-blue-100 text-blue-700',
      'Concluído': 'bg-green-100 text-green-700',
      'Revisado': 'bg-purple-100 text-purple-700',
    };
    return colors[status];
  };

  const updateReportStatus = (reportId: string, newStatus: ReportStatus) => {
    setReports(reports.map(report => 
      report.id === reportId ? { ...report, status: newStatus } : report
    ));
    setOpenDropdownId(null);
  };

  const toggleDropdown = (reportId: string) => {
    setOpenDropdownId(openDropdownId === reportId ? null : reportId);
  };

  const stats = [
    { label: 'Total de Pacientes', value: '156', icon: Users, color: 'bg-blue-500', change: '+12%' },
    { label: 'Laudos Criados', value: '89', icon: FileText, color: 'bg-green-500', change: '+8%' },
    { label: 'Pendentes', value: '7', icon: Clock, color: 'bg-yellow-500', change: '-3%' },
    { label: 'Taxa de Conclusão', value: '94%', icon: TrendingUp, color: 'bg-purple-500', change: '+5%' },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold text-gray-800 mb-2">Dashboard</h2>
        <p className="text-gray-600">Visão geral da sua atividade médica</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <div key={index} className="bg-white rounded-xl shadow-sm p-6 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between mb-4">
                <div className={`${stat.color} p-3 rounded-lg`}>
                  <Icon size={24} className="text-white" />
                </div>
                <span className={`text-sm font-medium ${stat.change.startsWith('+') ? 'text-green-600' : 'text-red-600'}`}>
                  {stat.change}
                </span>
              </div>
              <p className="text-2xl font-bold text-gray-800 mb-1">{stat.value}</p>
              <p className="text-sm text-gray-600">{stat.label}</p>
            </div>
          );
        })}
      </div>

      {/* Recent Reports */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-bold text-gray-800">Laudos Recentes</h3>
          <button 
            onClick={() => navigate('/reports')}
            className="text-blue-600 hover:text-blue-700 font-medium text-sm"
          >
            Ver todos
          </button>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 px-4 font-medium text-gray-700">Paciente</th>
                <th className="text-left py-3 px-4 font-medium text-gray-700">Tipo de Exame</th>
                <th className="text-left py-3 px-4 font-medium text-gray-700">Data</th>
                <th className="text-left py-3 px-4 font-medium text-gray-700">Status</th>
              </tr>
            </thead>
            <tbody>
              {reports.map((report) => (
                <tr key={report.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                  <td className="py-3 px-4 text-gray-800">{report.patient}</td>
                  <td className="py-3 px-4 text-gray-600">{report.type}</td>
                  <td className="py-3 px-4 text-gray-600">{new Date(report.date).toLocaleDateString('pt-BR')}</td>
                  <td className="py-3 px-4">
                    <div className="relative" ref={openDropdownId === report.id ? dropdownRef : null}>
                      <button 
                        onClick={() => toggleDropdown(report.id)}
                        className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(report.status)} cursor-pointer hover:opacity-80 transition-opacity`}
                      >
                        {report.status} ▾
                      </button>
                      
                      {/* Dropdown menu on click */}
                      {openDropdownId === report.id && (
                        <div className="absolute left-0 mt-1 z-10 bg-white border border-gray-200 rounded-lg shadow-lg py-1 min-w-[140px]">
                          <button
                            onClick={() => updateReportStatus(report.id, 'Pendente')}
                            className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-yellow-50 transition-colors flex items-center gap-2"
                          >
                            <span>⏳</span> Pendente
                          </button>
                          <button
                            onClick={() => updateReportStatus(report.id, 'Em Andamento')}
                            className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-blue-50 transition-colors flex items-center gap-2"
                          >
                            <span>✏️</span> Em Andamento
                          </button>
                          <button
                            onClick={() => updateReportStatus(report.id, 'Concluído')}
                            className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-green-50 transition-colors flex items-center gap-2"
                          >
                            <span>✓</span> Concluído
                          </button>
                          <button
                            onClick={() => updateReportStatus(report.id, 'Revisado')}
                            className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-purple-50 transition-colors flex items-center gap-2"
                          >
                            <span>✓✓</span> Revisado
                          </button>
                        </div>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}