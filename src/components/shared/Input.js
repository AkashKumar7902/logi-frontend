import React from "react";

function cx(...p) {
  return p.filter(Boolean).join(" ");
}

let uid = 0;
function useId(prefix = "inp") {
  const [id] = React.useState(() => `${prefix}-${++uid}`);
  return id;
}

const Input = React.forwardRef(function Input(
  {
    label,
    error,
    hint,
    id,
    className = "",
    containerClassName = "",
    leftAddon,
    rightAddon,
    type = "text",
    ...rest
  },
  ref,
) {
  const autoId = useId("inp");
  const inputId = id || autoId;
  const describedBy = error ? `${inputId}-err` : hint ? `${inputId}-hint` : undefined;

  return (
    <div className={cx("flex flex-col gap-1.5", containerClassName)}>
      {label && (
        <label htmlFor={inputId} className="text-sm font-medium text-ink-700 dark:text-ink-200">
          {label}
        </label>
      )}
      <div
        className={cx(
          "flex items-center rounded-lg border bg-white dark:bg-ink-800 transition-shadow",
          error
            ? "border-danger-500 focus-within:shadow-focus focus-within:border-danger-500"
            : "border-ink-200 dark:border-ink-700 focus-within:border-brand-500 focus-within:shadow-focus",
        )}
      >
        {leftAddon && (
          <span className="pl-3 text-ink-400 dark:text-ink-400 flex items-center">{leftAddon}</span>
        )}
        <input
          ref={ref}
          id={inputId}
          type={type}
          aria-invalid={!!error || undefined}
          aria-describedby={describedBy}
          className={cx(
            "flex-1 bg-transparent px-3 h-10 text-sm text-ink-900 dark:text-ink-50 placeholder-ink-400 dark:placeholder-ink-500 outline-none rounded-lg",
            className,
          )}
          {...rest}
        />
        {rightAddon && (
          <span className="pr-3 text-ink-400 dark:text-ink-400 flex items-center">{rightAddon}</span>
        )}
      </div>
      {error ? (
        <p id={`${inputId}-err`} className="text-xs text-danger-600 dark:text-danger-500">
          {error}
        </p>
      ) : hint ? (
        <p id={`${inputId}-hint`} className="text-xs text-ink-500 dark:text-ink-400">
          {hint}
        </p>
      ) : null}
    </div>
  );
});

export default Input;
