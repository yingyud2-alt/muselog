import { redirect } from "next/navigation";

/** Journal lives at /calendar — keep /journal as a friendly alias. */
export default function JournalPage() {
  redirect("/calendar");
}
