import FindLeadsForm from "@/components/workflow/FindLeadsForm";

export const metadata = { title: "Find Leads — Atrium Reach" };

export default function FindLeadsPage() {
  return (
    <main className="fade-in">
      <p className="eyebrow">Step 1</p>
      <h1>Find Leads</h1>
      <p className="muted">Search for businesses and add them to your pipeline.</p>
      <FindLeadsForm />
    </main>
  );
}
