import React from "react";

function cx(...p) {
  return p.filter(Boolean).join(" ");
}

let uid = 0;
function useId(prefix = "sel") {
  const [id] = React.useState(() => `${prefix}-${++uid}`);
  return id;
}

const Select = React.forwardRef(function Select(
  {
    label,
    error,
    hint,
    id,
    className = "",
    containerClassName = "",
    children,
    ...rest
  },
  ref,
) {
  const autoId = useId("sel");
  const selId = id || autoId;
  const describedBy = error ? `${selId}-err` : hint ? `${selId}-hint` : undefined;

  return (
    <div className={cx("flex flex-col gap-1.5", containerClassName)}>
      {label && (
        <label htmlFor={selId} className="text-sm font-medium text-ink-700 dark:text-ink-200">
          {label}
        </label>
      )}
      <div
        className={cx(
          "relative flex items-center rounded-lg border bg-white dark:bg-ink-800 transition-shadow",
          error
            ? "border-danger-500 focus-within:shadow-focus focus-within:border-danger-500"
            : "border-ink-200 dark:border-ink-700 focus-within:border-brand-500 focus-within:shadow-focus",
        )}
      >
        <select
          ref={ref}
          id={selId}
          aria-invalid={!!error || undefined}
          aria-describedby={describedBy}
          className={cx(
            "w-full appearance-none bg-transparent pl-3 pr-9 h-10 text-sm text-ink-900 dark:text-ink-50 outline-none rounded-lg",
            className,
          )}
          {...rest}
        >
          {children}
        </select>
        <svg
          aria-hidden="true"
          className="pointer-events-none absolute right-3 h-4 w-4 text-ink-400"
          viewBox="0 0 20 20"
          fill="currentColor"
        >
          <path
            fillRule="evenodd"
            d="M5.23 7.21a.75.75 0 011.06.02L10 11.06l3.71-3.83a.75.75 0 111.08 1.04l-4.25 4.4a.75.75 0 01-1.08 0l-4.25-4.4a.75.75 0 01.02-1.06z"
            clipRule="evenodd"
          />
        </svg>
      </div>
      {error ? (
        <p id={`${selId}-err`} className="text-xs text-danger-600 dark:text-danger-500">
          {error}
        </p>
      ) : hint ? (
        <p id={`${selId}-hint`} className="text-xs text-ink-500 dark:text-ink-400">
          {hint}
        </p>
      ) : null}
    </div>
  );
});

export default Select;
