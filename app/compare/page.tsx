import { ComparisonHome } from "../../src/components/compare/ComparisonHome";
import { WorkspaceShell } from "../../src/components/workspace/WorkspaceShell";

export default function Compare() {
  return (
    <main className="min-h-screen px-6 py-10">
      <WorkspaceShell>
        <ComparisonHome />
      </WorkspaceShell>
    </main>
  );
}
