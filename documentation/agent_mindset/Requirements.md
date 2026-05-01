# Dynamic Form Builder System 

## 0. Scope Update (TopCV implementation)

This repo is implemented as a **NestJS backend** (`be/`) + **Next.js frontend** (`fe/`) integrated via **oRPC** (typed contracts / schemas via `@topcv/shared`).

### 0.1. Authentication (Required: Keycloak)

- **Identity provider**: Keycloak (OIDC).
- **User flows**:
  - **Login**: redirect / PKCE flow handled by frontend, session established via tokens.
  - **Register**: supported via Keycloak (self-registration or admin-created users, depending on realm settings).
  - **Logout**: terminate local session and Keycloak session.
- **Token handling (high-level)**:
  - Frontend stores the **minimum necessary** (prefer server-side session or httpOnly cookie; avoid long-lived access tokens in localStorage).
  - Backend validates **access tokens** on protected requests (JWT verification using Keycloak JWKS).
  - Token refresh strategy must be defined (refresh token rotation if used, or re-auth via Keycloak).

### 0.2. Authorization (Roles)

Role-based access control is required.

- **Roles**:
  - **admin**: manage forms (CRUD), manage fields, view submissions, access admin dashboard.
  - **staff**: view active forms, submit forms, view own submissions (if supported).
- **Enforcement**:
  - Backend is the **source of truth** for authorization.
  - Frontend may hide UI affordances, but must not be relied on for security.

### 0.3. Protected routes (Frontend + Backend)

- **Frontend**:
  - **Public**: `/login`, `/register` (or `/auth/*`), and any marketing / landing routes if present.
  - **Protected**:
    - **Staff**: forms list, form submit, submissions history.
    - **Admin**: form management pages + admin dashboard.
  - Route protection can be enforced using Next.js middleware and/or server components that require a valid session.
- **Backend**:
  - Protect oRPC/HTTP handlers with an auth guard that:
    - validates token signature/issuer/audience,
    - maps token claims → app roles (admin/staff),
    - rejects with consistent transport errors.

### 0.4. Dashboard (Wireframe + expectations)

Provide a simple dashboard that helps each role navigate and understand system state.

- **Admin dashboard** (example sections):
  - **At-a-glance stats**: total forms, active forms, draft forms, total submissions (and last 24h/7d if available).
  - **Recent activity**: latest submissions, recently created/updated forms.
  - **Quick actions**: create form, search forms, jump to submissions.
- **Staff dashboard** (example sections):
  - **Next actions**: active forms to fill (ordered), drafts hidden.
  - **My recent submissions**: last submitted forms + status.
  - **Profile / session**: current role, logout.

> Note: The remainder of this document is the original functional specification for the form builder. The Keycloak + roles + dashboard scope above is the required product framing for this codebase.

## 1. Tổng Quan
Bạn sẽ xây dựng một hệ thống quản lý form đơn giản, cho phép admin tạo các form với nhiều loại trường dữ liệu khác nhau (text, date, color...), và nhân viên SW có thể điền vào các form đó theo đúng thứ tự. Chúng tôi muốn đánh giá:  
- Khả năng thiết kế và tổ chức code rõ ràng, dễ đọc  
- Tư duy xây dựng tính năng có thể mở rộng  
- Hiểu biết cơ bản về REST API và database  
- Khả năng tự học và giải quyết vấn đề  
**Lưu ý**: Đây là bài test cho Young Talent – chúng tôi không kỳ vọng mọi tính năng phải hoàn hảo. Hãy tập trung vào chất lượng của những gì bạn làm được, và giải thích rõ tư duy của bạn.

## 2. Yêu Cầu Chức Năng
### 2.1. Quản Lý Form (Admin)
Admin có thể tạo, chỉnh sửa và xóa form. Mỗi form gồm các thông tin:
- Tên form (title)  
- Mô tả ngắn (description)  
- Thứ tự hiển thị (order) – dùng để sắp xếp danh sách form cho nhân viên  
- Trạng thái (status): active hoặc draft

