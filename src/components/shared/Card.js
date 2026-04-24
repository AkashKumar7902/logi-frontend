import React from "react";

function cx(...p) {
  return p.filter(Boolean).join(" ");
}

export function Card({ className = "", children, ...rest }) {
  return (
    <div
      className={cx(
        "bg-white dark:bg-ink-800 rounded-xl border border-ink-100 dark:border-ink-700 shadow-card",
        className,
      )}
      {...rest}
    >
      {children}
    </div>
  );
}

export function CardHeader({ className = "", children, ...rest }) {
  return (
    <div
      className={cx(
        "px-5 py-4 border-b border-ink-100 dark:border-ink-700 flex items-center justify-between gap-3",
        className,
      )}
      {...rest}
    >
      {children}
    </div>
  );
}

export function CardTitle({ className = "", children, ...rest }) {
  return (
    <h3 className={cx("text-base font-semibold text-ink-900 dark:text-ink-50", className)} {...rest}>
      {children}
    </h3>
  );
}

export function CardBody({ className = "", children, ...rest }) {
  return (
    <div className={cx("p-5", className)} {...rest}>
      {children}
    </div>
  );
}

export function CardFooter({ className = "", children, ...rest }) {
  return (
    <div
      className={cx(
        "px-5 py-4 border-t border-ink-100 dark:border-ink-700 flex items-center justify-end gap-2",
        className,
      )}
      {...rest}
    >
      {children}
    </div>
  );
}

export default Card;
