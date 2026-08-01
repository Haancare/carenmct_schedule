import AppLayout from "@/components/layout/AppLayout";
import AuthGuard from "@/components/AuthGuard";

export default function AppShellLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthGuard>
      <AppLayout>{children}</AppLayout>
    </AuthGuard>
  );
}