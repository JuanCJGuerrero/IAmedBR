import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Plus, X, Filter, CalendarRange, GripVertical } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  boardApi,
  BOARD_STATUSES,
  BOARD_DOCTORS,
  type BoardCard,
  type BoardStatus,
  type Priority,
} from "@/lib/board-api";
import { patientsApi, type Patient } from "@/lib/patients-api";

const STATUS_STYLES: Record<
  BoardStatus,
  { dot: string; badge: string; column: string }
> = {
  Pendente: {
    dot: "bg-amber-500",
    badge: "bg-amber-100 text-amber-800 hover:bg-amber-100",
    column: "border-t-amber-400",
  },
  "Em Andamento": {
    dot: "bg-blue-500",
    badge: "bg-blue-100 text-blue-800 hover:bg-blue-100",
    column: "border-t-blue-400",
  },
  Revisado: {
    dot: "bg-purple-500",
    badge: "bg-purple-100 text-purple-800 hover:bg-purple-100",
    column: "border-t-purple-400",
  },
  Concluído: {
    dot: "bg-emerald-500",
    badge: "bg-emerald-100 text-emerald-800 hover:bg-emerald-100",
    column: "border-t-emerald-400",
  },
};

const PRIORITY_STYLES: Record<Priority, string> = {
  alta: "border-red-200 bg-red-50 text-red-700",
  média: "border-amber-200 bg-amber-50 text-amber-700",
  baixa: "border-slate-200 bg-slate-50 text-slate-600",
};

const EXAM_TYPES = [
  "Raio-X de tórax",
  "Tomografia computadorizada",
  "Ressonância magnética",
  "Ultrassom abdominal",
  "Ultrassom obstétrico",
  "Ecocardiograma",
  "EEG de rotina",
  "Mamografia bilateral",
  "Densitometria óssea",
  "Check-up cardiológico",
];

const PERIODS = [
  { value: "all", label: "Todos os períodos" },
  { value: "7", label: "Últimos 7 dias" },
  { value: "30", label: "Últimos 30 dias" },
  { value: "90", label: "Últimos 90 dias" },
];

function initialsOf(name: string) {
  const parts = name.trim().split(/\s+/);
  return ((parts[0]?.[0] ?? "") + (parts[parts.length - 1]?.[0] ?? "")).toUpperCase();
}

