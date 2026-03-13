# OneDrive OAuth Setup Instructions

Hướng dẫn cấu hình OneDrive OAuth cho RawVault qua Microsoft Azure (Entra ID).

---

## 1. Tạo App registration trên Azure

1. Vào [Azure Portal](https://portal.azure.com/)
2. Tìm **Microsoft Entra ID** (hoặc **Azure Active Directory**)
3. Vào **App registrations** → **New registration**
4. Điền:
   - **Name:** RawVault (hoặc tên bạn muốn)
   - **Supported account types:** chọn **Accounts in any organizational directory and personal Microsoft accounts** (để hỗ trợ cả tài khoản cơ quan và cá nhân)
   - **Redirect URI:** chọn **Web** → nhập:
     ```
     http://localhost:3000/api/storage/accounts/connect/callback
     ```
     - Nếu dev server chạy port khác (ví dụ 3001):
     ```
     http://localhost:3001/api/storage/accounts/connect/callback
     ```
5. Bấm **Register**

---

## 2. Lấy Client ID và Client secret

### Client ID (Application ID)

- Ở trang **Overview** của app vừa tạo
- Copy **Application (client) ID**

### Client secret

1. Vào **Certificates & secrets**
2. Bấm **New client secret**
3. **Description:** RawVault Local (hoặc tùy chọn)
4. **Expires:** 24 months (hoặc 6 months)
5. Bấm **Add**
6. **Copy ngay giá trị Secret** (chỉ hiện một lần, không xem lại được)

---

## 3. Thêm API permissions

1. Vào **API permissions**
2. Bấm **Add a permission**
3. Chọn **Microsoft Graph**
4. Chọn **Delegated permissions**
5. Tìm và chọn:
   - `Files.ReadWrite` — đọc/ghi file OneDrive
   - `User.Read` — đọc thông tin user
   - `offline_access` — refresh token (thường có sẵn khi chọn các scope trên)
6. Bấm **Add permissions**

**Lưu ý:** Với tài khoản cá nhân (outlook.com, hotmail.com), user consent thường đủ. Với tài khoản cơ quan, admin có thể cần **Grant admin consent**.

---

## 4. Kiểm tra Redirect URI

1. Vào **Authentication**
2. Trong **Platform configurations** → **Web**
3. Đảm bảo **Redirect URIs** có đúng URL:
   ```
   http://localhost:3000/api/storage/accounts/connect/callback
   ```
4. **Implicit grant and hybrid flows:** để trống (không cần)
5. **Allow public client flows:** No
6. Bấm **Save**

---

## 5. Biến môi trường (.env.local)

Thêm vào `.env.local`:

```
# OneDrive OAuth
RAWVAULT_ONEDRIVE_CLIENT_ID=<Application (client) ID>
RAWVAULT_ONEDRIVE_CLIENT_SECRET=<Client secret vừa tạo>
RAWVAULT_ONEDRIVE_OAUTH_CALLBACK_URL=http://localhost:3000/api/storage/accounts/connect/callback
```

**Lưu ý:** `RAWVAULT_ONEDRIVE_OAUTH_CALLBACK_URL` phải **trùng chính xác** với Redirect URI trong Azure.

---

## 6. OAuth state secret

OneDrive dùng chung `RAWVAULT_OAUTH_STATE_SECRET` với Google Drive. Nếu đã cấu hình GDrive thì không cần tạo mới.

Nếu chưa có:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

Thêm vào `.env.local`:

```
RAWVAULT_OAUTH_STATE_SECRET=<kết quả vừa tạo>
```

---

## 7. Chế độ Personal vs Organizational

### Personal Microsoft accounts (outlook.com, hotmail.com, live.com)

- Thường không cần admin consent
- User bấm **Accept** khi đăng nhập lần đầu là đủ

### Organizational accounts (Microsoft 365, work/school)

- Có thể cần admin **Grant admin consent** trong **API permissions**
- Hoặc admin cho phép user consent trong tenant settings

---

## 8. Xử lý lỗi thường gặp

### AADSTS50011: Reply URL mismatch

- Redirect URI trong `.env.local` và Azure phải **giống hệt nhau**
- Kiểm tra: `http` vs `https`, port, dấu `/` cuối
- Restart dev server sau khi sửa `.env.local`

### AADSTS65001: User consent required

- User chưa consent permissions
- Thử đăng nhập lại và bấm **Accept** khi Microsoft hỏi quyền truy cập

### AADSTS700016: Application not found

- Client ID sai hoặc app đã bị xóa
- Kiểm tra lại Application ID trong Azure

### Error 500: Failed to load linked account for token access

- Chạy Phase 4 migration: `supabase db push`
- Xem [README.md](./README.md) phần Troubleshooting

---

## 9. Checklist

| Bước | Trạng thái |
|------|------------|
| Tạo App registration trên Azure | ☐ |
| Chọn Supported account types phù hợp | ☐ |
| Thêm Redirect URI (Web) | ☐ |
| Copy Application (client) ID | ☐ |
| Tạo Client secret và copy ngay | ☐ |
| Thêm API permissions (Files.ReadWrite, User.Read) | ☐ |
| Grant admin consent (nếu dùng org account) | ☐ |
| Thêm biến vào .env.local | ☐ |
| Có RAWVAULT_OAUTH_STATE_SECRET (dùng chung với GDrive) | ☐ |
| Restart dev server | ☐ |
