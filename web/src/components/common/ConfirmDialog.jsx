import React from 'react';
import { Modal } from './Modal';
import { AlertTriangle, CheckCircle, Info } from 'lucide-react';

export const ConfirmDialog = ({
  isOpen,
  onClose,
  onConfirm,
  title = 'Confirm Action',
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  type = 'warning', // 'warning', 'danger', 'info'
}) => {
  const icons = {
    warning: <AlertTriangle className="w-6 h-6 text-amber-400" />,
    danger: <AlertTriangle className="w-6 h-6 text-rose-500" />,
    info: <Info className="w-6 h-6 text-sky-400" />,
  };

  const buttonColors = {
    warning: 'bg-amber-600 hover:bg-amber-500 text-white',
    danger: 'bg-rose-600 hover:bg-rose-500 text-white shadow-rose-600/30',
    info: 'bg-sky-600 hover:bg-sky-500 text-white',
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} maxWidth="max-w-md">
      <div className="flex items-start gap-4">
        <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 shrink-0">
          {icons[type] || icons.warning}
        </div>
        <p className="text-xs text-slate-300 leading-relaxed mt-1">{message}</p>
      </div>

      <div className="flex items-center justify-end gap-3 mt-6 pt-3 border-t border-slate-800">
        <button
          onClick={onClose}
          className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition-colors"
        >
          {cancelText}
        </button>
        <button
          onClick={() => {
            onConfirm();
            onClose();
          }}
          className={`px-4 py-2 rounded-xl font-bold text-xs shadow-md transition-all ${
            buttonColors[type] || buttonColors.warning
          }`}
        >
          {confirmText}
        </button>
      </div>
    </Modal>
  );
};
