type Tone = "success" | "warning" | "danger" | "neutral";

interface StatusConfig {
  label: string;
  tone: Tone;
}

/**
 * Maps every database status value to a human-readable label and a
 * semantic color tone. Add new statuses here — never expose raw DB
 * keys to users. The raw key is preserved in the title attribute for
 * support/debugging.
 */
const STATUS_MAP: Record<string, StatusConfig> = {
  new:            { label: "New",          tone: "neutral"  },
  enriching:      { label: "Enriching",    tone: "warning"  },
  enriched:       { label: "Enriched",     tone: "success"  },
  pending_review: { label: "Needs Review", tone: "warning"  },
  auditing:       { label: "Drafting",     tone: "warning"  },
  approved:       { label: "Approved",     tone: "success"  },
  sending:        { label: "Sending",      tone: "warning"  },
  sent:           { label: "Sent",         tone: "success"  },
  completed:      { label: "Completed",    tone: "success"  },
  running:        { label: "Running",      tone: "warning"  },
  rejected:       { label: "Rejected",     tone: "danger"   },
  no_email:       { label: "No Email",     tone: "neutral"  },
  no_website:     { label: "No Website",   tone: "neutral"  },
  enrich_failed:  { label: "Failed",       tone: "danger"   },
  send_failed:    { label: "Failed",       tone: "danger"   },
  audit_failed:   { label: "Failed",       tone: "danger"   },
  error:          { label: "Error",        tone: "danger"   },
  failed:         { label: "Failed",       tone: "danger"   },
};

export default function StatusBadge({ status }: { status: string }) {
  const key = (status ?? "unknown").toLowerCase();
  const config = STATUS_MAP[key] ?? { label: status || "Unknown", tone: "neutral" as Tone };

  return (
    <span
      className={`badge badge-${config.tone}`}
      title={status}
    >
      {config.label}
    </span>
  );
}
