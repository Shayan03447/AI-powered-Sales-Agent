# OpenAI 429 Debug (n8n Code node)

Use this instead of the simple key test. It returns the **real OpenAI error body**
(rate_limit vs insufficient_quota vs invalid_key).

## Setup
Manual Trigger → Code (paste below) → Execute

## Code

```javascript
const apiKey = $env.OPENAI_API_KEY;

if (!apiKey) {
  return [{
    json: {
      ok: false,
      status: 'MISSING_KEY',
      message: 'OPENAI_API_KEY not found in n8n env',
    },
  }];
}

const keyHint = String(apiKey).slice(-4);

try {
  const response = await this.helpers.httpRequest({
    method: 'POST',
    url: 'https://api.openai.com/v1/chat/completions',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: {
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: 'Say KEY_OK' }],
      max_tokens: 5,
      temperature: 0,
    },
    json: true,
    timeout: 30000,
    returnFullResponse: true,
  });

  const text = String(
    response?.body?.choices?.[0]?.message?.content ||
      response?.choices?.[0]?.message?.content ||
      ''
  ).trim();

  return [{
    json: {
      ok: true,
      status: 'SUCCESS',
      key_last4: keyHint,
      reply: text,
      ratelimit_headers: {
        limit_requests: response?.headers?.['x-ratelimit-limit-requests'],
        remaining_requests: response?.headers?.['x-ratelimit-remaining-requests'],
        reset_requests: response?.headers?.['x-ratelimit-reset-requests'],
        limit_tokens: response?.headers?.['x-ratelimit-limit-tokens'],
        remaining_tokens: response?.headers?.['x-ratelimit-remaining-tokens'],
      },
    },
  }];
} catch (error) {
  let statusCode = null;
  let openaiType = null;
  let openaiCode = null;
  let openaiMessage = null;
  let raw = String(error.message || error);

  try {
    // n8n often puts response in error.cause / error.response
    const resp = error.response || error.cause || {};
    statusCode = resp.statusCode || resp.status || null;
    const data = resp.body || resp.data || {};
    const errObj = data.error || data || {};
    openaiType = errObj.type || null;
    openaiCode = errObj.code || null;
    openaiMessage = errObj.message || null;
  } catch (_e) {}

  // Fallback: parse JSON from message string if present
  if (!openaiMessage) {
    const match = raw.match(/\{[\s\S]*\}/);
    if (match) {
      try {
        const parsed = JSON.parse(match[0]);
        openaiType = parsed?.error?.type || null;
        openaiCode = parsed?.error?.code || null;
        openaiMessage = parsed?.error?.message || null;
      } catch (_e) {}
    }
  }

  let status = 'ERROR';
  if (statusCode === 401 || raw.includes('401')) status = 'INVALID_KEY';
  else if (statusCode === 429 || raw.includes('429')) status = 'RATE_LIMIT';
  else if (
    String(openaiCode || '').includes('quota') ||
    String(openaiMessage || '').toLowerCase().includes('quota')
  ) {
    status = 'QUOTA';
  }

  return [{
    json: {
      ok: false,
      status,
      key_last4: keyHint,
      http_status: statusCode,
      openai_type: openaiType,
      openai_code: openaiCode,
      openai_message: openaiMessage,
      raw_message: raw.slice(0, 400),
    },
  }];
}
```

## What to send me
Copy these fields only (not your key):

- `status`
- `key_last4`
- `http_status`
- `openai_type`
- `openai_code`
- `openai_message`

## Quick meaning

| openai_code / message | Meaning |
|---|---|
| `rate_limit_exceeded` | True rate limit |
| `insufficient_quota` | Billing/quota (often looks like 429) |
| `invalid_api_key` | Wrong key |
| empty + only 429 | Need full body; try again with this node |
