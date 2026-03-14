import { DashboardLayout } from "@/components/workspace/DashboardLayout";
import { FileGrid } from "@/components/workspace/FileGrid";
import { Button } from "@/components/core/Button";
import { UploadCloud, Plus } from "lucide-react";

export default function Home() {
  return (
    <DashboardLayout>
      <div className="h-full flex flex-col space-y-6">
        
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-heading font-bold text-rv-text tracking-tight">My Vault</h1>
            <p className="text-rv-text-muted mt-1">Manage and preview your RAW files across all storages.</p>
          </div>
          
          <div className="flex items-center gap-3">
            <Button variant="secondary" className="gap-2">
              <Plus className="h-4 w-4" />
              New Folder
            </Button>
            <Button className="gap-2 shadow-lg shadow-rv-primary/20">
              <UploadCloud className="h-4 w-4" />
              Upload Files
            </Button>
          </div>
        </div>

        {/* Filters/Tabs (Static for MVP UI demo) */}
        <div className="flex items-center gap-6 border-b border-rv-border">
          <button className="px-1 py-3 border-b-2 border-rv-primary font-medium text-rv-property text-sm text-rv-text">
            All Files
          </button>
          <button className="px-1 py-3 border-b-2 border-transparent font-medium text-rv-text-muted hover:text-rv-text transition-colors text-sm">
            Google Drive
          </button>
          <button className="px-1 py-3 border-b-2 border-transparent font-medium text-rv-text-muted hover:text-rv-text transition-colors text-sm">
            OneDrive
          </button>
          <button className="px-1 py-3 border-b-2 border-transparent font-medium text-rv-text-muted hover:text-rv-text transition-colors text-sm">
            Ready Previews
          </button>
        </div>

        {/* Content Area */}
        <div className="flex-1">
          <FileGrid />
        </div>

      </div>
    </DashboardLayout>
  );
}
