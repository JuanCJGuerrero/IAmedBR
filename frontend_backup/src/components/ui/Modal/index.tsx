import { X } from "lucide-react";
import "./index.css"; // ou "./index.css" se preferir

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
}

const Modal = ({ isOpen, onClose, children }: ModalProps) => {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-content"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Botão fechar */}
        <button
          onClick={onClose}
          className="modal-close"
          aria-label="Fechar modal"
        >
          <X size={18} />
        </button>

        {children}
      </div>
    </div>
  );
};

export default Modal;