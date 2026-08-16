import { useEffect, useRef } from 'react';
import { X } from 'lucide-react';
import './Dialog.css';

/**
 * Generic dialog wrapper using the native <dialog> element.
 */
export default function Dialog({ open, onClose, title, children, footer, wide }) {
  const ref = useRef(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (open) {
      if (!el.open) el.showModal();
    } else {
      if (el.open) el.close();
    }
  }, [open]);

  // Close when clicking the backdrop
  function handleClick(e) {
    if (e.target === ref.current) onClose();
  }

  return (
    <dialog
      ref={ref}
      onClick={handleClick}
      onClose={onClose}
      className={wide ? 'dialog-wide' : ''}
    >
      <div className="dialog-header">
        <h2 className="dialog-title">{title}</h2>
        <button className="btn btn-ghost btn-icon" onClick={onClose} id="dialog-close-btn">
          <X size={16} />
        </button>
      </div>
      <div className="dialog-body">{children}</div>
      {footer && <div className="dialog-footer">{footer}</div>}
    </dialog>
  );
}
