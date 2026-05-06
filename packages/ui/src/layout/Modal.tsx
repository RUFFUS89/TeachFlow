"use client";

import { useEffect, useRef, type ReactNode } from "react";

import { cn } from "../cn";
import { Icon } from "../primitives/Icon";

export interface ModalProps {
  open: boolean;
  onClose: () => void;
  title?: ReactNode;
  description?: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
  size?: "sm" | "md" | "lg";
  className?: string;
}

const SIZE_CLASSES = {
  sm: "max-w-md",
  md: "max-w-xl",
  lg: "max-w-3xl",
} as const;

export function Modal({
  open,
  onClose,
  title,
  description,
  children,
  footer,
  size = "md",
  className,
}: ModalProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  return (
    <dialog
      ref={dialogRef}
      onClose={onClose}
      onClick={(event) => {
        if (event.target === dialogRef.current) onClose();
      }}
      className={cn(
        "rounded-card border border-border bg-surface p-0 backdrop:bg-ink/40 backdrop:backdrop-blur-sm",
        "w-full",
        SIZE_CLASSES[size],
        className,
      )}
    >
      <div className="flex items-start justify-between border-b border-border px-6 py-4">
        <div className="flex flex-col gap-1">
          {title && <h2 className="font-display text-lg text-ink">{title}</h2>}
          {description && <p className="text-sm text-inkMuted">{description}</p>}
        </div>
        <button
          type="button"
          onClick={onClose}
          className="-mr-1 inline-flex size-8 items-center justify-center rounded-pill text-inkMuted hover:bg-surface2"
          aria-label="Fechar"
        >
          <Icon name="error" size={18} />
        </button>
      </div>
      <div className="px-6 py-5">{children}</div>
      {footer && <div className="flex justify-end gap-2 border-t border-border px-6 py-4">{footer}</div>}
    </dialog>
  );
}
