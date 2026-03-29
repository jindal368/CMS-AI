import { getSessionFromCookies } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function RootPage() {
  const session = await getSessionFromCookies();
  if (session) redirect("/dashboard");
  redirect("/login");
}
