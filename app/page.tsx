import { AccountManagementSection } from "../components/account-management/account-management-section";
import { AuthTestingSection } from "../components/auth/auth-testing-section";
import { UnifiedExplorerSection } from "../components/explorer/unified-explorer-section";
import { UploadDispatchPrepSection } from "../components/explorer/upload-dispatch-prep-section";

export default function HomePage() {
  return (
    <main className="rv-page">
      <div className="rv-page-shell rv-stack">
        <p className="rv-eyebrow">RawVault foundation</p>
        <h1 className="rv-title">Account management</h1>
        <p className="rv-muted">
          Use the auth test flow first to establish a session before exercising authenticated
          explorer and dispatch routes.
        </p>
        <AuthTestingSection />
        <p className="rv-muted">
          Manage linked provider accounts and quota usage. This section is designed as a
          standalone module for future settings/workspace integration.
        </p>
        <AccountManagementSection />
        <h2 className="rv-title" style={{ fontSize: "1.4rem" }}>
          Explorer and dispatch
        </h2>
        <p className="rv-muted">
          Slice-2 read-only shell for unified browsing and upload routing preparation.
        </p>
        <UnifiedExplorerSection />
        <UploadDispatchPrepSection />
      </div>
    </main>
  );
}