function formatDate(ts: number) {
  return new Date(ts).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

export default function ReportsBoard() {
  const navigate = useNavigate();
  const [cards, setCards] = useState<BoardCard[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);

  const [filterDoctor, setFilterDoctor] = useState<string>("all");
  const [filterPeriod, setFilterPeriod] = useState<string>("all");

  const [dragId, setDragId] = useState<string | null>(null);
  const [dragOverCol, setDragOverCol] = useState<BoardStatus | null>(null);

  const [addOpen, setAddOpen] = useState(false);
  const [addPatient, setAddPatient] = useState<string>("");
  const [addExam, setAddExam] = useState<string>(EXAM_TYPES[0]);
  const [addPriority, setAddPriority] = useState<Priority>("média");
  const [addDoctor, setAddDoctor] = useState<string>(BOARD_DOCTORS[0]);

  const [detail, setDetail] = useState<BoardCard | null>(null);

  useEffect(() => {
    setCards(boardApi.list());
    setPatients(patientsApi.list());
  }, []);

  const filtered = useMemo(() => {
    return cards.filter((c) => {
      if (filterDoctor !== "all" && c.doctor !== filterDoctor) return false;
      if (filterPeriod !== "all") {
        const days = parseInt(filterPeriod, 10);
        if (Date.now() - c.createdAt > days * 86400000) return false;
      }
      return true;
    });
  }, [cards, filterDoctor, filterPeriod]);

  const grouped = useMemo(() => {
    const map: Record<BoardStatus, BoardCard[]> = {
      Pendente: [],
      "Em Andamento": [],
      Revisado: [],
      Concluído: [],
    };
    for (const c of filtered) map[c.status].push(c);
    return map;
  }, [filtered]);

  function onDragStart(id: string) {
    setDragId(id);
  }
  function onDragEnd() {
    setDragId(null);
    setDragOverCol(null);
  }
  function onDropOn(status: BoardStatus) {
    if (!dragId) return;
    const card = cards.find((c) => c.id === dragId);
    if (!card || card.status === status) {
      onDragEnd();
      return;
    }
    setCards(boardApi.setStatus(dragId, status));
    toast.success(`Movido para ${status}.`);
    onDragEnd();
  }

  function handleRemove(id: string) {
    setCards(boardApi.remove(id));
    toast.success("Laudo removido.");
    if (detail?.id === id) setDetail(null);
  }

  function handleAdd() {
    const patient = patients.find((p) => p.id === addPatient);
    if (!patient) {
      toast.error("Selecione um paciente.");
      return;
    }
    setCards(
      boardApi.add({
        patientId: patient.id,
        patientName: patient.nome,
        exam: addExam,
        doctor: addDoctor,
        priority: addPriority,
      }),
    );
    toast.success("Laudo adicionado.");
    setAddOpen(false);
    setAddPatient("");
    setAddExam(EXAM_TYPES[0]);
    setAddPriority("média");
  }

  return (
    <div className="space-y-6">
      {/* Cabeçalho */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">
            Gestão de Laudos
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Organize, acompanhe e gerencie todos os laudos médicos.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-slate-400" />
            <Select value={filterDoctor} onValueChange={setFilterDoctor}>
              <SelectTrigger className="h-9 w-[180px] border-slate-200">
                <SelectValue placeholder="Médico" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os médicos</SelectItem>
                {BOARD_DOCTORS.map((d) => (
                  <SelectItem key={d} value={d}>
                    {d}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center gap-2">
            <CalendarRange className="h-4 w-4 text-slate-400" />
            <Select value={filterPeriod} onValueChange={setFilterPeriod}>
              <SelectTrigger className="h-9 w-[180px] border-slate-200">
                <SelectValue placeholder="Período" />
              </SelectTrigger>
              <SelectContent>
                {PERIODS.map((p) => (
                  <SelectItem key={p.value} value={p.value}>
                    {p.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button
            onClick={() => setAddOpen(true)}
            className="h-9 bg-blue-600 hover:bg-blue-700 text-white"
          >
            <Plus className="mr-2 h-4 w-4" />
            Adicionar
          </Button>
        </div>
      </div>

      {/* Kanban */}
      <div className="-mx-2 flex gap-4 overflow-x-auto px-2 pb-4">
        {BOARD_STATUSES.map((status) => {
          const list = grouped[status];
          const styles = STATUS_STYLES[status];
          const isOver = dragOverCol === status;
          return (
            <div
              key={status}
              onDragOver={(e) => {
                e.preventDefault();
                if (dragOverCol !== status) setDragOverCol(status);
              }}
              onDragLeave={() => {
                if (dragOverCol === status) setDragOverCol(null);
              }}
              onDrop={() => onDropOn(status)}
              className={`flex w-[300px] shrink-0 flex-col rounded-lg border border-t-4 bg-slate-50/60 transition ${
                styles.column
              } ${
                isOver
                  ? "border-blue-400 bg-blue-50/60 ring-2 ring-blue-200"
                  : "border-slate-200"
              }`}
            >
              <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
                <div className="flex items-center gap-2">
                  <span className={`h-2 w-2 rounded-full ${styles.dot}`} />
                  <h3 className="text-sm font-semibold text-slate-800">
                    {status}
                  </h3>
                  <Badge
                    variant="secondary"
                    className="h-5 bg-slate-200 px-1.5 text-[11px] text-slate-700 hover:bg-slate-200"
                  >
                    {list.length}
                  </Badge>
                </div>
              </div>

              <div className="flex-1 space-y-3 p-3">
                {list.length === 0 ? (
                  <div className="rounded-md border border-dashed border-slate-200 py-10 text-center text-xs text-slate-400">
                    Nenhuma tarefa 🎉
                  </div>
                ) : (
                  list.map((card) => (
                    <Card
                      key={card.id}
                      draggable
                      onDragStart={() => onDragStart(card.id)}
                      onDragEnd={onDragEnd}
                      onClick={() => setDetail(card)}
                      className={`group relative cursor-grab border-slate-200 bg-white p-3 rounded-xl shadow-card hover-lift active:cursor-grabbing ${
                        dragId === card.id ? "opacity-50" : ""
                      }`}
                    >
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRemove(card.id);
                        }}
                        className="absolute right-2 top-2 rounded p-1 text-slate-300 opacity-0 transition hover:bg-red-50 hover:text-red-600 group-hover:opacity-100"
                        aria-label="Remover"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>

                      <div className="flex items-start gap-2.5">
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-blue-100 text-xs font-bold text-blue-700">
                          {initialsOf(card.patientName)}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="truncate pr-5 text-sm font-semibold text-slate-900">
                            {card.patientName}
                          </p>
                          <p className="mt-0.5 truncate text-xs text-slate-500">
                            Exame: {card.exam}
                          </p>
                        </div>
                      </div>

                      <div className="mt-3 flex items-center justify-between">
                        <Badge
                          variant="outline"
                          className={`text-[10px] font-medium uppercase tracking-wide ${PRIORITY_STYLES[card.priority]}`}
                        >
                          {card.priority}
                        </Badge>
                        <span className="text-[11px] text-slate-400">
                          {formatDate(card.createdAt)}
                        </span>
                      </div>

                      <div className="mt-3 flex items-center justify-between border-t border-slate-100 pt-2">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/reports?card=${card.id}`);
                          }}
                          className="text-xs font-medium text-blue-600 hover:text-blue-700 hover:underline"
                        >
                          Ver laudo →
                        </button>
                        <GripVertical className="h-3.5 w-3.5 text-slate-300" />
                      </div>
                    </Card>
                  ))
                )}
              </div>

              {status === "Pendente" && (
                <div className="border-t border-slate-200 p-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setAddOpen(true)}
                    className="w-full justify-start text-xs text-slate-500 hover:bg-white hover:text-slate-800"
                  >
                    <Plus className="mr-1.5 h-3.5 w-3.5" />
                    Adicionar
                  </Button>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Modal Adicionar */}
      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Adicionar laudo</DialogTitle>
            <DialogDescription>
              Crie um novo card no quadro de gestão.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Paciente</Label>
              <Select value={addPatient} onValueChange={setAddPatient}>
                <SelectTrigger className="border-slate-200">
                  <SelectValue placeholder="Selecione um paciente" />
                </SelectTrigger>
                <SelectContent>
                  {patients.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.nome} · {p.prontuario}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Tipo de laudo</Label>
              <Select value={addExam} onValueChange={setAddExam}>
                <SelectTrigger className="border-slate-200">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {EXAM_TYPES.map((e) => (
                    <SelectItem key={e} value={e}>
                      {e}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Prioridade</Label>
                <Select
                  value={addPriority}
                  onValueChange={(v) => setAddPriority(v as Priority)}
                >
                  <SelectTrigger className="border-slate-200">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="alta">Alta</SelectItem>
                    <SelectItem value="média">Média</SelectItem>
                    <SelectItem value="baixa">Baixa</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Médico</Label>
                <Select value={addDoctor} onValueChange={setAddDoctor}>
                  <SelectTrigger className="border-slate-200">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {BOARD_DOCTORS.map((d) => (
                      <SelectItem key={d} value={d}>
                        {d}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setAddOpen(false)}
              className="border-slate-200"
            >
              Cancelar
            </Button>
            <Button
              onClick={handleAdd}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              Adicionar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Painel lateral de detalhes */}
      <Sheet open={!!detail} onOpenChange={(o) => !o && setDetail(null)}>
        <SheetContent className="w-full sm:max-w-md">
          {detail && (
            <>
              <SheetHeader className="space-y-1">
                <SheetTitle className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100 text-sm font-bold text-blue-700">
                    {initialsOf(detail.patientName)}
                  </div>
                  <span>{detail.patientName}</span>
                </SheetTitle>
                <SheetDescription>
                  Detalhes do laudo selecionado.
                </SheetDescription>
              </SheetHeader>

              <div className="mt-6 space-y-5 text-sm">
                <div className="flex items-center gap-2">
                  <Badge
                    variant="secondary"
                    className={STATUS_STYLES[detail.status].badge}
                  >
                    {detail.status}
                  </Badge>
                  <Badge
                    variant="outline"
                    className={`text-[10px] font-medium uppercase ${PRIORITY_STYLES[detail.priority]}`}
                  >
                    Prioridade {detail.priority}
                  </Badge>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-slate-400">Tipo de exame</p>
                    <p className="mt-1 font-medium text-slate-800">
                      {detail.exam}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-400">Médico</p>
                    <p className="mt-1 font-medium text-slate-800">
                      {detail.doctor}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-400">Criado em</p>
                    <p className="mt-1 font-medium text-slate-800">
                      {formatDate(detail.createdAt)}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-400">ID</p>
                    <p className="mt-1 font-mono text-xs text-slate-600">
                      {detail.id}
                    </p>
                  </div>
                </div>

                {detail.notes && (
                  <div>
                    <p className="text-xs text-slate-400">Observações</p>
                    <p className="mt-1 rounded-md border border-slate-200 bg-slate-50 p-3 text-sm leading-relaxed text-slate-700">
                      {detail.notes}
                    </p>
                  </div>
                )}

                <div className="flex gap-2 pt-2">
                  <Button
                    onClick={() => navigate(`/reports?card=${detail.id}`)}
                    className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    Abrir laudo
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => handleRemove(detail.id)}
                    className="border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700"
                  >
                    <X className="mr-1 h-4 w-4" />
                    Excluir
                  </Button>
                </div>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
