import styles from "./Spinner.module.css";

type SpinnerSize = "sm" | "md" | "lg";

interface SpinnerProps {
  size?: SpinnerSize;
  /** Additional class for colour override via CSS (e.g. `style={{ color: "var(--accent)" }}`) */
  className?: string;
  label?: string;
}

/**
 * Standalone spinner for non-button loading contexts.
 * Button has its own scoped spinner — use this one inside WorkflowProgress,
 * page-level loaders, and any other async indicator.
 */
export default function Spinner({
  size = "md",
  className = "",
  label = "Loading",
}: SpinnerProps) {
  return (
    <span
      className={[styles.spinner, styles[size], className].filter(Boolean).join(" ")}
      role="status"
      aria-label={label}
    />
  );
}
