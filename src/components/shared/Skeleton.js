import React from "react";

function cx(...p) {
  return p.filter(Boolean).join(" ");
}

export default function Skeleton({ className = "", width, height, rounded = "md" }) {
  const style = {};
  if (width) style.width = typeof width === "number" ? `${width}px` : width;
  if (height) style.height = typeof height === "number" ? `${height}px` : height;
  const roundedCls =
    rounded === "full"
      ? "rounded-full"
      : rounded === "lg"
        ? "rounded-lg"
        : rounded === "sm"
          ? "rounded-sm"
          : "rounded-md";
  return <div className={cx("skeleton", roundedCls, className)} style={style} />;
}

export function SkeletonText({ lines = 3, className = "" }) {
  return (
    <div className={cx("space-y-2", className)}>
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton
          key={i}
          height={12}
          className={i === lines - 1 ? "w-2/3" : "w-full"}
        />
      ))}
    </div>
  );
}
