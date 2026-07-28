import { NextResponse } from "next/server";
import { query } from "@/lib/db";

type ReviewAction = "approve" | "reject" | "edit";

type LeadRow = {
  id: number;
  status: string;
  email_subject: string | null;
  personalized_email: string | null;
};

/**
 * Part 5 — human review for AI drafts.
 * POST { action: "approve" | "reject" | "edit", subject?, body?, reason? }
 */
export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id: idParam } = await context.params;
    const leadId = Number(idParam);
    if (!Number.isFinite(leadId) || leadId <= 0) {
      return NextResponse.json(
        { ok: false, error: "Invalid lead id" },
        { status: 400 }
      );
    }

    const body = await request.json().catch(() => ({}));
    const action = String(body.action || "").toLowerCase() as ReviewAction;

    if (!["approve", "reject", "edit"].includes(action)) {
      return NextResponse.json(
        { ok: false, error: "action must be approve, reject, or edit" },
        { status: 400 }
      );
    }

    const leads = await query<LeadRow>(
      `SELECT id, status, email_subject, personalized_email
       FROM leads
       WHERE id = $1`,
      [leadId]
    );
    const lead = leads[0];
    if (!lead) {
      return NextResponse.json(
        { ok: false, error: "Lead not found" },
        { status: 404 }
      );
    }

    if (lead.status !== "pending_review") {
      return NextResponse.json(
        {
          ok: false,
          error: `Lead status is "${lead.status}" — only pending_review can be reviewed`,
        },
        { status: 409 }
      );
    }

    if (action === "edit") {
      const subject = String(body.subject ?? "").trim();
      const emailBody = String(body.body ?? "").trim();

      if (!subject || !emailBody) {
        return NextResponse.json(
          { ok: false, error: "Subject and body are required to save edits" },
          { status: 400 }
        );
      }

      await query(
        `UPDATE leads
         SET email_subject = $1,
             personalized_email = $2,
             updated_at = NOW()
         WHERE id = $3
           AND status = 'pending_review'`,
        [subject, emailBody, leadId]
      );

      await syncDraftRow(leadId, {
        subject,
        body: emailBody,
        draftStatus: "draft",
      });

      return NextResponse.json({
        ok: true,
        action: "edit",
        lead_id: leadId,
        status: "pending_review",
        message: "Draft updated. Approve when ready.",
      });
    }

    if (action === "approve") {
      // Optional: save edits in the same approve click
      const subjectRaw = body.subject;
      const bodyRaw = body.body;
      if (subjectRaw != null || bodyRaw != null) {
        const subject = String(subjectRaw ?? lead.email_subject ?? "").trim();
        const emailBody = String(
          bodyRaw ?? lead.personalized_email ?? ""
        ).trim();
        if (!subject || !emailBody) {
          return NextResponse.json(
            { ok: false, error: "Cannot approve empty subject or body" },
            { status: 400 }
          );
        }
        await query(
          `UPDATE leads
           SET email_subject = $1,
               personalized_email = $2,
               updated_at = NOW()
           WHERE id = $3
             AND status = 'pending_review'`,
          [subject, emailBody, leadId]
        );
        await syncDraftRow(leadId, {
          subject,
          body: emailBody,
          draftStatus: "approved",
        });
      } else {
        await syncDraftRow(leadId, { draftStatus: "approved" });
      }

      const updated = await query<LeadRow>(
        `UPDATE leads
         SET status = 'approved',
             failure_reason = NULL,
             updated_at = NOW()
         WHERE id = $1
           AND status = 'pending_review'
         RETURNING id, status, email_subject, personalized_email`,
        [leadId]
      );

      if (!updated[0]) {
        return NextResponse.json(
          { ok: false, error: "Could not approve — status may have changed" },
          { status: 409 }
        );
      }

      return NextResponse.json({
        ok: true,
        action: "approve",
        lead_id: leadId,
        status: "approved",
        message: "Approved — queued until email send is enabled.",
      });
    }

    // reject
    const reason = String(body.reason ?? "").trim() || "Rejected by reviewer";

    await syncDraftRow(leadId, { draftStatus: "rejected" });

    const updated = await query<LeadRow>(
      `UPDATE leads
       SET status = 'rejected',
           failure_reason = $1,
           updated_at = NOW()
       WHERE id = $2
         AND status = 'pending_review'
       RETURNING id, status`,
      [reason, leadId]
    );

    if (!updated[0]) {
      return NextResponse.json(
        { ok: false, error: "Could not reject — status may have changed" },
        { status: 409 }
      );
    }

    return NextResponse.json({
      ok: true,
      action: "reject",
      lead_id: leadId,
      status: "rejected",
      message: "Rejected — this lead will not be sent.",
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}

async function syncDraftRow(
  leadId: number,
  opts: {
    subject?: string;
    body?: string;
    draftStatus: "draft" | "approved" | "rejected";
  }
) {
  const existing = await query<{ id: number }>(
    `SELECT id
     FROM email_drafts
     WHERE lead_id = $1
     ORDER BY id DESC
     LIMIT 1`,
    [leadId]
  );

  if (existing[0]) {
    if (opts.subject != null && opts.body != null) {
      await query(
        `UPDATE email_drafts
         SET subject = $1,
             body = $2,
             status = $3,
             updated_at = NOW()
         WHERE id = $4`,
        [opts.subject, opts.body, opts.draftStatus, existing[0].id]
      );
    } else {
      await query(
        `UPDATE email_drafts
         SET status = $1,
             updated_at = NOW()
         WHERE id = $2`,
        [opts.draftStatus, existing[0].id]
      );
    }
    return;
  }

  // No email_drafts row yet — create one if we have text on the lead
  const lead = await query<{
    email_subject: string | null;
    personalized_email: string | null;
  }>(
    `SELECT email_subject, personalized_email FROM leads WHERE id = $1`,
    [leadId]
  );
  const subject = opts.subject ?? lead[0]?.email_subject ?? "";
  const body = opts.body ?? lead[0]?.personalized_email ?? "";
  if (!subject || !body) return;

  await query(
    `INSERT INTO email_drafts (lead_id, subject, body, status, created_at, updated_at)
     VALUES ($1, $2, $3, $4, NOW(), NOW())`,
    [leadId, subject, body, opts.draftStatus]
  );
}
