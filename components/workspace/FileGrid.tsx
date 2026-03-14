import { MoreVertical, Image as ImageIcon, FileText, Video, Folder as FolderIcon, Share2, Download, Trash } from "lucide-react";

export function FileGrid() {
  // Mock data for previewing the new aesthetics
  const folders = [
    { id: 1, name: "Wedding Shoot - Sarah", items: 124, date: "Oct 24, 2024" },
    { id: 2, name: "Studio Portraits", items: 45, date: "Oct 22, 2024" },
    { id: 3, name: "Client Deliverables", items: 8, date: "Sep 15, 2024" },
  ];

  const files = [
    { id: 1, name: "DSC04892.ARW", type: "raw", size: "45 MB", date: "Today, 10:42 AM", provider: "gdrive" },
    { id: 2, name: "DSC04893.ARW", type: "raw", size: "46 MB", date: "Today, 10:45 AM", provider: "onedrive" },
    { id: 3, name: "Final_Edit_V2.jpg", type: "image", size: "8 MB", date: "Yesterday", provider: "gdrive" },
    { id: 4, name: "Invoice_Oct.pdf", type: "doc", size: "1.2 MB", date: "Oct 18", provider: "gdrive" },
    { id: 5, name: "B-Roll_Sequence.mp4", type: "video", size: "850 MB", date: "Oct 15", provider: "onedrive" },
  ];

  const getIcon = (type: string) => {
    switch(type) {
      case 'image': case 'raw': return <ImageIcon className="h-8 w-8 text-blue-500" />;
      case 'video': return <Video className="h-8 w-8 text-purple-500" />;
      case 'doc': return <FileText className="h-8 w-8 text-red-500" />;
      default: return <FileText className="h-8 w-8 text-gray-500" />;
    }
  };

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Folders Section */}
      <section>
        <h2 className="text-sm font-semibold text-rv-text-muted mb-4 uppercase tracking-wider">Folders</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {folders.map(folder => (
            <div 
              key={folder.id}
              className="glass p-4 rounded-[var(--rv-radius-lg)] hover:ring-2 ring-rv-primary/50 transition-all cursor-pointer group flex items-start gap-4"
            >
              <div className="p-3 bg-rv-primary/10 rounded-[var(--rv-radius-md)] text-rv-primary group-hover:scale-105 transition-transform duration-300">
                <FolderIcon className="h-6 w-6 fill-rv-primary/20" />
              </div>
              <div className="flex-1 overflow-hidden">
                <h3 className="font-semibold text-rv-text truncate">{folder.name}</h3>
                <p className="text-xs text-rv-text-muted mt-1">{folder.items} items • {folder.date}</p>
              </div>
              <button className="text-rv-text-muted hover:text-rv-text opacity-0 group-hover:opacity-100 transition-opacity">
                <MoreVertical className="h-5 w-5" />
              </button>
            </div>
          ))}
        </div>
      </section>

      {/* Files Section */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold text-rv-text-muted uppercase tracking-wider">Recent Files</h2>
        </div>
        
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {files.map(file => (
            <div 
              key={file.id} 
              className="glass group rounded-[var(--rv-radius-lg)] overflow-hidden flex flex-col transition-all duration-300 hover:-translate-y-1 hover:shadow-lg"
            >
              {/* Preview Area / Placeholder */}
              <div className="h-32 bg-rv-surface-muted flex items-center justify-center relative border-b border-rv-border/50">
                {getIcon(file.type)}
                
                {/* Provider Badge */}
                <span className="absolute top-2 left-2 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-white/80 dark:bg-black/50 backdrop-blur-sm shadow-sm border border-rv-border/50 text-rv-text">
                  {file.provider === "gdrive" ? "G" : "O"}
                </span>

                {/* Hover Actions */}
                <div className="absolute inset-0 bg-rv-surface/80 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 backdrop-blur-sm">
                  <button className="h-8 w-8 rounded-full bg-rv-primary text-white flex items-center justify-center shadow-md transform hover:scale-110 transition-transform">
                    <Download className="h-4 w-4" />
                  </button>
                  <button className="h-8 w-8 rounded-full bg-rv-surface border border-rv-border text-rv-text flex items-center justify-center shadow-md transform hover:scale-110 transition-transform">
                    <Share2 className="h-4 w-4" />
                  </button>
                </div>
              </div>

              {/* Info Area */}
              <div className="p-3 bg-rv-surface/50 backdrop-blur-md">
                <div className="flex justify-between items-start">
                  <h3 className="text-sm font-medium text-rv-text truncate pr-2" title={file.name}>
                    {file.name}
                  </h3>
                  <button className="text-rv-text-muted hover:text-rv-text flex-shrink-0">
                    <MoreVertical className="h-4 w-4" />
                  </button>
                </div>
                <div className="flex justify-between items-center mt-2 text-xs text-rv-text-muted">
                  <span>{file.size}</span>
                  <span>{file.date}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
