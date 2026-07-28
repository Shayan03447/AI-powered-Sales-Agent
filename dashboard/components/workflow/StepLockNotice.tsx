import Link from "next/link";

type Props = {
  locked: boolean;
  title: string;
  reason: string;
  href?: string;
  linkLabel?: string;
};

/** Clear “step locked” banner when previous pipeline stage has no ready leads */
export default function StepLockNotice({
  locked,
  title,
  reason,
  href,
  linkLabel,
}: Props) {
  if (!locked) return null;

  return (
    <div className="banner banner-locked">
      <strong>{title}</strong>
      <p>{reason}</p>
      {href && linkLabel && (
        <Link href={href} className="btn-link">
          {linkLabel}
        </Link>
      )}
    </div>
  );
}
