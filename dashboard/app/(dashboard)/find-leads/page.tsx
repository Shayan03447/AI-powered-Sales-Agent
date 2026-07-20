import FindLeadsForm from "@/components/workflow/FindLeadsForm";

export default function FindLeadsPage() {
  return (
    <main className="fade-in">
      <p className="eyebrow">Step 1</p>
      <h1>Find Leads</h1>
      <p className="muted">Start a new business search — form only</p>
      <FindLeadsForm />
    </main>
  );
}
