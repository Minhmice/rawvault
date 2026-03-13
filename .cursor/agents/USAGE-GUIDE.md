# Hướng dẫn sử dụng Multi-Agent + Cursor Rules (Reusable)

Tài liệu này hướng dẫn cách dùng hệ thống multi-agent và Cursor rules theo hướng tái sử dụng cho nhiều project.

---

## 1. Tổng quan

Hệ thống có hai lớp hỗ trợ AI:

| Lớp | Vị trí | Mục đích |
|-----|--------|----------|
| **Multi-Agent System** | `.cursor/agents/` | Điều phối và chuyên gia (orchestrator, planner, frontend, backend, …) |
| **Cursor Rules** | `.cursor/rules/` | Quy tắc bền vững theo ngữ cảnh file / chủ đề |

Cursor rules tự áp dụng khi mở file khớp `globs`; multi-agent được gọi qua prompt hoặc orchestrator.

---

## 2. Cursor Rules – Frontend & Backend

### 2.1 Frontend Developer (`frontend-developer.mdc`)

**Kích hoạt khi**: Mở file `**/*.tsx`, `**/app/**/*.ts`, `**/components/**/*`

**Project stack (tùy biến)**:
- Framework UI (Next.js/React/Vue/Svelte)
- Styling system (Tailwind/CSS Modules/Design System)
- Auth/client SDK nếu có

**Dùng cho**:
- Trang, layout, component, routing
- Danh sách/chi tiết, loading/error/empty state
- Form, accessibility (a11y)

**Không dùng cho**:
- API routes, server logic, schema, migration

**Quy tắc chính**:
1. Ưu tiên Server Component; `"use client"` chỉ khi cần hooks/sự kiện
2. Dùng `components/ui/` có sẵn; thêm mới: `npx shadcn@latest add [tên]`
3. Tailwind utility classes; tránh inline style
4. Semantic HTML, `aria-*`, keyboard nav
5. Luôn xử lý loading, error, empty; kiểm tra contract API

---

### 2.2 Backend Developer (`backend-developer.mdc`)

**Kích hoạt khi**: Mở file `**/api/**/*.ts`, `**/app/api/**/*`

**Project stack (tùy biến)**:
- Runtime API (Next.js Route Handlers / Express / Fastify)
- Database and policy model
- Auth provider
- Validation library

**Dùng cho**:
- API routes (`app/api/`)
- Server actions với DB logic
- Kiểm tra auth, ownership, permission
- Điều phối integration/service calls

**Không dùng cho**:
- UI thuần
- Schema, migration, RLS (→ `database-specialist`)
- Infra/CI (→ `devops-engineer`)

**Quy tắc chính**:
1. Mọi route protected: verify `supabase.auth.getUser()`; trả 401 nếu chưa đăng nhập
2. Kiểm tra `user_id` / `owner_id` trước thao tác file/folder/share
3. Validate input bằng Zod; 400 + message rõ ràng khi lỗi
4. Không expose `access_token`, `refresh_token` ra client

---

### 2.3 Backend Architect (`backend-architect.mdc`)

**Mục đích**: Thiết kế kiến trúc, schema, API contract, không implement chi tiết.

**Dùng khi**: thiết kế kiến trúc hệ thống, schema, API contract, phân rã service, reliability/security strategy.

---

## 3. Multi-Agent System

### 3.1 Khi nào dùng Orchestrator

- Yêu cầu nhiều bước, đụng nhiều domain (FE + BE + DB)
- Phạm vi không rõ, cần phân rã
- Muốn luồng chuẩn: plan → implement → review → QA → docs

Gợi ý prompt: *"Phân tích và lên kế hoạch triển khai feature X"* hoặc *"Triển khai tính năng Y từ đầu đến cuối"*.

### 3.2 Khi nào dùng specialist trực tiếp

- Đã rõ phạm vi: *"Implement UI cho explorer"* → frontend-developer
- Đã rõ API: *"Thêm route upload dispatch"* → backend-developer
- Chỉ cần review: *"Review đoạn code này"* → code-reviewer

### 3.3 Mapping nhanh (Prompt → Agent)

| Prompt chứa | Agent gợi ý |
|-------------|-------------|
| `plan`, `decompose`, `roadmap` | planner |
| `UI`, `component`, `page`, `a11y` | frontend-developer |
| `API`, `route`, `auth`, `server` | backend-developer |
| `schema`, `migration`, `RLS` | database-specialist |
| `review`, `security`, `risk` | code-reviewer |
| `test`, `verify`, `edge case` | qa-tester |
| `deploy`, `pipeline`, `rollback` | devops-engineer |
| `docs`, `README`, `runbook` | documentation-writer |

Chi tiết: xem [`.cursor/agents/routing/rules.yaml`](routing/rules.yaml) và [delegation-matrix.md](routing/delegation-matrix.md).

---

## 4. Workflow đề xuất

### Feature mới (ví dụ: module quản lý tài nguyên)

1. **Product / Scope** (nếu chưa rõ): *"Xác định acceptance criteria cho module X"* → product-manager
2. **Plan**: *"Lên plan triển khai module X"* → planner
3. **Implement**:
   - FE: *"Implement UI cho luồng người dùng chính"* (mở file `.tsx` → rule frontend)
   - BE: *"Implement API cho luồng dữ liệu chính"* (mở file API → rule backend)
4. **Review**: *"Review thay đổi auth và permission"* → code-reviewer
5. **QA**: *"Test edge cases và regression"* → qa-tester
6. **Docs** (nếu cần): *"Cập nhật README/API docs"* → documentation-writer

### Bug fix

1. *"Debug trạng thái bị kẹt/không đồng bộ"* → debugger
2. *"Review fix trước khi merge"* → code-reviewer
3. *"Verify không tái phát"* → qa-tester

---

## 5. Kết hợp Rules với Agents

- **Rule tự động**: Mở file `.tsx` → frontend-developer rule được load; prompt sẽ có ngữ cảnh phù hợp.
- **Agent thủ công**: Gọi trực tiếp, ví dụ *"Làm vai trò frontend developer, implement FileItem component"*.
- **Orchestrator**: Prompt như *"Triển khai feature X end-to-end"* → orchestrator sẽ route sang planner, rồi specialist phù hợp.

---

## 6. Thư mục quan trọng

```
.cursor/
├── agents/                    # Multi-agent system
│   ├── registry.yaml         # Danh sách agent
│   ├── orchestrator/         # Skill orchestrator
│   ├── specialists/          # Các specialist (planner, frontend, backend, …)
│   ├── routing/              # Routing rules, delegation matrix
│   ├── shared/               # Contract, templates, checklists
│   └── compat/               # External skill compatibility
└── rules/                    # Cursor rules
    ├── frontend-developer.mdc # Rule frontend
    ├── backend-developer.mdc  # Rule backend (implementation)
    └── backend-architect.mdc # Rule backend (architecture)
```

---

## 7. Lưu ý khi tái sử dụng cho project khác

- Đổi `description` + `globs` trong từng rule theo cấu trúc codebase mới.
- Cập nhật mục `Project Stack Context` trong rule frontend/backend cho đúng stack.
- Giữ nguyên boundaries để tránh chồng vai trò giữa FE/BE/DB/DevOps.
- Import skill ngoài: xem [`.cursor/agents/compat/external-skill-map.yaml`](compat/external-skill-map.yaml) và [conflict-resolution.md](compat/conflict-resolution.md).
- Dùng template rút gọn: [`.cursor/agents/RULES-TEMPLATE.md`](RULES-TEMPLATE.md).
