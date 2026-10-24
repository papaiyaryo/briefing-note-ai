import { WorkspaceShell } from "../src/components/workspace/WorkspaceShell";
import { WorkspaceHome } from "../src/components/workspace/WorkspaceHome";

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ view?: string }>;
}) {
  const query = await searchParams;
  return (
    <main className="min-h-screen px-6 py-10">
      <WorkspaceShell>
        <WorkspaceHome
          view={query.view === "generation" ? "generation" : "board"}
        />
      </WorkspaceShell>
    </main>
  );
}
