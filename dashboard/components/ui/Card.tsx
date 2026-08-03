import { ElementType, HTMLAttributes, ReactNode } from "react";
import styles from "./Card.module.css";

export type CardVariant = "default" | "action" | "data" | "error" | "empty";

interface CardProps extends HTMLAttributes<HTMLElement> {
  /**
   * default — white surface, border, subtle shadow (general purpose)
   * action  — same as default + max-width 560px (workflow / form cards)
   * data    — flush padding for tables and scrollable lists
   * error   — danger surface for DB/network error messages
   * empty   — default surface for zero-data placeholder content
   */
  variant?: CardVariant;
  /**
   * Underlying HTML element. Defaults to "div".
   * Use "section", "article", or "form" for semantic accuracy.
   */
  as?: ElementType;
  children: ReactNode;
}

export default function Card({
  variant = "default",
  as: Tag = "div",
  children,
  className = "",
  ...rest
}: CardProps) {
  const cls = [
    styles.card,
    variant !== "default" ? styles[variant] : "",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <Tag className={cls} {...rest}>
      {children}
    </Tag>
  );
}
