import { getSessionOrRedirect } from "@/lib/auth";
import SidebarNav from "@/components/sidebar-nav";
import TopBar from "@/components/top-bar";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, org } = await getSessionOrRedirect();

  const plainUser = {
    name: user.name as string,
    role: user.role as string,
    email: user.email as string,
  };

  const plainOrg = org
    ? {
        name: org.name as string,
        slug: org.slug as string,
      }
    : undefined;

  return (
    <div className="flex h-screen overflow-hidden">
      <SidebarNav user={plainUser} />
      <div className="flex flex-col flex-1 overflow-hidden">
        <TopBar user={plainUser} org={plainOrg} />
        <main className="flex-1 overflow-y-auto p-8">{children}</main>
      </div>
    </div>
  );
}
