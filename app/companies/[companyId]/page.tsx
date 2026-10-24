import { WorkspaceShell } from "../../../src/components/workspace/WorkspaceShell";
import { CompanyDetail } from "../../../src/components/workspace/CompanyDetail";
export default async function CompanyPage({
  params,
}: {
  params: Promise<{ companyId: string }>;
}) {
  const { companyId } = await params;
  return (
    <main className="mx-auto min-h-screen max-w-6xl px-4 py-8">
      <WorkspaceShell>
        <CompanyDetail companyId={companyId} />
      </WorkspaceShell>
    </main>
  );
}
