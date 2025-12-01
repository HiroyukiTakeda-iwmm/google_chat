import React from 'react';
import { X } from 'lucide-react';

interface ModalProps {
  isOpen: boolean;
  onClose?: () => void;
  title?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl';
}

export const Modal: React.FC<ModalProps> = ({ 
  isOpen, 
  onClose, 
  title, 
  children, 
  footer,
  maxWidth = 'md'
}) => {
  if (!isOpen) return null;

  const maxWidthClasses = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl'
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-screen items-center justify-center p-4 text-center">
        {/* Backdrop */}
        <div 
          className="fixed inset-0 bg-black/50 transition-opacity backdrop-blur-sm"
          onClick={onClose}
        ></div>

        {/* Panel */}
        <div className={`relative transform overflow-hidden rounded-2xl bg-white text-left shadow-xl transition-all w-full ${maxWidthClasses[maxWidth]} animate-in fade-in zoom-in-95 duration-200`}>
          {/* Header */}
          {(title || onClose) && (
            <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
              {title && <h3 className="text-lg font-semibold leading-6 text-gray-900">{title}</h3>}
              {onClose && (
                <button
                  type="button"
                  className="rounded-full p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-500 transition-colors"
                  onClick={onClose}
                >
                  <X className="h-5 w-5" />
                </button>
              )}
            </div>
          )}

          {/* Content */}
          <div className="px-6 py-6">
            {children}
          </div>

          {/* Footer */}
          {footer && (
            <div className="bg-gray-50 px-6 py-4 flex flex-row-reverse gap-3">
              {footer}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};