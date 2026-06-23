/**
 * Shared voice handler logic — used by n8n Code nodes and e2e tests.
 */

const BIKE_KEYWORDS = [
  'm1000rr', 'm 1000 rr', 'zx-10r', 'zx10r', 'panigale', 'ninja', 'hayabusa',
  'gsx-r', 'cbr', 'r1', 'mt-09', 'rebel', 'street glide', 'speed triple',
  'rsv4', 'super duke', 's1000rr', 'ryker', 'rzr', 'ducati', 'bmw', 'kawasaki',
  'yamaha', 'honda', 'suzuki', 'harley', 'triumph', 'aprilia', 'ktm', 'can-am', 'polaris'
];

function extractSearchTerms(transcript) {
  if (!transcript) return [];
  const lower = transcript.toLowerCase();
  const terms = new Set();
  for (const kw of BIKE_KEYWORDS) {
    if (lower.includes(kw)) terms.add(kw.replace(/\s+/g, ''));
  }
  // Also grab alphanumeric tokens 3+ chars (model numbers)
  const tokens = lower.match(/[a-z0-9-]{3,}/g) || [];
  for (const t of tokens) {
    if (t.length >= 4) terms.add(t);
  }
  return [...terms].slice(0, 5);
}

function buildInventoryWhereClause(terms) {
  if (!terms.length) {
    return { clause: "status = 'available'", params: [] };
  }
  const conditions = terms.map((_, i) =>
    `(make ILIKE $${i + 1} OR model ILIKE $${i + 1} OR stock_no ILIKE $${i + 1})`
  );
  const params = terms.map(t => `%${t}%`);
  return {
    clause: `status = 'available' AND (${conditions.join(' OR ')})`,
    params
  };
}

function escapeXml(str) {
  return String(str || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function buildGatherTwiml({ say, webhookUrl }) {
  const url = escapeXml(webhookUrl);
  const text = escapeXml(say);
  return `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Gather input="speech" action="${url}" method="POST" speechTimeout="auto" language="en-US">
    <Say voice="Polly.Joanna">${text}</Say>
  </Gather>
  <Say voice="Polly.Joanna">We did not receive any input. Goodbye.</Say>
</Response>`;
}

function buildSayTwiml({ say }) {
  return `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say voice="Polly.Joanna">${escapeXml(say)}</Say>
  <Hangup/>
</Response>`;
}

function buildTransferTwiml({ say, repPhone, webhookUrl }) {
  const url = escapeXml(webhookUrl);
  return `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say voice="Polly.Joanna">${escapeXml(say)}</Say>
  <Dial>${escapeXml(repPhone)}</Dial>
</Response>`;
}

function buildSystemPrompt({ inventory, priorSummary, history, transcript }) {
  const invJson = JSON.stringify(inventory, null, 2);
  const histText = history.map(h => `${h.role}: ${h.content}`).join('\n');
  return `You are Hill Thrill Motoplex AI sales assistant in Houston, Texas.
Store hours: Monday through Saturday, 9:30 AM to 7:30 PM.

INVENTORY (available units only):
${invJson}

CUSTOMER PRIOR SUMMARY:
${priorSummary || 'First-time caller'}

CONVERSATION SO FAR:
${histText || '(call just started)'}

RULES:
- Keep replies to 1-2 short spoken sentences for a phone call.
- If a bike is in stock, share price and mileage, then ask one qualifying question (timeline, trade-in, or financing).
- Ask at most 2-3 qualifying questions total before booking or transfer.
- action must be one of: continue, book_ride, transfer, end
- qualification_hint must be one of: hot, warm, cold, unknown
- If customer wants a human, use action transfer.
- If customer confirms a test ride or visit, use action book_ride.
- If conversation is done, use action end.

Respond ONLY with valid JSON:
{"reply":"...","action":"continue|book_ride|transfer|end","vehicle_interest":"...","qualification_hint":"hot|warm|cold|unknown"}`;
}

function parseAiResponse(raw) {
  const cleaned = raw.replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/```\s*$/i, '').trim();
  const parsed = JSON.parse(cleaned);
  const action = ['continue', 'book_ride', 'transfer', 'end'].includes(parsed.action) ? parsed.action : 'continue';
  return {
    reply: String(parsed.reply || 'How can I help you with our inventory today?').trim(),
    action,
    vehicle_interest: String(parsed.vehicle_interest || '').trim(),
    qualification_hint: parsed.qualification_hint || 'unknown',
    parse_ok: true
  };
}

function buildClassificationPrompt({ transcript, vehicleInterest }) {
  return `Classify this dealership sales call lead.

Vehicle interest: ${vehicleInterest || 'unknown'}

Full transcript:
${transcript}

Return ONLY valid JSON:
{"qualification":"hot|warm|cold","summary":"2-3 sentence rep briefing","appointment_requested":true|false}`;
}

module.exports = {
  BIKE_KEYWORDS,
  extractSearchTerms,
  buildInventoryWhereClause,
  escapeXml,
  buildGatherTwiml,
  buildSayTwiml,
  buildTransferTwiml,
  buildSystemPrompt,
  parseAiResponse,
  buildClassificationPrompt
};
