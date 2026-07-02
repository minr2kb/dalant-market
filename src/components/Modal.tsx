"use client";

import type { ReactNode } from "react";

interface ModalProps {
  children: ReactNode;
  onClose?: () => void;
  className?: string;
}

export function Modal({ children, onClose, className = "" }: ModalProps) {
  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-6 animate-in fade-in duration-200 ${className}`}
      onClick={onClose}
    >
      <div
        className="w-full max-w-sm rounded-3xl bg-white dark:bg-gray-900 animate-in slide-in-from-bottom-4 fade-in duration-200 ease-out max-h-[90dvh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {children}
      </div>
    </div>
  );
}
