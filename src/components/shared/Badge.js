import React from "react";

function cx(...p) {
  return p.filter(Boolean).join(" ");
}

const tones = {
  neutral: "bg-ink-100 text-ink-700 dark:bg-ink-700 dark:text-ink-100",
  brand: "bg-brand-50 text-brand-700 dark:bg-brand-500/15 dark:text-brand-200",
  success: "bg-success-50 text-success-700 dark:bg-success-500/15 dark:text-success-500",
  warning: "bg-warning-50 text-warning-600 dark:bg-warning-500/15 dark:text-warning-500",
  danger: "bg-danger-50 text-danger-700 dark:bg-danger-500/15 dark:text-danger-500",
};

const dotTones = {
  neutral: "bg-ink-400",
  brand: "bg-brand-500",
  success: "bg-success-500",
  warning: "bg-warning-500",
  danger: "bg-danger-500",
};

export default function Badge({
  tone = "neutral",
  dot = false,
  className = "",
  children,
}) {
  return (
    <span
      className={cx(
        "inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium",
        tones[tone] || tones.neutral,
        className,
      )}
    >
      {dot && (
        <span className={cx("h-1.5 w-1.5 rounded-full", dotTones[tone] || dotTones.neutral)} />
      )}
      {children}
    </span>
  );
}
