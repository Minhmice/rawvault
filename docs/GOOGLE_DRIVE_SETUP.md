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
   - `https://www.googleapis.com/auth/drive.file`
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

- URL trong `.env.local` và Google Console phải **giống hệt nhau**
- Kiểm tra: `http` vs `https`, port, dấu `/` cuối
- Restart dev server sau khi sửa `.env.local`

### Error 403: access_denied — "app has not completed verification"

- App đang ở chế độ Testing
- Thêm email của bạn vào **Test users** trong OAuth consent screen

### Error 500: Failed to load linked account for token access

- Chạy Phase 4 migration: `supabase db push`
- Xem [README.md](./README.md) phần Troubleshooting

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
