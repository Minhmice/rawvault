# Google Drive OAuth Setup Instructions

Hướng dẫn cấu hình Google Drive OAuth cho RawVault.

---

## 1. Tạo project trên Google Cloud

1. Vào [Google Cloud Console](https://console.cloud.google.com/)
2. Chọn project có sẵn hoặc **New Project**
3. Đặt tên project (ví dụ: `RawVault`) → **Create**

---

## 2. Bật Google Drive API

1. Vào **APIs & Services** → **Library**
2. Tìm **Google Drive API**
3. Bấm **Enable**

---

## 3. Cấu hình OAuth consent screen

1. Vào **APIs & Services** → **OAuth consent screen**
2. Chọn **External** (hoặc **Internal** nếu dùng Google Workspace)
3. Bấm **Create**
4. Điền:
   - **App name:** RawVault (hoặc tên bạn muốn)
   - **User support email:** email của bạn
   - **Developer contact information:** email của bạn
5. Bấm **Save and Continue**
6. Ở màn **Scopes** → **Add or Remove Scopes** → chọn:
   - `openid`
   - `email`
   - `profile`
   - `https://www.googleapis.com/auth/drive.file` (upload)
   - `https://www.googleapis.com/auth/drive.readonly` (browse/list files)
7. Bấm **Save and Continue**
8. Ở màn **Test users** (nếu app ở chế độ Testing):
   - Bấm **+ ADD USERS**
   - Thêm email sẽ dùng để đăng nhập (ví dụ: `your-email@gmail.com`)
   - Bấm **Save**
9. Bấm **Back to Dashboard**

---

## 4. Tạo OAuth credentials

1. Vào **APIs & Services** → **Credentials**
2. Bấm **Create Credentials** → **OAuth client ID**
3. **Application type:** Web application
4. **Name:** RawVault Local (hoặc tên tùy chọn)
5. **Authorized redirect URIs** → **Add URI**:
   ```
   http://localhost:3000/api/storage/accounts/connect/callback
   ```
   - Nếu dev server chạy port khác (ví dụ 3001):
   ```
   http://localhost:3001/api/storage/accounts/connect/callback
   ```
6. Bấm **Create**
7. Copy **Client ID** và **Client secret**

---

## 5. Biến môi trường (.env.local)

Thêm vào `.env.local`:

```
# Google Drive OAuth
RAWVAULT_GDRIVE_CLIENT_ID=<Client ID vừa copy>
RAWVAULT_GDRIVE_CLIENT_SECRET=<Client secret vừa copy>
RAWVAULT_GDRIVE_OAUTH_CALLBACK_URL=http://localhost:3000/api/storage/accounts/connect/callback
```

**Lưu ý:** `RAWVAULT_GDRIVE_OAUTH_CALLBACK_URL` phải **trùng chính xác** với URI đã thêm trong Google Cloud Console.

---

## 6. OAuth state secret

Tạo key 32-byte cho `RAWVAULT_OAUTH_STATE_SECRET`:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

Thêm vào `.env.local`:

```
RAWVAULT_OAUTH_STATE_SECRET=<kết quả vừa tạo>
```

---

## 7. Chế độ Testing vs Production

### Testing (mặc định)

- Chỉ **Test users** đã thêm mới đăng nhập được
- Thêm email trong **OAuth consent screen** → **Test users**

### Production

- Bấm **PUBLISH APP** trong OAuth consent screen
- Mọi người có thể đăng nhập (app chưa verify sẽ có cảnh báo "unverified")

---

## 8. Xử lý lỗi thường gặp

### Error 400: redirect_uri_mismatch

Google báo lỗi khi `redirect_uri` gửi lên **không trùng** với bất kỳ **Authorized redirect URI** nào trong OAuth client.

**Cách sửa (làm đủ 3 bước):**

1. **Xác định đúng URL callback**
   - Dev: `http://localhost:<PORT>/api/storage/accounts/connect/callback`
   - `<PORT>` là port app đang chạy (mặc định `npm run dev` = 3000; nếu chạy `next dev -p 3002` thì dùng 3002).
   - Không thêm dấu `/` ở cuối.

2. **Sửa `.env.local`**
   ```bash
   RAWVAULT_GDRIVE_OAUTH_CALLBACK_URL=http://localhost:3000/api/storage/accounts/connect/callback
   ```
   Thay `3000` bằng đúng port của bạn.

3. **Thêm URI vào Google Cloud Console**
   - Vào [Credentials](https://console.cloud.google.com/apis/credentials) → chọn OAuth 2.0 Client ID (Web application).
   - Mục **Authorized redirect URIs** → **Add URI** → dán **đúng chuỗi** từ bước 1 (ví dụ `http://localhost:3000/api/storage/accounts/connect/callback`).
   - Bấm **Save**.

4. Restart dev server sau khi sửa `.env.local`.

**Cần khớp chính xác:** `http` vs `https`, port, không dư dấu `/`, không khoảng trắng.

### Error 403: access_denied — "app has not completed verification"

- App đang ở chế độ Testing
- Thêm email của bạn vào **Test users** trong OAuth consent screen

### Error 500: Failed to load linked account for token access

- Chạy Phase 4 migration: `supabase db push`
- Xem [README.md](./README.md) phần Troubleshooting

### Không thấy file có sẵn trong Drive (chỉ thấy file đã upload)

Nếu khi **Import from Drive** bạn thấy trống hoặc chỉ thấy file do app tạo, thường do **scope** hoặc **token cũ**.

1. **Google Cloud Console (project của app, ví dụ "Kompono")**
   - Vào **APIs & Services** → **OAuth consent screen** → **Edit app**.
   - Bước **Scopes** → **Add or Remove Scopes**.
   - Thêm scope: **`https://www.googleapis.com/auth/drive.readonly`** — *"See and download all your Google Drive files"*.
   - Lưu (Save and Continue).

2. **Trong app: Unlink rồi Connect lại Google Drive**
   - Token cũ (khi chưa có `drive.readonly`) không có quyền list file. Vào cài đặt / Storage accounts → **Unlink** account Google Drive → sau đó **Connect** lại. Khi đăng nhập Google, chấp nhận thêm quyền "See and download all your Google Drive files".

3. **Đúng chỗ để xem file Drive**
   - Trang chính vault chỉ hiển thị **file đã import** vào vault.
   - Để xem và chọn file **trong Drive**: mở **Add file** (hoặc **Add folder**) → tab **Import from Drive** → chọn account Google Drive → duyệt thư mục (click folder để vào sâu). Chọn file/folder rồi bấm Import để đưa vào vault.

---

## 9. Checklist

| Bước | Trạng thái |
|------|------------|
| Tạo Google Cloud project | ☐ |
| Bật Google Drive API | ☐ |
| Cấu hình OAuth consent screen | ☐ |
| Thêm Test users (nếu dùng Testing) | ☐ |
| Tạo OAuth client ID (Web application) | ☐ |
| Thêm Authorized redirect URI | ☐ |
| Copy Client ID và Client secret | ☐ |
| Thêm biến vào .env.local | ☐ |
| Tạo RAWVAULT_OAUTH_STATE_SECRET | ☐ |
| Restart dev server | ☐ |
