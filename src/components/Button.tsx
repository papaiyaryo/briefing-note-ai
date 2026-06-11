import type { ButtonHTMLAttributes } from "react";

type ButtonVariant = "primary" | "secondary";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
}

const baseClassName =
  "rounded-lg px-4 py-2.5 text-sm font-medium focus-visible:ring-2 focus-visible:ring-teal-700 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50";

const variantClassName: Record<ButtonVariant, string> = {
  primary: "bg-teal-700 text-white hover:bg-teal-800",
  secondary:
    "border border-slate-200 bg-white text-slate-900 hover:bg-slate-50",
};

export function Button({
  variant = "primary",
  type = "button",
  className,
  ...props
}: ButtonProps) {
  const classNames = [baseClassName, variantClassName[variant], className]
    .filter(Boolean)
    .join(" ");
  return <button type={type} className={classNames} {...props} />;
}
