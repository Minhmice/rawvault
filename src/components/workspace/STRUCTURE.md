# Workspace component structure

- **Root** → `app/layout.tsx`: ThemeProvider, LocaleProvider, TooltipProvider, LoadingScreen, children, ThemePanel (overlay at root).
- **Dashboard** → `DashboardLayout.tsx`: Sidebar + Topbar + `<main>{children}</main>` (no overlays).
- **Vault content** → `VaultClient.tsx`: VaultHeader, VaultFilterBar, FileGrid; dialogs (Share, Rename, Delete) portal to body.

Full hierarchy and file roles: [docs/workspace-structure.md](../../docs/workspace-structure.md).
