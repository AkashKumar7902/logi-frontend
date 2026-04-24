import React from "react";

function cx(...p) {
  return p.filter(Boolean).join(" ");
}

const sizeMap = {
  sm: "max-w-sm",
  md: "max-w-md",
  lg: "max-w-2xl",
  xl: "max-w-4xl",
};

export default function Modal({
  open,
  onClose,
  title,
  children,
  footer,
  size = "md",
  closeOnBackdrop = true,
}) {
  React.useEffect(() => {
    if (!open) return;
    const onKey = (e) => {
      if (e.key === "Escape") onClose?.();
    };
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink-900/50 backdrop-blur-sm animate-fade-in"
      role="dialog"
      aria-modal="true"
      onMouseDown={(e) => {
        if (closeOnBackdrop && e.target === e.currentTarget) onClose?.();
      }}
    >
      <div
        className={cx(
          "w-full bg-white dark:bg-ink-800 rounded-2xl shadow-pop border border-ink-100 dark:border-ink-700 overflow-hidden",
          sizeMap[size] || sizeMap.md,
        )}
      >
        {title && (
          <div className="px-5 py-4 border-b border-ink-100 dark:border-ink-700 flex items-center justify-between">
            <h3 className="text-base font-semibold text-ink-900 dark:text-ink-50">{title}</h3>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close"
              className="p-1 rounded-md text-ink-400 hover:text-ink-700 hover:bg-ink-100 dark:hover:text-ink-100 dark:hover:bg-ink-700"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>
        )}
        <div className="p-5 text-ink-800 dark:text-ink-100">{children}</div>
        {footer && (
          <div className="px-5 py-4 border-t border-ink-100 dark:border-ink-700 flex items-center justify-end gap-2 bg-ink-50 dark:bg-ink-900/60">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}
