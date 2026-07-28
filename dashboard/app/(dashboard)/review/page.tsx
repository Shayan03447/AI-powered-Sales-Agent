import { redirect } from "next/navigation";

/** Old Part 5 route — review actions live on /drafts now */
export default function ReviewPage() {
  redirect("/drafts");
}
