/**
 * Message keys for navbar, sidebar, workspace, auth, shared, theme, and share view.
 * Add keys here and in both locale objects when expanding i18n.
 * Some keys contain {name} or {count} for simple interpolation in components.
 */
export type Locale = "en" | "vi";

export const LOCALE_LABELS: Record<Locale, string> = {
  en: "English",
  vi: "Tiếng Việt",
};

export type MessageKey =
  | "topbar.myVault"
  | "topbar.searchPlaceholder"
  | "topbar.customizeWorkspace"
  | "topbar.notifications"
  | "topbar.language"
  | "topbar.languageCurrent"
  | "sidebar.myVault"
  | "sidebar.sharedByMe"
  | "sidebar.recent"
  | "sidebar.starred"
  | "sidebar.trash"
  | "sidebar.settings"
  | "sidebar.menu"
  | "sidebar.other"
  | "sidebar.linkedAccounts"
  | "sidebar.noLinkedAccounts"
  | "sidebar.usage"
  | "sidebar.active"
  | "sidebar.setActive"
  | "sidebar.saving"
  | "sidebar.unlink"
  | "sidebar.personal"
  | "sidebar.userSession"
  | "sidebar.signedOut"
  | "sidebar.accountMenu"
  | "sidebar.accountSettings"
  | "sidebar.totalQuota"
  | "sidebar.logout"
  | "common.settings"
  | "common.cancel"
  | "common.unlink"
  | "common.unlinking"
  | "common.done"
  | "vault.myVault"
  | "vault.dataLoadedSubtitle"
  | "vault.checkingSession"
  | "vault.allFiles"
  | "vault.googleDrive"
  | "vault.oneDrive"
  | "vault.allPreviews"
  | "vault.readyPreviews"
  | "vault.pending"
  | "vault.failed"
  | "workspace.currentPath"
  | "workspace.root"
  | "workspace.rootView"
  | "workspace.activeStorage"
  | "workspace.noActiveAccount"
  | "workspace.linkProviderHint"
  | "workspace.retry"
  | "workspace.folders"
  | "workspace.recentFiles"
  | "workspace.filesCount"
  | "workspace.share"
  | "workspace.rename"
  | "workspace.delete"
  | "workspace.download"
  | "workspace.open"
  | "workspace.noFoldersOrFiles"
  | "workspace.folderMenuAria"
  | "workspace.fileMenuAria"
  | "workspace.addFile"
  | "workspace.addFileDescription"
  | "workspace.linkStorageFirst"
  | "workspace.upload"
  | "workspace.importFromDrive"
  | "workspace.account"
  | "workspace.file"
  | "workspace.uploading"
  | "workspace.importing"
  | "workspace.import"
  | "workspace.noFoldersOrFilesInLocation"
  | "workspace.currentFolder"
  | "workspace.addFileFromDrive"
  | "workspace.addFolderFromDrive"
  | "workspace.addFolderDescription"
  | "workspace.linkStorageFirstBrowse"
  | "workspace.noFoldersInLocation"
  | "workspace.newFolder"
  | "workspace.createFolderDescription"
  | "workspace.folderName"
  | "workspace.folderNamePlaceholder"
  | "workspace.folderNameRequired"
  | "workspace.creating"
  | "workspace.create"
  | "workspace.deleteConfirmTitle"
  | "workspace.deleteConfirmMessage"
  | "workspace.deleting"
  | "workspace.renameFileTitle"
  | "workspace.renameFolderTitle"
  | "workspace.renameDescription"
  | "workspace.fileNamePlaceholder"
  | "workspace.folderNamePlaceholderRename"
  | "workspace.fileNameRequired"
  | "workspace.folderNameRequiredRename"
  | "workspace.saving"
  | "workspace.save"
  | "workspace.shareFile"
  | "workspace.shareFolder"
  | "workspace.shareDescription"
  | "workspace.linkExpiration"
  | "workspace.never"
  | "workspace.days7"
  | "workspace.days30"
  | "workspace.creatingLink"
  | "workspace.createLink"
  | "workspace.shareLinkCreated"
  | "workspace.copyLink"
  | "workspace.expires"
  | "workspace.done"
  | "workspace.add"
  | "workspace.addFolder"
  | "workspace.uploadFile"
  | "workspace.uploadFolder"
  | "workspace.uploadFileDescription"
  | "workspace.uploadFolderDescription"
  | "workspace.uploadFolderPickFiles"
  | "workspace.fileBadgeSplit"
  | "workspace.fileBadgeDownloadOnly"
  | "workspace.selectFileRequired"
  | "workspace.noLinkedAccounts"
  | "workspace.noEligibleAccount"
  | "workspace.uploadFailed"
  | "workspace.failedToImport"
  | "workspace.failedToLoad"
  | "workspace.loading"
  | "workspace.loadingHint"
  | "workspace.failedToCreateShareLink"
  | "workspace.failedToCopy"
  | "workspace.storageConnectSuccess"
  | "workspace.storageConnectError"
  | "workspace.accountForImport"
  | "workspace.addFileMethod"
  | "shared.sharedByMe"
  | "shared.manageShareLinksSubtitle"
  | "shared.refresh"
  | "shared.shareLinks"
  | "shared.noShareLinksYet"
  | "shared.goToMyVault"
  | "shared.linkCopied"
  | "shared.removeShareLinkTitle"
  | "shared.removeShareLinkDescription"
  | "shared.removing"
  | "shared.remove"
  | "shared.failedToCopy"
  | "auth.signIn"
  | "auth.signingIn"
  | "auth.signInToAccount"
  | "auth.email"
  | "auth.password"
  | "auth.pleaseEnterEmail"
  | "auth.validEmail"
  | "auth.passwordMinLength"
  | "auth.signUp"
  | "auth.createAccount"
  | "auth.confirmPassword"
  | "auth.passwordsDoNotMatch"
  | "auth.creatingAccount"
  | "auth.alreadyHaveAccount"
  | "auth.signInLink"
  | "auth.dontHaveAccount"
  | "auth.qaSignIn"
  | "auth.checkingSession"
  | "auth.linkStorageAccount"
  | "auth.linkStorageDescription"
  | "auth.connect"
  | "auth.gdriveDescription"
  | "auth.onedriveDescription"
  | "auth.checkEmailConfirm"
  | "auth.signUpCompletedSignIn"
  | "auth.atLeast8Chars"
  | "theme.workspaceTheme"
  | "theme.closePanel"
  | "theme.appearance"
  | "theme.light"
  | "theme.dark"
  | "theme.accentColor"
  | "theme.borderRadius"
  | "theme.sharp"
  | "theme.rounded"
  | "theme.designSystems"
  | "theme.resetToDefault"
  | "theme.vivid"
  | "theme.vividSubtitle"
  | "theme.monochrome"
  | "theme.monochromeSubtitle"
  | "theme.bauhaus"
  | "theme.bauhausSubtitle"
  | "theme.linear"
  | "theme.linearSubtitle"
  | "theme.accBlue"
  | "theme.accViolet"
  | "theme.accRose"
  | "theme.accEmerald"
  | "theme.accAmber"
  | "theme.accSlate"
  | "theme.accBlack"
  | "theme.accCharcoal"
  | "theme.accGraphite"
  | "theme.accRed"
  | "theme.accYellow"
  | "theme.accIndigo"
  | "theme.accCyan"
  | "theme.accMagenta"
  | "s.sharedWithYou"
  | "s.loadingSharedContent"
  | "s.loadingFolderContents"
  | "s.download"
  | "s.retry"
  | "s.linkNotFound"
  | "s.linkExpiredOrRevoked"
  | "s.somethingWentWrong"
  | "s.invalidShareLink"
  | "s.shareNotFoundOrRemoved"
  | "s.shareExpiredOrRevoked"
  | "s.folderEmpty"
  | "s.contentsOf"
  | "common.unexpectedRequestFailure"
  | "common.never"
  | "common.failedToUnlink"
  | "common.unexpectedError"
  | "auth.signInFailed"
  | "auth.signInFailedTryAgain"
  | "auth.signUpFailed"
  | "auth.signUpFailedTryAgain"
  | "auth.emailPlaceholder"
  | "auth.devLabel"
  | "auth.seededSignInFailed"
  | "sidebar.unlinkAccountTitle"
  | "sidebar.unlinkAccountDescription"
  | "sidebar.unlinkAccountDescriptionFallback"
  | "sidebar.linkStorageAccountAria"
  | "sidebar.reconnect"
  | "sidebar.reauthRequired"
  | "sidebar.accountError"
  | "workspace.failedToCreateFolder"
  | "workspace.failedToRename"
  | "workspace.ariaCurrentFolder"
  | "workspace.ariaOpenFolder"
  | "workspace.ariaSelectFolder"
  | "workspace.ariaSelectCurrentFolder"
  | "workspace.filterByProviderAndPreview"
  | "workspace.providerFilter"
  | "workspace.previewStatusFilter"
  | "workspace.fileTypeImg"
  | "workspace.fileTypeVideo"
  | "workspace.fileTypePdf"
  | "workspace.fileTypeDoc"
  | "shared.resourceTypeFile"
  | "shared.resourceTypeFolder"
  | "vault.processing"
  | "s.videoNotSupported"
  | "s.failedToLoadFolder"
  | "s.ariaVideo"
  | "s.ariaFile"
  | "s.ariaFolder"
  | "s.ariaDownload";

