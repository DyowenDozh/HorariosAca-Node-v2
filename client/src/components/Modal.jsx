// Modal.jsx - Ventana modal reutilizable para formularios y confirmaciones
function Modal({ title, onClose, children }) {
    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                <div className="modal-header">
                    <h2>{title}</h2>
                    <button className="close-modal" onClick={onClose}>&times;</button>
                </div>
                {children}
            </div>
        </div>
    );
}

export default Modal;
