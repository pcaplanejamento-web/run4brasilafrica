import { ContentProvider } from "@/lib/content/store";
import { AuthProvider } from "@/components/admin/AuthProvider";
import AdminShell from "@/components/admin/AdminShell";

/**
 * Layout for authenticated ADM pages: gates on the session (AuthProvider),
 * provides the editable content store, and the responsive sidebar chrome.
 * (Login lives outside this group.)
 */
export default function PainelLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthProvider>
      <ContentProvider>
        <AdminShell>{children}</AdminShell>
      </ContentProvider>
    </AuthProvider>
  );
}
