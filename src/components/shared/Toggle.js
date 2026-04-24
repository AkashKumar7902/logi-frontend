import React from "react";

function cx(...p) {
  return p.filter(Boolean).join(" ");
}

const Toggle = React.forwardRef(function Toggle(
  { checked = false, onChange, disabled = false, className = "", ...rest },
  ref,
) {
  return (
    <button
      ref={ref}
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => !disabled && onChange?.(!checked)}
      className={cx(
        "relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full transition-colors duration-200",
        "focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2",
        disabled && "opacity-50 cursor-not-allowed",
        checked ? "bg-success-500" : "bg-ink-300 dark:bg-ink-600",
        className,
      )}
      {...rest}
    >
      <span
        aria-hidden="true"
        className={cx(
          "inline-block h-5 w-5 rounded-full bg-white shadow transform transition-transform duration-200",
          checked ? "translate-x-5" : "translate-x-0.5",
        )}
      />
    </button>
  );
});

export default Toggle;
