import React from "react";

const base =
  "inline-flex items-center justify-center gap-2 font-medium rounded-lg transition-all duration-150 disabled:opacity-50 disabled:cursor-not-allowed select-none whitespace-nowrap";

const variants = {
  primary:
    "bg-brand-600 text-white hover:bg-brand-700 active:bg-brand-800 shadow-sm dark:bg-brand-500 dark:hover:bg-brand-400",
  secondary:
    "bg-white text-ink-800 border border-ink-200 hover:bg-ink-50 hover:border-ink-300 active:bg-ink-100 dark:bg-ink-800 dark:text-ink-100 dark:border-ink-700 dark:hover:bg-ink-700 dark:hover:border-ink-600 dark:active:bg-ink-700",
  ghost:
    "bg-transparent text-ink-700 hover:bg-ink-100 active:bg-ink-200 dark:text-ink-200 dark:hover:bg-ink-700 dark:active:bg-ink-600",
  danger:
    "bg-danger-600 text-white hover:bg-danger-700 active:bg-danger-700 shadow-sm dark:bg-danger-500 dark:hover:bg-danger-600",
  success:
    "bg-success-600 text-white hover:bg-success-700 active:bg-success-700 shadow-sm dark:bg-success-500 dark:hover:bg-success-600",
  link:
    "bg-transparent text-brand-600 hover:text-brand-700 hover:underline p-0 rounded-none dark:text-brand-400 dark:hover:text-brand-300",
};

const sizes = {
  sm: "h-8 px-3 text-sm",
  md: "h-10 px-4 text-sm",
  lg: "h-12 px-6 text-base",
};

function cx(...parts) {
  return parts.filter(Boolean).join(" ");
}

const Button = React.forwardRef(function Button(
  {
    as: Comp = "button",
    variant = "primary",
    size = "md",
    fullWidth = false,
    loading = false,
    leftIcon,
    rightIcon,
    className = "",
    children,
    disabled,
    type,
    ...rest
  },
  ref,
) {
  const isButton = Comp === "button";
  return (
    <Comp
      ref={ref}
      type={isButton ? type || "button" : undefined}
      disabled={isButton ? disabled || loading : undefined}
      aria-busy={loading || undefined}
      className={cx(
        base,
        variants[variant] || variants.primary,
        variant === "link" ? "" : sizes[size] || sizes.md,
        fullWidth && "w-full",
        className,
      )}
      {...rest}
    >
      {loading ? (
        <span className="inline-block h-4 w-4 rounded-full border-2 border-white/40 border-t-white animate-spin" />
      ) : (
        leftIcon && <span className="inline-flex">{leftIcon}</span>
      )}
      {children}
      {!loading && rightIcon && <span className="inline-flex">{rightIcon}</span>}
    </Comp>
  );
});

export default Button;
