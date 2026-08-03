import { ButtonHTMLAttributes, ReactNode } from "react";
import styles from "./Button.module.css";

export type ButtonVariant = "primary" | "secondary" | "ghost" | "danger";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  loading?: boolean;
  children: ReactNode;
}

/**
 * Reusable button with variant, loading, and disabled support.
 * Spacing is the responsibility of the parent layout, not this component.
 *
 * Variants:
 *   primary   — teal fill (default)
 *   secondary — white + border
 *   ghost     — transparent, accent text
 *   danger    — white + red border
 */
export default function Button({
  variant = "primary",
  loading = false,
  disabled,
  type = "button",
  children,
  className = "",
  ...rest
}: ButtonProps) {
  const cls = [
    styles.btn,
    styles[variant],
    loading ? styles.loading : "",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <button
      {...rest}
      type={type}
      className={cls}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
    >
      {loading && <span className={styles.spinner} aria-hidden="true" />}
      {children}
    </button>
  );
}