### 2.2. Quản Lý Fields Trong Form
Mỗi form có nhiều field. Bạn cần hỗ trợ ít nhất 4 loại field sau:
| Loại field | Mô tả | Ví dụ validation |
|------------|--------|-------------------|
| text | Ô nhập văn bản | Bắt buộc nhập, tối đa 200 ký tự |
| number | Ô nhập số | Giá trị từ 0 đến 100 |
| date | Chọn ngày tháng | Không được chọn ngày quá khứ |
| color | Chọn màu sắc | Phải là mã HEX hợp lệ (#RRGGBB) |
| select | Dropdown chọn 1 giá trị | Phải chọn 1 trong các option cho sẵn |

Mỗi field có các thuộc tính:
- label – Tên hiển thị của field  
- type – Loại field (text, number, date, color, select)  
- order – Thứ tự trong form  
- required – Có bắt buộc điền không (true/false)  
- options – Danh sách lựa chọn (chỉ dùng cho type = select)

### 2.3. Nhân Viên SW Điền Form
Nhân viên SW thấy danh sách các form active được sắp xếp theo thứ tự. Khi chọn một form, họ điền dữ liệu vào từng field và submit. Hệ thống cần:  
- Validate dữ liệu theo đúng loại field và các quy tắc đã cấu hình  
- Lưu kết quả submission vào database  
- Trả về lỗi rõ ràng nếu dữ liệu không hợp lệ  
**Gợi ý**: Khi validate, bạn nên tách logic validate thành một lớp/module riêng thay vì viết thẳng vào controller. Điều này giúp dễ test và mở rộng sau này.

## 3. API Endpoints Cần Implement
Dưới đây là danh sách API cần xây dựng. Bạn không cần implement tất cả – hãy làm tốt những API cơ bản trước.
### 3.1. Form Management
- GET    /api/forms           Lấy danh sách tất cả form  
- POST   /api/forms           Tạo form mới  
- GET    /api/forms/:id       Lấy chi tiết 1 form (kèm danh sách field)  
- PUT    /api/forms/:id       Cập nhật thông tin form  
- DELETE /api/forms/:id       Xóa form

### 3.2. Field Management
- POST   /api/forms/:id/fields         Thêm field vào form  
- PUT    /api/forms/:id/fields/:fid    Cập nhật field  
- DELETE /api/forms/:id/fields/:fid    Xóa field

### 3.3. Submission (Nhân viên SW)
- GET    /api/forms/active         Danh sách form active, sắp theo thứ tự  
- POST   /api/forms/:id/submit     Nhân viên submit form  
- GET    /api/submissions          Xem lại danh sách bài đã submit  
**Điểm cộng**: Nếu có thêm thời gian, hãy implement API phân trang (pagination) cho GET /api/forms và xử lý lỗi thống nhất (error response format) cho toàn bộ API.

## 4. Yêu Cầu Kỹ Thuật
### 4.1. Bắt Buộc
- **Ngôn ngữ / Framework**: Tự chọn – khuyến khích Node.js, Python, hoặc Java  
- **Database**: Dùng bất kỳ DB quen thuộc (MySQL, PostgreSQL, MongoDB, SQLite)  
- **API**: RESTful, trả về JSON, có HTTP status code phù hợp  
- **Validation**: Validate input ở server – không chỉ dựa vào frontend  
- **README**: Hướng dẫn rõ cách cài đặt và chạy project

### 4.2. Điểm Cộng (Không Bắt Buộc)
- Viết unit test cho phần validation logic  
- Swagger / API documentation cơ bản  
- Docker Compose để dễ chạy local  
- Xử lý lỗi thống nhất, có message rõ ràng  
- Sắp xếp lại thứ tự field (drag & drop hoặc API reorder)

## 5. Tiêu Chí Đánh Giá
| Tiêu chí | Trọng số | Mô tả |
|-----------|----------|--------|
| Tính đúng đắn của tính năng | 35% | API hoạt động đúng, dữ liệu được lưu/đọc chính xác |
| Chất lượng & tổ chức code | 25% | Code dễ đọc, tên biến/hàm rõ ràng, tách layer hợp lý |
| Validation & xử lý lỗi | 20% | Lỗi rõ ràng, không crash khi input sai |
| Database schema | 10% | Thiết kế bảng hợp lý, quan hệ đúng |
| README & hướng dẫn | 10% | Chạy được theo hướng dẫn, giải thích quyết định thiết kế |

## 6. Nộp Bài
- Source code trên Git repository (GitHub/GitLab, để public hoặc add reviewer)  
- File README.md hướng dẫn cài đặt và chạy project  
- Database schema hoặc migration script (Tùy chọn)  
- Postman collection hoặc Swagger UI để test API  
**Gợi ý nộp bài**: Commit thường xuyên với message rõ ràng để reviewer thấy được quá trình làm việc của bạn. Điều này được đánh giá cao hơn 1 commit duy nhất với toàn bộ code.

## 7. Thời Gian & Lời Khuyên
- **Thời gian**: 5 ngày kể từ khi nhận đề.  
- **Gợi ý phân bổ thời gian**:  
  - Ngày 1: Đọc kỹ đề, thiết kế database schema, setup project  
  - Ngày 2–3: Implement API form và field management  
  - Ngày 4: Implement submission + validation  
  - Ngày 5: Viết README, test lại, dọn dẹp code  
**Quan trọng**: Nếu không kịp hoàn thành hết, đừng lo – hãy giải thích trong README bạn sẽ làm gì tiếp theo nếu có thêm thời gian. Chúng tôi đánh giá cao sự trung thực và tư duy hơn là số lượng tính năng.