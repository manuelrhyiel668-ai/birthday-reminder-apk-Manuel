import { useEffect, useId, useRef, type ReactNode } from 'react';
import { X } from 'lucide-react';

export function Modal({ title, eyebrow, children, onClose, wide = false, busy = false }: {
  title: string; eyebrow?: string; children: ReactNode; onClose: () => void; wide?: boolean; busy?: boolean;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  useEffect(() => {
    const dialog = ref.current;
    dialog?.showModal();
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { dialog?.close(); document.body.style.overflow = previous; };
  }, []);
  return <dialog ref={ref} className={`modal ${wide ? 'modal-wide' : ''}`} aria-labelledby={titleId}
    onCancel={event => { event.preventDefault(); if (!busy) onClose(); }}
    onClick={event => { if (event.target === event.currentTarget && !busy) onClose(); }}>
    <div className="modal-inner">
      <div className="modal-heading">
        <div>{eyebrow && <p className="eyebrow">{eyebrow}</p>}<h2 id={titleId}>{title}</h2></div>
        <button className="icon-button" type="button" onClick={onClose} aria-label="Close dialog" disabled={busy}><X size={20} /></button>
      </div>
      {children}
    </div>
  </dialog>;
}
