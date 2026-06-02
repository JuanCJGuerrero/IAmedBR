import { useState } from "react";
import "./index.css";
import { X } from "lucide-react";
import { Link } from "react-router-dom";
import Modal from "../ui/Modal";

// ✅ Tipos
type StatusTask = "pendente" | "em-andamento" | "revisado" | "concluido";


interface Task {
  id: number;
  name: string;
  category: string;
  ImageProfile: string;
  statusTask: StatusTask;
}

const QuadroLaudo = () => {

  // Usuarios que estão sendo usados nos cards

  const [tasks, setTasks] = useState<Task[]>([


  ]);

  // Usuarios que estão sendo usados nos cards

  // ------------------------------------------------------------------------------------------------------------------

  // Novo usuario que serão adicionados ao card/task
  const newUser = [

    { id: 7, name: "Ricardo Almeida", category: "tomografia computadorizada", ImageProfile: "https://i.pravatar.cc/100?img=7", statusTask: "pendente" },

    { id: 8, name: "Patrícia Mendes", category: "ecocardiograma", ImageProfile: "https://i.pravatar.cc/100?img=8", statusTask: "concluido" },

    { id: 9, name: "Lucas Ferreira", category: "raio-x de tórax", ImageProfile: "https://i.pravatar.cc/100?img=9", statusTask: "em-andamento" },

    { id: 10, name: "Camila Rocha", category: "eletroencefalograma", ImageProfile: "https://i.pravatar.cc/100?img=10", statusTask: "revisado" },

    { id: 11, name: "Bruno Martins", category: "check-up clínico", ImageProfile: "https://i.pravatar.cc/100?img=11", statusTask: "pendente" }

  ]
  // Novo usuario que serão adicionados ao card/task

  // ------------------------------------------------------------------------------------------------------------------

  const [isOpen, setIsOpen] = useState(false);

  // 🔥 Quando começa a arrastar
  const handleDragStart = (
    e: React.DragEvent<HTMLDivElement>,
    id: number
  ) => {
    e.dataTransfer.setData("text/plain", String(id));
  };

  // 🔥 Permite soltar
  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
  };

  // 🔥 Quando solta na coluna
  const handleDrop = (
    e: React.DragEvent<HTMLDivElement>,
    newStatus: StatusTask
  ) => {
    const id = Number(e.dataTransfer.getData("text/plain"));
    console.log(newStatus)
    setTasks((prev) =>
      prev.map((task) =>
        task.id === id ? { ...task, statusTask: newStatus } : task
      )
    );
  };

  // 🔥 Renderiza cada coluna
  const renderColumn = (status: StatusTask, title: string) => {
    const filteredTasks = tasks.filter(
      (task) => task.statusTask === status
    );

    const closeCard = (id: number) => {
      setTasks((prev) => prev.filter((task) => task.id !== id));
    };

    const imgperfil = "https://preview.redd.it/l0ergarfzst61.png?auto=webp&s=5de076eac09bb645d58b11cd8ce82f99ec487329";
    return (

      <>
        <div
          className="card-laudo"
          onDragOver={handleDragOver}
          onDrop={(e) => handleDrop(e, status)}
        >
          <div className="header-card-laudo">
            <span className="name-card">{title}</span>
          </div>

          {filteredTasks.length === 0 ? (
            <div className="tasks empty-task">
              <p>Nenhuma tarefa 🎉</p>
            </div>
          ) : (
            filteredTasks.map((user) => (
              <div
                className="tasks"
                key={user.id}
                draggable
                onDragStart={(e) => handleDragStart(e, user.id)}
              >
                <div className="taskHeader">
                  {/* Namo do paciente */}

                  <div className="flex items-center gap-4">
                    <div className="container-perfil">
                      <img src={user.ImageProfile === "" ? imgperfil : user.ImageProfile} alt="perfil" />
                    </div>
                    <p className="title">{user.name}</p>
                  </div>


                  <button onClick={() => closeCard(user.id)} className="trash">
                    <X size={17} />
                  </button>
                </div>

                <div className="taskBody">
                  <div className={`category`}>
                    <span>Exame: {user.category}</span>
                  </div>
                </div>

                <div className="taskFooter">
                  <Link className="btn-laudo" to="/Laudo-especifico">Ver laudo</Link>
                </div>
              </div>
            ))
          )}

          {status === "pendente" && (
            <button onClick={() => setIsOpen(true)} className="add-card">+ Adicionar</button>
          )}
        </div>
      </>

    );
  };



  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const formData = new FormData(event.currentTarget);
    const userId = Number(formData.get("userId"));

    // 🔎 Encontrar usuário selecionado
    const selectedUser = newUser.find((user) => user.id === userId);

    if (!selectedUser) return;

    // ➕ Adicionar no estado tasks
    setTasks((prev) => [
      ...prev,
      {
        ...selectedUser,
        statusTask: "pendente", // sempre entra como pendente
      },
    ]);

    setIsOpen(false);
  };

  return (

    <>
      <h2 className="text-3xl font-bold text-gray-800 mb-2">Gestão de laudos</h2>
      <p className="text-gray-600 text-base mb-6">
        Organize, acompanhe e gerencie todos os laudos médicos de forma simples, rápida e eficiente.
      </p>

      <Modal isOpen={isOpen} onClose={() => setIsOpen(false)}>
        <div className="modal-overlay" onClick={() => setIsOpen(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <button className="close-button" onClick={() => setIsOpen(false)}>×</button>

            <form onSubmit={handleSubmit}>
              <h2>Adicionar Exame</h2>

              <select name="userId" required>
                <option value="">Selecione um exame</option>
                {newUser.map((user) => (
                  <option key={user.id} value={user.id}>
                    {user.name} - {user.category}
                  </option>
                ))}
              </select>

              <button type="submit" className="submit-button">
                Adicionar Exame
              </button>
            </form>
          </div>
        </div>
      </Modal>



      <div className="container-laudo">
        <div className="laudo">
          {renderColumn("pendente", "Pendente")}
          {renderColumn("em-andamento", "Em Andamento")}
          {renderColumn("revisado", "Revisado")}
          {renderColumn("concluido", "Concluído")}
        </div>
      </div>
    </>

  );
};

export default QuadroLaudo;

