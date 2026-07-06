import { ContentProvider } from "@/lib/content/store";
import AdminShell from "@/components/admin/AdminShell";

/**
 * Layout for authenticated ADM pages: provides the editable content store and
 * the responsive sidebar chrome. (Login lives outside this group.)
 */
export default function PainelLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ContentProvider>
      <AdminShell>{children}</AdminShell>
    </ContentProvider>
  );
}
