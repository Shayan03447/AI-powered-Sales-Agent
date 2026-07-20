# WF1 Webhook Fix (no try/catch, no Set From Webhook)

## Error you saw
`Referenced node doesn't exist` on `$('Set From Webhook')`

n8n cannot safely try/catch missing `$('NodeName')`.

## Correct wiring (simple)

```
Form Trigger → Set Search Parameters1 → Create Campaign → Expand Sources → Switch
Webhook      → Code — Map Webhook → Set Search Parameters1 → (same path...)
```

Both paths share **Set Search Parameters1**.  
Then Expand Sources keeps using `$('Set Search Parameters1')` only.

---

## Step-by-step in n8n

### 1) Expand Sources — ORIGINAL code wapas
`Code — Expand Sources1` mein yeh paste karo (sirf yeh):

```javascript
const cfg = $('Set Search Parameters1').first().json;
const campaignId = $('Postgres — Create Campaign1').first().json.id;
const sources = cfg.source === 'both' ? ['yelp', 'gmb'] : [cfg.source];

return sources.map((active_source) => ({
  json: {
    ...cfg,
    campaign_id: campaignId,
    active_source,
  },
}));
```

### 2) `Set From Webhook` hata do (agar banaya tha)
Us node ko disconnect/delete karo.

### 3) Naya Code node: `Code — Map Webhook to Form`
Webhook ke baad yeh Code node add karo:

```javascript
const j = $input.first().json;

return [
  {
    json: {
      "Business Type": j.business_type,
      City: j.city,
      Country: j.country || "AU",
      Source: j.source || "both",
      "Max Results": j.limit || 20,
    },
  },
];
```

### 4) Connect
```
Webhook → Code — Map Webhook to Form → Set Search Parameters1 → Postgres — Create Campaign1
```

Purana Form path mat todo:
```
Form Trigger → Set Search Parameters1
```

### 5) Publish / Activate

### 6) Test dashboard
`/campaigns` → Find Leads → campaign dikhe:
`plumber in melbourne` (empty nahi)

---

## Check in Executions
Latest run mein pehle node **Webhook** hona chahiye.  
Phir Map Webhook → Set Search Parameters1 → Create Campaign → Expand Sources → Switch → Yelp/GMB.
