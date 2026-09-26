import React from 'react';
import { AlertTriangle, X } from 'lucide-react';

interface ConfirmModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  impactText?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
  isDestructive?: boolean;
}

export const ConfirmModal: React.FC<ConfirmModalProps> = ({
  isOpen,
  title,
  message,
  impactText,
  confirmLabel = 'Confirmer',
  cancelLabel = 'Annuler',
  onConfirm,
  onCancel,
  isDestructive = true,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
      <div className="bg-white border border-slate-200 rounded-lg max-w-md w-full p-5 shadow-xl relative">
        <button
          onClick={onCancel}
          className="absolute top-3.5 right-3.5 text-slate-400 hover:text-slate-600 transition-colors p-1"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="flex items-start gap-3.5">
          <div
            className={`p-2.5 rounded-md ${
              isDestructive ? 'bg-red-50 text-red-600 border border-red-200' : 'bg-orange-50 text-orange-600 border border-orange-200'
            } shrink-0`}
          >
            <AlertTriangle className="w-5 h-5" />
          </div>

          <div className="flex-1">
            <h3 className="text-sm font-bold text-slate-900">{title}</h3>
            <p className="mt-1.5 text-xs text-slate-600 leading-relaxed">{message}</p>

            {impactText && (
              <div className="mt-3 p-2.5 bg-slate-50 rounded border border-slate-200 text-xs text-slate-600">
                <span className="font-semibold text-slate-800">Impact : </span>
                {impactText}
              </div>
            )}

            <div className="mt-5 flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={onCancel}
                className="px-3.5 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-100 rounded-md transition-colors"
              >
                {cancelLabel}
              </button>

              <button
                type="button"
                onClick={onConfirm}
                className={`px-3.5 py-1.5 text-xs font-semibold text-white rounded-md transition-colors shadow-2xs ${
                  isDestructive
                    ? 'bg-red-600 hover:bg-red-700'
                    : 'bg-orange-600 hover:bg-orange-700'
                }`}
              >
                {confirmLabel}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