export type Messages = Record<MessageKey, string>;

export const messages: Record<Locale, Messages> = {
  en: {
    "topbar.myVault": "My Vault",
    "topbar.searchPlaceholder": "SEARCH IN VAULT...",
    "topbar.customizeWorkspace": "Customize Workspace",
    "topbar.notifications": "Notifications",
    "topbar.language": "Choose language",
    "topbar.languageCurrent": "Current language",
    "sidebar.myVault": "My Vault",
    "sidebar.sharedByMe": "Shared by me",
    "sidebar.recent": "Recent",
    "sidebar.starred": "Starred",
    "sidebar.trash": "Trash",
    "sidebar.settings": "Settings",
    "sidebar.menu": "Menu",
    "sidebar.other": "Other",
    "sidebar.linkedAccounts": "Linked Accounts",
    "sidebar.noLinkedAccounts": "No linked provider accounts yet.",
    "sidebar.usage": "Usage",
    "sidebar.active": "Active",
    "sidebar.setActive": "Set Active",
    "sidebar.saving": "Saving…",
    "sidebar.unlink": "Unlink",
    "sidebar.personal": "Personal",
    "sidebar.userSession": "USER_SESSION",
    "sidebar.signedOut": "Signed out",
    "sidebar.accountMenu": "Account menu",
    "sidebar.accountSettings": "Account Settings",
    "sidebar.totalQuota": "Total Quota",
    "sidebar.logout": "Logout",
    "common.settings": "Settings",
    "common.cancel": "Cancel",
    "common.unlink": "Unlink",
    "common.unlinking": "Unlinking…",
    "common.done": "Done",
    "vault.myVault": "My Vault",
    "vault.dataLoadedSubtitle": "Data loaded from your session, storage accounts, folders, and files.",
    "vault.checkingSession": "Checking session...",
    "vault.allFiles": "All Files",
    "vault.googleDrive": "Google Drive",
    "vault.oneDrive": "OneDrive",
    "vault.allPreviews": "All Previews",
    "vault.readyPreviews": "Ready Previews",
    "vault.pending": "Pending",
    "vault.failed": "Failed",
    "workspace.currentPath": "Current Path",
    "workspace.root": "Root",
    "workspace.rootView": "Root View",
    "workspace.activeStorage": "Active Storage",
    "workspace.noActiveAccount": "No active account",
    "workspace.linkProviderHint": "Link a provider to upload or route files.",
    "workspace.retry": "Retry",
    "workspace.folders": "Folders",
    "workspace.recentFiles": "Recent Files",
    "workspace.filesCount": "files",
    "workspace.share": "Share",
    "workspace.rename": "Rename",
    "workspace.delete": "Delete",
    "workspace.download": "Download",
    "workspace.open": "Open",
    "workspace.noFoldersOrFiles": "No folders or files matched the current backend query.",
    "workspace.folderMenuAria": "Open folder menu",
    "workspace.fileMenuAria": "Open file menu",
    "workspace.addFile": "Add File",
    "workspace.addFileDescription": "Upload a new file or import from Drive.",
    "workspace.linkStorageFirst": "Link a storage account first.",
    "workspace.upload": "Upload",
    "workspace.importFromDrive": "Import from Drive",
    "workspace.account": "Account",
    "workspace.file": "File",
    "workspace.uploading": "Uploading...",
    "workspace.importing": "Importing...",
    "workspace.import": "Import",
    "workspace.noFoldersOrFilesInLocation": "No folders or files in this location.",
    "workspace.currentFolder": "(current)",
    "workspace.addFileFromDrive": "Add file from Drive",
    "workspace.addFolderFromDrive": "Add Folder from Drive",
    "workspace.addFolderDescription": "Browse folders and import one into your vault.",
    "workspace.linkStorageFirstBrowse": "Link a storage account first to browse folders.",
    "workspace.noFoldersInLocation": "No folders in this location.",
    "workspace.newFolder": "New Folder",
    "workspace.createFolderDescription": "Enter a name for the new folder. It will be created in the current location.",
    "workspace.folderName": "Folder name",
    "workspace.folderNamePlaceholder": "Folder name",
    "workspace.folderNameRequired": "Folder name is required.",
    "workspace.creating": "Creating...",
    "workspace.create": "Create",
    "workspace.deleteConfirmTitle": "Move to trash",
    "workspace.deleteConfirmMessage": "\"{name}\" will be moved to trash. Are you sure?",
    "workspace.deleting": "Deleting…",
    "workspace.renameFileTitle": "Rename file",
    "workspace.renameFolderTitle": "Rename folder",
    "workspace.renameDescription": "Enter new name for \"{name}\".",
    "workspace.fileNamePlaceholder": "File name",
    "workspace.folderNamePlaceholderRename": "Folder name",
    "workspace.fileNameRequired": "File name is required.",
    "workspace.folderNameRequiredRename": "Folder name is required.",
    "workspace.saving": "Saving…",
    "workspace.save": "Save",
    "workspace.shareFile": "Share File",
    "workspace.shareFolder": "Share Folder",
    "workspace.shareDescription": "Create a share link for \"{name}\". Anyone with the link can view it.",
    "workspace.linkExpiration": "Link expiration",
    "workspace.never": "Never",
    "workspace.days7": "7 days",
    "workspace.days30": "30 days",
    "workspace.creatingLink": "Creating...",
    "workspace.createLink": "Create link",
    "workspace.shareLinkCreated": "Share link created. Copy it to share with others.",
    "workspace.copyLink": "Copy link",
    "workspace.expires": "Expires",
    "workspace.done": "Done",
    "workspace.add": "Add",
    "workspace.addFolder": "Add Folder",
    "workspace.uploadFile": "Upload File",
    "workspace.uploadFolder": "Upload Folder",
    "workspace.uploadFileDescription": "Choose a file to upload to the current location.",
    "workspace.uploadFolderDescription": "Create a new folder and upload files into it.",
    "workspace.uploadFolderPickFiles": "Pick a folder or files",
    "workspace.fileBadgeSplit": "Stored across multiple drives",
    "workspace.fileBadgeDownloadOnly": "Download only",
    "workspace.selectFileRequired": "Please select a file.",
    "workspace.noLinkedAccounts": "No storage accounts linked. Link Google Drive or OneDrive in the sidebar before uploading.",
    "workspace.noEligibleAccount": "No account can receive the file (expired, error, or out of space). Check your linked accounts.",
    "workspace.uploadFailed": "Upload failed",
    "workspace.failedToImport": "Failed to import",
    "workspace.failedToLoad": "Failed to load",
    "workspace.loading": "Loading…",
    "workspace.loadingHint": "Fetching folders and files",
    "workspace.failedToCreateShareLink": "Failed to create share link",
    "workspace.failedToCopy": "Failed to copy to clipboard",
    "workspace.storageConnectSuccess": "{provider} linked successfully.",
    "workspace.storageConnectError": "Failed to link storage account.",
    "workspace.accountForImport": "Account for import",
    "workspace.addFileMethod": "Add file method",
    "shared.sharedByMe": "Shared by me",
    "shared.manageShareLinksSubtitle": "Manage your share links. Copy links to share or revoke access.",
    "shared.refresh": "Refresh",
    "shared.shareLinks": "Share links",
    "shared.noShareLinksYet": "No share links yet. Create one from a file or folder in your vault.",
    "shared.goToMyVault": "Go to My Vault",
    "shared.linkCopied": "Link copied",
    "shared.removeShareLinkTitle": "Remove share link?",
    "shared.removeShareLinkDescription": "This will revoke the share link. Anyone with the link will no longer be able to access the shared content.",
    "shared.removing": "Removing…",
    "shared.remove": "Remove",
    "shared.failedToCopy": "Failed to copy to clipboard",
    "auth.signIn": "Sign In",
    "auth.signingIn": "Signing in...",
    "auth.signInToAccount": "Sign in to your account",
    "auth.email": "Email",
    "auth.password": "Password",
    "auth.pleaseEnterEmail": "Please enter your email.",
    "auth.validEmail": "Please enter a valid email address.",
    "auth.passwordMinLength": "Password must be at least 8 characters.",
    "auth.signUp": "Sign Up",
    "auth.createAccount": "Create your account",
    "auth.confirmPassword": "Confirm Password",
    "auth.passwordsDoNotMatch": "Passwords do not match.",
    "auth.creatingAccount": "Creating account...",
    "auth.alreadyHaveAccount": "Already have an account?",
    "auth.signInLink": "Sign in",
    "auth.dontHaveAccount": "Don't have an account?",
    "auth.qaSignIn": "QA Sign In (seeded user)",
    "auth.checkingSession": "Checking session...",
    "auth.linkStorageAccount": "Link Storage Account",
    "auth.linkStorageDescription": "Connect Google Drive or OneDrive to store and sync your RAW files.",
    "auth.connect": "Connect",
    "auth.gdriveDescription": "Store files in your Google account",
    "auth.onedriveDescription": "Store files in your Microsoft account",
    "auth.checkEmailConfirm": "Check your email to confirm your account.",
    "auth.signUpCompletedSignIn": "Sign up completed. Please sign in.",
    "auth.atLeast8Chars": "At least 8 characters",
    "theme.workspaceTheme": "Workspace Theme",
    "theme.closePanel": "Close theme panel",
    "theme.appearance": "Appearance",
    "theme.light": "Light",
    "theme.dark": "Dark",
    "theme.accentColor": "Accent Color",
    "theme.borderRadius": "Border Radius",
    "theme.sharp": "Sharp",
    "theme.rounded": "Rounded",
    "theme.designSystems": "Design Systems",
    "theme.resetToDefault": "Reset to Default",
    "theme.vivid": "Vivid",
    "theme.vividSubtitle": "Dynamic Colorful",
    "theme.monochrome": "Minimalist Monochrome",
    "theme.monochromeSubtitle": "Editorial High-Contrast",
    "theme.bauhaus": "Bauhaus",
    "theme.bauhausSubtitle": "Geometric Constructivist",
    "theme.linear": "Linear Cinematic",
    "theme.linearSubtitle": "Dark Cinematic",
    "theme.accBlue": "Blue",
    "theme.accViolet": "Violet",
    "theme.accRose": "Rose",
    "theme.accEmerald": "Emerald",
    "theme.accAmber": "Amber",
    "theme.accSlate": "Slate",
    "theme.accBlack": "Black",
    "theme.accCharcoal": "Charcoal",
    "theme.accGraphite": "Graphite",
    "theme.accRed": "Red",
    "theme.accYellow": "Yellow",
    "theme.accIndigo": "Indigo",
    "theme.accCyan": "Cyan",
    "theme.accMagenta": "Magenta",
    "s.sharedWithYou": "Shared with you",
    "s.loadingSharedContent": "Loading shared content…",
    "s.loadingFolderContents": "Loading folder contents…",
    "s.download": "Download",
    "s.retry": "Retry",
    "s.linkNotFound": "Link not found",
    "s.linkExpiredOrRevoked": "Link expired or revoked",
    "s.somethingWentWrong": "Something went wrong",
    "s.invalidShareLink": "Invalid share link.",
    "s.shareNotFoundOrRemoved": "This share link was not found or has been removed.",
    "s.shareExpiredOrRevoked": "This share link has expired or been revoked.",
    "s.folderEmpty": "This folder is empty.",
    "s.contentsOf": "Contents of {name}",
    "common.unexpectedRequestFailure": "Unexpected request failure.",
    "common.never": "Never",
    "common.failedToUnlink": "Failed to unlink account.",
    "common.unexpectedError": "An unexpected error occurred.",
    "auth.signInFailed": "Sign in failed.",
    "auth.signInFailedTryAgain": "Sign in failed. Please try again.",
    "auth.signUpFailed": "Sign up failed.",
    "auth.signUpFailedTryAgain": "Sign up failed. Please try again.",
    "auth.emailPlaceholder": "you@example.com",
    "auth.devLabel": "Dev:",
    "auth.seededSignInFailed": "Seeded sign-in failed",
    "sidebar.unlinkAccountTitle": "Unlink storage account",
    "sidebar.unlinkAccountDescription": "Unlink {provider} ({email})? Files imported from this account will remain in your vault but will no longer sync with the provider.",
    "sidebar.unlinkAccountDescriptionFallback": "This will remove the account from your vault. Files will remain but will no longer sync with the provider.",
    "sidebar.linkStorageAccountAria": "Link storage account",
    "sidebar.reconnect": "Reconnect",
    "sidebar.reauthRequired": "Reauth required",
    "sidebar.accountError": "Error",
    "workspace.failedToCreateFolder": "Failed to create folder.",
    "workspace.failedToRename": "Failed to rename.",
    "workspace.ariaCurrentFolder": "Current folder: {name}",
    "workspace.ariaOpenFolder": "Open folder {name}",
    "workspace.ariaSelectFolder": "Select folder {name}",
    "workspace.ariaSelectCurrentFolder": "Select current folder {name}",
    "workspace.filterByProviderAndPreview": "Filter by provider and preview status",
    "workspace.providerFilter": "Provider filter",
    "workspace.previewStatusFilter": "Preview status filter",
    "workspace.fileTypeImg": "IMG",
    "workspace.fileTypeVideo": "VIDEO",
    "workspace.fileTypePdf": "PDF",
    "workspace.fileTypeDoc": "DOC",
    "shared.resourceTypeFile": "file",
    "shared.resourceTypeFolder": "folder",
    "vault.processing": "Processing",
    "s.videoNotSupported": "Your browser does not support the video tag.",
    "s.failedToLoadFolder": "Failed to load folder ({status})",
    "s.ariaVideo": "Video: {name}",
    "s.ariaFile": "File: {name}",
    "s.ariaFolder": "Folder: {name}",
    "s.ariaDownload": "Download {name}",
  },
  vi: {
    "topbar.myVault": "Kho của tôi",
    "topbar.searchPlaceholder": "TÌM TRONG KHO...",
    "topbar.customizeWorkspace": "Tùy chỉnh workspace",
    "topbar.notifications": "Thông báo",
    "topbar.language": "Chọn ngôn ngữ",
    "topbar.languageCurrent": "Ngôn ngữ hiện tại",
    "sidebar.myVault": "Kho của tôi",
    "sidebar.sharedByMe": "Chia sẻ bởi tôi",
    "sidebar.recent": "Gần đây",
    "sidebar.starred": "Đã gắn sao",
    "sidebar.trash": "Thùng rác",
    "sidebar.settings": "Cài đặt",
    "sidebar.menu": "Menu",
    "sidebar.other": "Khác",
    "sidebar.linkedAccounts": "Tài khoản liên kết",
    "sidebar.noLinkedAccounts": "Chưa có tài khoản nhà cung cấp nào.",
    "sidebar.usage": "Sử dụng",
    "sidebar.active": "Đang dùng",
    "sidebar.setActive": "Đặt làm chính",
    "sidebar.saving": "Đang lưu…",
    "sidebar.unlink": "Hủy liên kết",
    "sidebar.personal": "Cá nhân",
    "sidebar.userSession": "PHIÊN NGƯỜI DÙNG",
    "sidebar.signedOut": "Đã đăng xuất",
    "sidebar.accountMenu": "Menu tài khoản",
    "sidebar.accountSettings": "Cài đặt tài khoản",
    "sidebar.totalQuota": "Tổng hạn mức",
    "sidebar.logout": "Đăng xuất",
    "common.settings": "Cài đặt",
    "common.cancel": "Hủy",
    "common.unlink": "Hủy liên kết",
    "common.unlinking": "Đang hủy liên kết…",
    "common.done": "Xong",
    "vault.myVault": "Kho của tôi",
    "vault.dataLoadedSubtitle": "Dữ liệu từ phiên, tài khoản lưu trữ, thư mục và tệp.",
    "vault.checkingSession": "Đang kiểm tra phiên...",
    "vault.allFiles": "Tất cả tệp",
    "vault.googleDrive": "Google Drive",
    "vault.oneDrive": "OneDrive",
    "vault.allPreviews": "Tất cả bản xem trước",
    "vault.readyPreviews": "Sẵn sàng",
    "vault.pending": "Đang chờ",
    "vault.failed": "Thất bại",
    "workspace.currentPath": "Đường dẫn hiện tại",
    "workspace.root": "Gốc",
    "workspace.rootView": "Xem gốc",
    "workspace.activeStorage": "Lưu trữ đang dùng",
    "workspace.noActiveAccount": "Chưa có tài khoản đang dùng",
    "workspace.linkProviderHint": "Liên kết nhà cung cấp để tải lên hoặc định tuyến tệp.",
    "workspace.retry": "Thử lại",
    "workspace.folders": "Thư mục",
    "workspace.recentFiles": "Tệp gần đây",
    "workspace.filesCount": "tệp",
    "workspace.share": "Chia sẻ",
    "workspace.rename": "Đổi tên",
    "workspace.delete": "Xóa",
    "workspace.download": "Tải xuống",
    "workspace.open": "Mở",
    "workspace.noFoldersOrFiles": "Không có thư mục hoặc tệp khớp truy vấn.",
    "workspace.folderMenuAria": "Mở menu thư mục",
    "workspace.fileMenuAria": "Mở menu tệp",
    "workspace.addFile": "Thêm tệp",
    "workspace.addFileDescription": "Tải lên tệp mới hoặc nhập từ Drive.",
    "workspace.linkStorageFirst": "Vui lòng liên kết tài khoản lưu trữ trước.",
    "workspace.upload": "Tải lên",
    "workspace.importFromDrive": "Nhập từ Drive",
    "workspace.account": "Tài khoản",
    "workspace.file": "Tệp",
    "workspace.uploading": "Đang tải lên...",
    "workspace.importing": "Đang nhập...",
    "workspace.import": "Nhập",
    "workspace.noFoldersOrFilesInLocation": "Không có thư mục hoặc tệp tại vị trí này.",
    "workspace.currentFolder": "(hiện tại)",
    "workspace.addFileFromDrive": "Thêm tệp từ Drive",
    "workspace.addFolderFromDrive": "Thêm thư mục từ Drive",
    "workspace.addFolderDescription": "Duyệt thư mục và nhập một thư mục vào kho.",
    "workspace.linkStorageFirstBrowse": "Liên kết tài khoản lưu trữ trước để duyệt thư mục.",
    "workspace.noFoldersInLocation": "Không có thư mục tại vị trí này.",
    "workspace.newFolder": "Thư mục mới",
    "workspace.createFolderDescription": "Nhập tên cho thư mục mới. Thư mục sẽ được tạo tại vị trí hiện tại.",
    "workspace.folderName": "Tên thư mục",
    "workspace.folderNamePlaceholder": "Tên thư mục",
    "workspace.folderNameRequired": "Vui lòng nhập tên thư mục.",
    "workspace.creating": "Đang tạo...",
    "workspace.create": "Tạo",
    "workspace.deleteConfirmTitle": "Chuyển vào thùng rác",
    "workspace.deleteConfirmMessage": "\"{name}\" sẽ được chuyển vào thùng rác. Bạn có chắc?",
    "workspace.deleting": "Đang xóa…",
    "workspace.renameFileTitle": "Đổi tên tệp",
    "workspace.renameFolderTitle": "Đổi tên thư mục",
    "workspace.renameDescription": "Nhập tên mới cho \"{name}\".",
    "workspace.fileNamePlaceholder": "Tên tệp",
    "workspace.folderNamePlaceholderRename": "Tên thư mục",
    "workspace.fileNameRequired": "Vui lòng nhập tên tệp.",
    "workspace.folderNameRequiredRename": "Vui lòng nhập tên thư mục.",
    "workspace.saving": "Đang lưu…",
    "workspace.save": "Lưu",
    "workspace.shareFile": "Chia sẻ tệp",
    "workspace.shareFolder": "Chia sẻ thư mục",
    "workspace.shareDescription": "Tạo liên kết chia sẻ cho \"{name}\". Ai có liên kết đều có thể xem.",
    "workspace.linkExpiration": "Hết hạn liên kết",
    "workspace.never": "Không hết hạn",
    "workspace.days7": "7 ngày",
    "workspace.days30": "30 ngày",
    "workspace.creatingLink": "Đang tạo...",
    "workspace.createLink": "Tạo liên kết",
    "workspace.shareLinkCreated": "Đã tạo liên kết chia sẻ. Sao chép để chia sẻ.",
    "workspace.copyLink": "Sao chép liên kết",
    "workspace.expires": "Hết hạn",
    "workspace.done": "Xong",
    "workspace.add": "Thêm",
    "workspace.addFolder": "Thêm thư mục",
    "workspace.uploadFile": "Tải tệp lên",
    "workspace.uploadFolder": "Tải thư mục lên",
    "workspace.uploadFileDescription": "Chọn tệp để tải lên vào vị trí hiện tại.",
    "workspace.uploadFolderDescription": "Tạo thư mục mới và tải các tệp vào đó.",
    "workspace.uploadFolderPickFiles": "Chọn thư mục hoặc tệp",
    "workspace.fileBadgeSplit": "Lưu trên nhiều ổ",
    "workspace.fileBadgeDownloadOnly": "Chỉ tải xuống",
    "workspace.selectFileRequired": "Vui lòng chọn một tệp.",
    "workspace.noLinkedAccounts": "Chưa có tài khoản lưu trữ. Liên kết Google Drive hoặc OneDrive trong thanh bên trước khi tải lên.",
    "workspace.noEligibleAccount": "Không có tài khoản nhận tệp (hết hạn, lỗi hoặc hết dung lượng). Kiểm tra tài khoản liên kết.",
    "workspace.uploadFailed": "Tải lên thất bại",
    "workspace.failedToImport": "Nhập thất bại",
    "workspace.failedToLoad": "Tải thất bại",
    "workspace.loading": "Đang tải…",
    "workspace.loadingHint": "Đang lấy thư mục và tệp",
    "workspace.failedToCreateShareLink": "Tạo liên kết chia sẻ thất bại",
    "workspace.failedToCopy": "Sao chép vào clipboard thất bại",
    "workspace.storageConnectSuccess": "Đã liên kết {provider} thành công.",
    "workspace.storageConnectError": "Liên kết tài khoản lưu trữ thất bại.",
    "workspace.accountForImport": "Tài khoản để nhập",
    "workspace.addFileMethod": "Cách thêm tệp",
    "shared.sharedByMe": "Chia sẻ bởi tôi",
    "shared.manageShareLinksSubtitle": "Quản lý liên kết chia sẻ. Sao chép hoặc thu hồi quyền truy cập.",
    "shared.refresh": "Làm mới",
    "shared.shareLinks": "Liên kết chia sẻ",
    "shared.noShareLinksYet": "Chưa có liên kết chia sẻ. Tạo từ tệp hoặc thư mục trong kho.",
    "shared.goToMyVault": "Đến Kho của tôi",
    "shared.linkCopied": "Đã sao chép liên kết",
    "shared.removeShareLinkTitle": "Thu hồi liên kết chia sẻ?",
    "shared.removeShareLinkDescription": "Liên kết chia sẻ sẽ bị thu hồi. Người có liên kết sẽ không thể truy cập nội dung.",
    "shared.removing": "Đang thu hồi…",
    "shared.remove": "Thu hồi",
    "shared.failedToCopy": "Sao chép vào clipboard thất bại",
    "auth.signIn": "Đăng nhập",
    "auth.signingIn": "Đang đăng nhập...",
    "auth.signInToAccount": "Đăng nhập vào tài khoản",
    "auth.email": "Email",
    "auth.password": "Mật khẩu",
    "auth.pleaseEnterEmail": "Vui lòng nhập email.",
    "auth.validEmail": "Vui lòng nhập địa chỉ email hợp lệ.",
    "auth.passwordMinLength": "Mật khẩu phải có ít nhất 8 ký tự.",
    "auth.signUp": "Đăng ký",
    "auth.createAccount": "Tạo tài khoản",
    "auth.confirmPassword": "Xác nhận mật khẩu",
    "auth.passwordsDoNotMatch": "Mật khẩu không khớp.",
    "auth.creatingAccount": "Đang tạo tài khoản...",
    "auth.alreadyHaveAccount": "Đã có tài khoản?",
    "auth.signInLink": "Đăng nhập",
    "auth.dontHaveAccount": "Chưa có tài khoản?",
    "auth.qaSignIn": "Đăng nhập QA (người dùng mẫu)",
    "auth.checkingSession": "Đang kiểm tra phiên...",
    "auth.linkStorageAccount": "Liên kết tài khoản lưu trữ",
    "auth.linkStorageDescription": "Kết nối Google Drive hoặc OneDrive để lưu và đồng bộ file RAW.",
    "auth.connect": "Kết nối",
    "auth.gdriveDescription": "Lưu tệp trong tài khoản Google",
    "auth.onedriveDescription": "Lưu tệp trong tài khoản Microsoft",
    "auth.checkEmailConfirm": "Kiểm tra email để xác nhận tài khoản.",
    "auth.signUpCompletedSignIn": "Đăng ký hoàn tất. Vui lòng đăng nhập.",
    "auth.atLeast8Chars": "Ít nhất 8 ký tự",
    "theme.workspaceTheme": "Giao diện workspace",
    "theme.closePanel": "Đóng bảng giao diện",
    "theme.appearance": "Giao diện",
    "theme.light": "Sáng",
    "theme.dark": "Tối",
    "theme.accentColor": "Màu nhấn",
    "theme.borderRadius": "Bo góc",
    "theme.sharp": "Vuông",
    "theme.rounded": "Tròn",
    "theme.designSystems": "Hệ thống thiết kế",
    "theme.resetToDefault": "Đặt lại mặc định",
    "theme.vivid": "Vivid",
    "theme.vividSubtitle": "Năng động nhiều màu",
    "theme.monochrome": "Đơn sắc tối giản",
    "theme.monochromeSubtitle": "Tương phản cao",
    "theme.bauhaus": "Bauhaus",
    "theme.bauhausSubtitle": "Kiến tạo hình học",
    "theme.linear": "Linear Cinematic",
    "theme.linearSubtitle": "Tối điện ảnh",
    "theme.accBlue": "Xanh dương",
    "theme.accViolet": "Tím",
    "theme.accRose": "Hồng",
    "theme.accEmerald": "Xanh lá",
    "theme.accAmber": "Hổ phách",
    "theme.accSlate": "Xám",
    "theme.accBlack": "Đen",
    "theme.accCharcoal": "Than",
    "theme.accGraphite": "Chì",
    "theme.accRed": "Đỏ",
    "theme.accYellow": "Vàng",
    "theme.accIndigo": "Chàm",
    "theme.accCyan": "Xanh lơ",
    "theme.accMagenta": "Đỏ tươi",
    "s.sharedWithYou": "Chia sẻ với bạn",
    "s.loadingSharedContent": "Đang tải nội dung chia sẻ…",
    "s.loadingFolderContents": "Đang tải nội dung thư mục…",
    "s.download": "Tải xuống",
    "s.retry": "Thử lại",
    "s.linkNotFound": "Không tìm thấy liên kết",
    "s.linkExpiredOrRevoked": "Liên kết đã hết hạn hoặc bị thu hồi",
    "s.somethingWentWrong": "Đã xảy ra lỗi",
    "s.invalidShareLink": "Liên kết chia sẻ không hợp lệ.",
    "s.shareNotFoundOrRemoved": "Liên kết chia sẻ không tồn tại hoặc đã bị gỡ.",
    "s.shareExpiredOrRevoked": "Liên kết chia sẻ đã hết hạn hoặc bị thu hồi.",
    "s.folderEmpty": "Thư mục này trống.",
    "s.contentsOf": "Nội dung của {name}",
    "common.unexpectedRequestFailure": "Yêu cầu thất bại không xác định.",
    "common.never": "Không bao giờ",
    "common.failedToUnlink": "Hủy liên kết tài khoản thất bại.",
    "common.unexpectedError": "Đã xảy ra lỗi không mong muốn.",
    "auth.signInFailed": "Đăng nhập thất bại.",
    "auth.signInFailedTryAgain": "Đăng nhập thất bại. Vui lòng thử lại.",
    "auth.signUpFailed": "Đăng ký thất bại.",
    "auth.signUpFailedTryAgain": "Đăng ký thất bại. Vui lòng thử lại.",
    "auth.emailPlaceholder": "you@example.com",
    "auth.devLabel": "Dev:",
    "auth.seededSignInFailed": "Đăng nhập mẫu thất bại",
    "sidebar.unlinkAccountTitle": "Hủy liên kết tài khoản lưu trữ",
    "sidebar.unlinkAccountDescription": "Hủy liên kết {provider} ({email})? Tệp đã nhập từ tài khoản này vẫn nằm trong kho nhưng sẽ không còn đồng bộ với nhà cung cấp.",
    "sidebar.unlinkAccountDescriptionFallback": "Tài khoản sẽ bị gỡ khỏi kho. Tệp vẫn giữ nguyên nhưng sẽ không còn đồng bộ với nhà cung cấp.",
    "sidebar.linkStorageAccountAria": "Liên kết tài khoản lưu trữ",
    "sidebar.reconnect": "Kết nối lại",
    "sidebar.reauthRequired": "Cần xác thực lại",
    "sidebar.accountError": "Lỗi",
    "workspace.failedToCreateFolder": "Tạo thư mục thất bại.",
    "workspace.failedToRename": "Đổi tên thất bại.",
    "workspace.ariaCurrentFolder": "Thư mục hiện tại: {name}",
    "workspace.ariaOpenFolder": "Mở thư mục {name}",
    "workspace.ariaSelectFolder": "Chọn thư mục {name}",
    "workspace.ariaSelectCurrentFolder": "Chọn thư mục hiện tại {name}",
    "workspace.filterByProviderAndPreview": "Lọc theo nhà cung cấp và trạng thái xem trước",
    "workspace.providerFilter": "Lọc nhà cung cấp",
    "workspace.previewStatusFilter": "Lọc trạng thái xem trước",
    "workspace.fileTypeImg": "IMG",
    "workspace.fileTypeVideo": "VIDEO",
    "workspace.fileTypePdf": "PDF",
    "workspace.fileTypeDoc": "DOC",
    "shared.resourceTypeFile": "tệp",
    "shared.resourceTypeFolder": "thư mục",
    "vault.processing": "Đang xử lý",
    "s.videoNotSupported": "Trình duyệt không hỗ trợ thẻ video.",
    "s.failedToLoadFolder": "Tải thư mục thất bại ({status})",
    "s.ariaVideo": "Video: {name}",
    "s.ariaFile": "Tệp: {name}",
    "s.ariaFolder": "Thư mục: {name}",
    "s.ariaDownload": "Tải xuống {name}",
  },
};

const STORAGE_KEY = "rawvault-locale";

/** When GET/PATCH /api/workspace/preferences exist, read/save locale from API (e.g. preferences.locale) instead of localStorage. */

function getStoredLocale(): Locale | null {
  if (typeof window === "undefined") return null;
  try {
    const v = localStorage.getItem(STORAGE_KEY);
    if (v === "en" || v === "vi") return v;
    return null;
  } catch {
    return null;
  }
}

export function getInitialLocale(): Locale {
  if (typeof window === "undefined") return "en";
  const stored = getStoredLocale();
  if (stored) return stored;
  const nav = typeof navigator !== "undefined" ? navigator.language : "";
  if (nav.startsWith("vi")) return "vi";
  return "en";
}

export function persistLocale(locale: Locale): void {
  try {
    localStorage.setItem(STORAGE_KEY, locale);
  } catch {
    // ignore
  }
}
