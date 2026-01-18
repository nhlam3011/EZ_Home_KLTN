# CHƯƠNG 4: KẾT QUẢ VÀ THẢO LUẬN

## 4.1. Giới thiệu

Chương này trình bày chi tiết về kết quả triển khai hệ thống quản lý nhà trọ EZ-Home, bao gồm các chức năng đã hoàn thành, giao diện người dùng, kiến trúc hệ thống, và các thảo luận liên quan đến quá trình phát triển. Hệ thống được xây dựng với mục tiêu số hóa toàn bộ quy trình quản lý nhà trọ, từ quản lý phòng, cư dân, hóa đơn, bảo trì đến thanh toán và cộng đồng.

## 4.2. Tổng quan hệ thống đã triển khai

### 4.2.1. Công nghệ sử dụng

Hệ thống EZ-Home được xây dựng dựa trên các công nghệ hiện đại:

**Frontend:**
- Next.js 16 - Framework React với khả năng render phía server (SSR)
- React 19.2.3 - Thư viện UI component
- Tailwind CSS 4 - Framework CSS utility-first
- Lucide React - Thư viện icon hiện đại
- TypeScript - Ngôn ngữ lập trình có kiểu tĩnh

**Backend:**
- Next.js API Routes - RESTful API
- Prisma ORM 5.10.2 - Object-Relational Mapping
- PostgreSQL - Hệ quản trị cơ sở dữ liệu quan hệ
- bcryptjs - Mã hóa mật khẩu
- NextAuth 4.24.5 - Xác thực và phân quyền

**Tích hợp bên thứ ba:**
- VietQR API - Thanh toán qua QR code
- Nodemailer - Gửi email thông báo
- jsPDF & html2canvas - Xuất PDF
- XLSX - Import/Export Excel

### 4.2.2. Kiến trúc hệ thống

Hệ thống sử dụng kiến trúc Monolithic với Next.js, tích hợp cả frontend và backend trong cùng một ứng dụng:

```
├── app/                      # Next.js App Router
│   ├── admin/               # Giao diện quản trị
│   ├── tenant/              # Giao diện người thuê
│   ├── api/                 # API Routes
│   ├── components/          # Shared components
│   └── contexts/            # React Contexts
├── lib/                     # Utilities và helpers
├── prisma/                  # Database schema & migrations
├── public/                  # Static assets
└── scripts/                 # Automation scripts
```

### 4.2.3. Cơ sở dữ liệu

Hệ thống sử dụng 15 bảng chính với các quan hệ phức tạp:

- **User**: Quản lý người dùng (admin và tenant)
- **Room**: Quản lý phòng trọ
- **Contract**: Quản lý hợp đồng thuê
- **ContractOccupant**: Quản lý người ở cùng
- **Invoice**: Quản lý hóa đơn
- **Payment**: Quản lý giao dịch thanh toán
- **MeterReading**: Quản lý chỉ số điện nước
- **Service**: Quản lý dịch vụ
- **ServiceOrder**: Quản lý đơn đặt dịch vụ
- **Issue**: Quản lý sự cố bảo trì
- **Post**: Quản lý bài đăng cộng đồng
- **Asset**: Quản lý tài sản phòng
- **Document**: Quản lý tài liệu
- **AiForecast**: Dự báo doanh thu bằng AI

## 4.3. Các chức năng đã triển khai

### 4.3.1. Module Xác thực và Phân quyền

**a) Đăng nhập và Bảo mật**

Hệ thống triển khai cơ chế xác thực 2 vai trò (Admin và Tenant) với các đặc điểm:

- **Mật khẩu mặc định**: Khi tạo tài khoản mới cho tenant, hệ thống tự động set mật khẩu = số CCCD
- **Đăng nhập lần đầu**: Hệ thống bắt buộc đổi mật khẩu lần đầu tiên (flag `isFirstLogin`)
- **Mã hóa**: Tất cả mật khẩu được hash bằng bcryptjs với salt rounds = 10
- **Session management**: Sử dụng localStorage để lưu thông tin phiên làm việc

**b) Quản lý mật khẩu**

- Đổi mật khẩu cho tenant (yêu cầu mật khẩu cũ)
- Reset mật khẩu cho admin (không yêu cầu mật khẩu cũ)
- Kiểm tra độ mạnh mật khẩu (tối thiểu 6 ký tự)

**Ảnh giao diện**: Màn hình đăng nhập với form nhập số điện thoại và mật khẩu, hỗ trợ dark mode.

### 4.3.2. Module Quản lý Phòng (Admin)

**a) Danh sách phòng**

Hiển thị toàn bộ phòng với các thông tin:
- Tên phòng, tầng
- Diện tích, giá thuê
- Trạng thái: Available (Trống), Rented (Đang thuê), Maintenance (Đang sửa)
- Số người tối đa
- Tài sản trong phòng

**b) Thêm phòng mới**

Form nhập thông tin:
- Tên phòng (bắt buộc, unique)
- Tầng (số nguyên)
- Giá thuê (decimal)
- Diện tích (m²)
- Số người tối đa
- Trạng thái ban đầu

**c) Chi tiết và Chỉnh sửa phòng**

- Xem thông tin chi tiết phòng
- Lịch sử hợp đồng của phòng
- Danh sách tài sản trong phòng (thêm, sửa, xóa)
- Cập nhật trạng thái phòng
- Xem chỉ số điện nước theo tháng

**d) Quản lý tài sản phòng**

Mỗi phòng có danh sách tài sản với:
- Tên tài sản (ví dụ: Điều hòa Daikin, Tủ lạnh Samsung)
- Danh mục (Điện máy, Nội thất)
- Trạng thái: Good (Tốt), Broken (Hỏng), Maintenance (Đang sửa), Liquidated (Thanh lý)
- Ngày mua
- Giá trị
- Ghi chú

**Ảnh giao diện**: 
- Bảng danh sách phòng với filter và search
- Form tạo/sửa phòng
- Trang chi tiết phòng với tabs (Thông tin, Hợp đồng, Tài sản, Chỉ số)

### 4.3.3. Module Quản lý Cư dân (Admin)

**a) Danh sách cư dân**

Hiển thị toàn bộ cư dân với thông tin:
- Họ tên, số điện thoại
- Số CCCD, ngày sinh
- Phòng đang thuê (nếu có)
- Trạng thái hợp đồng (Active/Terminated)
- Ngày bắt đầu thuê

**b) Thêm cư dân mới**

Quy trình tạo cư dân mới bao gồm:

**Bước 1: Nhập thông tin cá nhân**
- Họ tên (bắt buộc)
- Số điện thoại (bắt buộc, unique)
- Email (tùy chọn)
- Số CCCD (bắt buộc, unique)
- Ngày cấp, nơi cấp CCCD
- Ngày sinh, giới tính
- Địa chỉ thường trú
- Nghề nghiệp
- Biển số xe (nếu có)

**Bước 2: Thông tin hợp đồng**
- Chọn phòng (chỉ hiển thị phòng Available)
- Ngày bắt đầu hợp đồng (mặc định hôm nay)
- Ngày kết thúc (tùy chọn)
- Tiền cọc
- Giá thuê (tự động lấy từ giá phòng, có thể điều chỉnh)

**Bước 3: Thêm người ở cùng (tùy chọn)**
- Họ tên người ở cùng
- Số CCCD
- Số điện thoại
- Ngày sinh
- Quan hệ với chủ hợp đồng (Vợ/Chồng, Con, Bạn, etc.)

**Xử lý tự động khi tạo cư dân mới:**
1. Tạo User với password = CCCD (đã hash)
2. Set `isFirstLogin = true`
3. Tạo Contract với status = ACTIVE
4. Cập nhật Room status thành RENTED
5. Tạo các bản ghi ContractOccupant (nếu có)

**c) Chi tiết cư dân**

Trang chi tiết cư dân với nhiều tabs:

**Tab Thông tin**
- Ảnh đại diện (có thể upload)
- Thông tin cá nhân đầy đủ
- Thông tin CCCD
- Thông tin liên hệ

**Tab Hợp đồng**
- Thông tin hợp đồng hiện tại
- Phòng đang thuê
- Ngày bắt đầu/kết thúc
- Tiền cọc, giá thuê
- Danh sách người ở cùng
- Lịch sử hợp đồng

**Tab Hóa đơn**
- Danh sách hóa đơn của cư dân
- Filter theo trạng thái, tháng/năm
- Tổng doanh thu từ cư dân này

**Tab Tài liệu**
- Upload và quản lý tài liệu
- Hợp đồng scan
- CCCD scan
- Các giấy tờ khác

**d) Chỉnh sửa cư dân**

Cho phép cập nhật:
- Thông tin cá nhân
- Thông tin CCCD
- Ảnh đại diện

**e) Trả phòng (Checkout)**

Quy trình trả phòng:
1. Kết thúc hợp đồng (set endDate = hôm nay, status = TERMINATED)
2. Cập nhật Room status về AVAILABLE
3. Tính toán và hoàn trả tiền cọc (nếu có)

**f) Reset mật khẩu cư dân**

Admin có thể reset mật khẩu về CCCD cho cư dân quên mật khẩu.

**Ảnh giao diện**:
- Bảng danh sách cư dân với filter và search
- Form tạo cư dân mới (multi-step)
- Trang chi tiết cư dân với tabs
- Modal xác nhận trả phòng

### 4.3.4. Module Quản lý Hóa đơn (Admin)

**a) Danh sách hóa đơn**

Hiển thị tất cả hóa đơn với:
- Tháng/năm
- Tên cư dân
- Phòng
- Tổng tiền
- Trạng thái: Unpaid (Chưa thanh toán), Paid (Đã thanh toán), Overdue (Quá hạn)
- Ngày thanh toán (nếu có)
- Actions: Xem, Sửa, Xuất PDF, Gửi tin nhắn nhắc nhở

**b) Tạo hóa đơn tự động hàng loạt**

Chức năng "Phát hành hóa đơn tháng":
1. Chọn tháng/năm
2. Hệ thống tự động tạo hóa đơn cho tất cả hợp đồng đang Active
3. Tính toán các khoản:
   - **Tiền phòng**: Lấy từ Contract.rentPrice
   - **Tiền điện**: (Chỉ số mới - Chỉ số cũ) × Đơn giá điện (từ Service)
   - **Tiền nước**: (Chỉ số mới - Chỉ số cũ) × Đơn giá nước (từ Service)
   - **Phí dịch vụ chung**: Lấy từ Service (quản lý, vệ sinh, bảo vệ)
   - **Phí sửa chữa**: Tổng repairCost từ các Issue DONE trong tháng
   - **Tổng cộng**: Sum tất cả các khoản

**c) Nhập chỉ số điện nước hàng loạt**

Chức năng nhập chỉ số cho nhiều phòng:
- Hiển thị danh sách phòng đang thuê
- Lấy chỉ số cũ từ tháng trước (tự động)
- Nhập chỉ số mới cho từng phòng
- Tự động tính điện/nước tiêu thụ
- Lưu vào bảng MeterReading

**d) Tạo hóa đơn thủ công**

Form tạo hóa đơn cho trường hợp đặc biệt:
- Chọn hợp đồng
- Chọn tháng/năm
- Nhập các khoản phí (hoặc tự động tính)
- Tổng tiền tự động cập nhật

**e) Chỉnh sửa hóa đơn**

Cho phép điều chỉnh các khoản phí trước khi cư dân thanh toán.

**f) Xuất PDF hóa đơn**

- Generate PDF với template chuẩn
- Hiển thị đầy đủ thông tin: logo, thông tin chủ nhà, thông tin cư dân, bảng chi tiết các khoản phí
- Download trực tiếp

**g) Gửi tin nhắn nhắc nhở**

- Gửi email hoặc SMS nhắc cư dân thanh toán
- Template tin nhắn tùy chỉnh
- Lưu lịch sử gửi tin

**h) Import/Export Excel**

- Import hóa đơn từ file Excel
- Export danh sách hóa đơn ra Excel để báo cáo

**Ảnh giao diện**:
- Bảng danh sách hóa đơn với nhiều filter
- Modal phát hành hóa đơn tháng
- Form nhập chỉ số điện nước hàng loạt
- Form tạo/sửa hóa đơn
- Preview PDF hóa đơn

### 4.3.5. Module Quản lý Dịch vụ (Admin)

**a) Danh sách dịch vụ**

Hiển thị các loại dịch vụ:
- Tên dịch vụ (Điện, Nước, Gas, Giặt ủi, Dọn dẹp, Quản lý, Bảo vệ, etc.)
- Đơn giá
- Đơn vị (kWh, m³, lần, kg, tháng)
- Trạng thái (Active/Inactive)

**b) Thêm/Sửa dịch vụ**

Form quản lý dịch vụ:
- Tên dịch vụ
- Đơn giá (decimal)
- Đơn vị
- Mô tả (tùy chọn)
- Trạng thái hoạt động

**c) Quản lý đơn đặt dịch vụ**

Hiển thị danh sách đơn đặt dịch vụ từ tenant:
- Tên cư dân, phòng
- Dịch vụ đã đặt
- Số lượng, tổng tiền
- Trạng thái: Pending (Chờ xử lý), Processing (Đang xử lý), Done (Hoàn thành), Cancelled (Hủy)
- Ngày đặt

**d) Xử lý đơn dịch vụ**

- Xác nhận đơn (chuyển sang Processing)
- Hoàn thành đơn (chuyển sang Done)
- Hủy đơn (chuyển sang Cancelled)
- Khi Done: Tự động tính phí vào hóa đơn tháng đó

**Ảnh giao diện**:
- Bảng danh sách dịch vụ
- Form thêm/sửa dịch vụ
- Danh sách đơn đặt dịch vụ với filter
- Modal xử lý đơn

### 4.3.6. Module Bảo trì và Sự cố (Admin)

**a) Danh sách sự cố**

Hiển thị tất cả sự cố báo cáo từ tenant:
- Tiêu đề sự cố
- Mô tả
- Phòng, cư dân
- Ảnh minh họa (có thể có nhiều ảnh)
- Chi phí sửa chữa (nếu có)
- Trạng thái: Pending, Processing, Done, Cancelled
- Ngày báo cáo

**b) Xử lý sự cố**

Quy trình xử lý:
1. Xem chi tiết sự cố (mô tả, ảnh)
2. Xác nhận tiếp nhận (chuyển sang Processing)
3. Nhập chi phí sửa chữa (repairCost)
4. Hoàn thành (chuyển sang Done)
   - Chi phí tự động được tính vào hóa đơn tháng đó (amountService)

**c) Thống kê sự cố**

- Tổng số sự cố theo trạng thái
- Sự cố theo phòng
- Chi phí sửa chữa theo tháng

**Ảnh giao diện**:
- Bảng danh sách sự cố với filter
- Trang chi tiết sự cố với gallery ảnh
- Modal xử lý và nhập chi phí

### 4.3.7. Module Tài chính (Admin)

**a) Tổng quan tài chính**

Dashboard tài chính hiển thị:
- Tổng doanh thu tháng này
- Doanh thu đã thu (Paid invoices)
- Công nợ (Unpaid invoices)
- Biểu đồ doanh thu theo tháng (line chart)
- Top 5 cư dân nợ nhiều nhất

**b) Báo cáo doanh thu**

- Filter theo khoảng thời gian
- Xuất báo cáo Excel
- Biểu đồ phân tích theo:
  - Loại dịch vụ (Phòng, Điện, Nước, Dịch vụ khác)
  - Trạng thái thanh toán
  - Phòng/Tầng

**c) Dự báo doanh thu bằng AI**

Chức năng dự báo sử dụng thuật toán Machine Learning đơn giản:
- Phân tích dữ liệu doanh thu 12 tháng gần nhất
- Dự báo doanh thu 3 tháng tiếp theo
- Hiển thị biểu đồ so sánh thực tế vs dự báo
- Lưu kết quả dự báo vào bảng AiForecast

**Ảnh giao diện**:
- Dashboard với cards và charts
- Bảng báo cáo doanh thu chi tiết
- Biểu đồ dự báo AI

### 4.3.8. Module Cộng đồng (Admin)

**a) Quản lý bài đăng**

Hiển thị các bài đăng từ tenant và admin:
- Nội dung bài đăng
- Ảnh đính kèm (nếu có)
- Người đăng
- Trạng thái: Pending (Chờ duyệt), Public (Đã duyệt)
- Ngày đăng

**b) Duyệt bài đăng**

- Xem chi tiết bài đăng
- Phê duyệt (chuyển sang Public)
- Từ chối (xóa hoặc yêu cầu chỉnh sửa)

**c) Tạo bài đăng từ Admin**

Admin có thể đăng thông báo, tin tức:
- Nhập nội dung
- Upload ảnh (hỗ trợ nhiều ảnh)
- Bài đăng từ admin tự động Public

**Ảnh giao diện**:
- Feed bài đăng dạng card
- Modal tạo bài đăng
- Modal duyệt bài

### 4.3.9. Tenant Portal - Dashboard

**a) Tổng quan**

Dashboard tenant hiển thị:
- Thông tin cá nhân (tên, phòng, hợp đồng)
- Ảnh đại diện
- Hóa đơn tháng này (số tiền, trạng thái)
- Số sự cố đang xử lý
- Thông báo mới
- Quick actions: Thanh toán, Báo sự cố, Đặt dịch vụ

**b) Cập nhật thông tin cá nhân**

- Chỉnh sửa họ tên, email
- Upload ảnh đại diện
- Xem thông tin hợp đồng (read-only)

**Ảnh giao diện**:
- Dashboard cards với icons
- Profile page

### 4.3.10. Tenant Portal - Hóa đơn

**a) Danh sách hóa đơn của tôi**

Hiển thị hóa đơn của tenant:
- Tháng/năm
- Các khoản phí chi tiết
- Tổng tiền
- Trạng thái
- Hành động: Xem chi tiết, Thanh toán, Xuất PDF

**b) Chi tiết hóa đơn**

Hiển thị đầy đủ:
- Thông tin phòng
- Bảng chi tiết:
  - Tiền phòng
  - Điện: Chỉ số cũ → Chỉ số mới (Tiêu thụ × Đơn giá)
  - Nước: Chỉ số cũ → Chỉ số mới (Tiêu thụ × Đơn giá)
  - Phí dịch vụ chung
  - Phí sửa chữa (nếu có)
  - Tổng cộng
- Lịch sử thanh toán (nếu có nhiều lần thanh toán từng phần)
- Nút "Thanh toán ngay"

**c) Thanh toán hóa đơn**

Hỗ trợ nhiều phương thức:

**1. Tiền mặt (Cash)**
- Tenant chọn "Thanh toán tiền mặt"
- Admin xác nhận đã nhận tiền
- Cập nhật trạng thái Invoice thành Paid

**2. Chuyển khoản ngân hàng (Bank Transfer)**
- Hiển thị thông tin tài khoản chủ nhà
- Tenant chuyển khoản và cập nhật mã giao dịch
- Admin xác nhận

**3. VietQR (Tích hợp thanh toán QR)**

Quy trình VietQR:
1. Tenant chọn "Thanh toán VietQR"
2. Hệ thống gọi VietQR API để tạo mã QR
3. Hiển thị mã QR code để quét
4. Tenant quét mã bằng app ngân hàng và thanh toán
5. VietQR gọi callback URL khi thanh toán thành công
6. Hệ thống tự động cập nhật trạng thái hóa đơn

**d) Khiếu nại hóa đơn**

Nếu tenant thấy hóa đơn không đúng:
- Gửi khiếu nại với nội dung cụ thể
- Admin xem và xử lý
- Có thể chỉnh sửa hóa đơn nếu hợp lý

**e) Xuất PDF hóa đơn**

Tenant có thể download PDF hóa đơn để lưu trữ.

**Ảnh giao diện**:
- Danh sách hóa đơn dạng card
- Chi tiết hóa đơn với bảng tính phí
- Modal chọn phương thức thanh toán
- Hiển thị QR code VietQR
- Form khiếu nại

### 4.3.11. Tenant Portal - Đặt dịch vụ

**a) Danh sách dịch vụ**

Hiển thị các dịch vụ đang hoạt động:
- Tên dịch vụ
- Đơn giá
- Đơn vị
- Mô tả
- Nút "Đặt dịch vụ"

**b) Đặt dịch vụ**

Form đặt dịch vụ:
- Chọn dịch vụ
- Nhập số lượng
- Ghi chú (tùy chọn)
- Xem tổng tiền tạm tính
- Xác nhận đặt

**c) Lịch sử đơn dịch vụ**

Xem các đơn đã đặt:
- Dịch vụ, số lượng, tổng tiền
- Trạng thái
- Ngày đặt
- Có thể hủy đơn nếu đang Pending

**Ảnh giao diện**:
- Grid cards dịch vụ
- Modal đặt dịch vụ
- Danh sách đơn dịch vụ

### 4.3.12. Tenant Portal - Báo cáo Sự cố

**a) Báo cáo sự cố mới**

Form báo sự cố:
- Tiêu đề (vấn đề gì?)
- Mô tả chi tiết
- Upload ảnh minh họa (có thể nhiều ảnh)
- Phòng (tự động lấy từ hợp đồng)
- Gửi báo cáo

**b) Danh sách sự cố của tôi**

Xem các sự cố đã báo:
- Tiêu đề, trạng thái
- Ngày báo cáo
- Chi phí sửa chữa (nếu đã xử lý xong)
- Có thể xem chi tiết

**c) Chi tiết sự cố**

- Xem đầy đủ thông tin sự cố
- Ảnh minh họa
- Lịch sử xử lý (Pending → Processing → Done)
- Nếu Done: Hiển thị chi phí sửa chữa sẽ được tính vào hóa đơn
- Đánh giá chất lượng xử lý (rating)

**d) Đánh giá chất lượng**

Sau khi sự cố Done, tenant có thể:
- Đánh giá sao (1-5 sao)
- Nhận xét

**Ảnh giao diện**:
- Form báo sự cố với image uploader
- Danh sách sự cố dạng timeline
- Chi tiết sự cố với gallery ảnh
- Modal đánh giá

### 4.3.13. Tenant Portal - Cộng đồng

**a) Xem bài đăng**

Hiển thị các bài đăng đã được duyệt:
- Bài đăng từ admin (thông báo, tin tức)
- Bài đăng từ tenant khác
- Nội dung, ảnh
- Tên người đăng, ngày đăng

**b) Tạo bài đăng**

Tenant có thể đăng bài:
- Nhập nội dung
- Upload ảnh
- Gửi bài (trạng thái Pending, chờ admin duyệt)

**c) Bài đăng của tôi**

Xem các bài đã đăng và trạng thái (Pending/Public).

**Ảnh giao diện**:
- Feed bài đăng dạng social media
- Modal tạo bài đăng
- Danh sách bài của tôi

### 4.3.14. Tenant Portal - Tin nhắn và Thông báo

**a) Tin nhắn**

Hệ thống tin nhắn đơn giản:
- Nhận tin nhắn từ admin (nhắc thanh toán, thông báo)
- Hiển thị số tin nhắn chưa đọc
- Đánh dấu đã đọc

**b) Thông báo**

Hệ thống thông báo tự động:
- Hóa đơn mới được phát hành
- Sự cố đã được xử lý
- Đơn dịch vụ đã hoàn thành
- Bài đăng được duyệt

**Ảnh giao diện**:
- Danh sách tin nhắn dạng inbox
- Dropdown thông báo với badge đếm

### 4.3.15. Tính năng Dark Mode

Hệ thống hỗ trợ chế độ sáng/tối:
- Tự động lưu preference vào localStorage
- Toggle button ở header
- Tất cả màn hình đều responsive với dark mode
- Sử dụng Tailwind dark: prefix

**Ảnh giao diện**:
- So sánh giao diện Light vs Dark mode

## 4.4. Luồng nghiệp vụ chi tiết

### 4.4.1. Luồng tạo hợp đồng mới

```
[Admin] Tạo cư dân mới
  ↓
Nhập thông tin cá nhân + Chọn phòng + Thông tin hợp đồng
  ↓
Hệ thống tự động:
  1. Tạo User (password = CCCD hash, isFirstLogin = true)
  2. Tạo Contract (status = ACTIVE)
  3. Cập nhật Room (status = RENTED)
  4. Tạo ContractOccupant (nếu có người ở cùng)
  ↓
Gửi email thông báo cho tenant (username + password mặc định)
```

### 4.4.2. Luồng đăng nhập lần đầu

```
[Tenant] Truy cập /login
  ↓
Nhập phone + password (= CCCD)
  ↓
Hệ thống kiểm tra isFirstLogin === true?
  ↓ Yes
Redirect đến /change-password (bắt buộc)
  ↓
Tenant nhập mật khẩu mới
  ↓
Cập nhật password mới + set isFirstLogin = false
  ↓
Redirect đến /tenant (Dashboard)
```

### 4.4.3. Luồng phát hành hóa đơn tháng

```
[Admin] Chọn "Phát hành hóa đơn tháng X/Y"
  ↓
Hệ thống kiểm tra đã phát hành chưa?
  ↓ Chưa
Lặp qua tất cả Contract có status = ACTIVE:
  ↓
  Tính các khoản phí:
    - Tiền phòng: Contract.rentPrice
    - Điện: (MeterReading.elecNew - elecOld) × Service[Điện].unitPrice
    - Nước: (MeterReading.waterNew - waterOld) × Service[Nước].unitPrice
    - Phí dịch vụ chung: Service[Quản lý + Vệ sinh + Bảo vệ]
    - Phí sửa chữa: SUM(Issue.repairCost WHERE status=DONE AND month=X)
  ↓
  Tạo Invoice với tổng tiền
  ↓
Hiển thị thông báo: "Đã tạo N hóa đơn"
  ↓
Gửi email thông báo cho từng tenant
```

### 4.4.4. Luồng thanh toán VietQR

```
[Tenant] Xem chi tiết hóa đơn → Chọn "Thanh toán VietQR"
  ↓
[Frontend] Gọi API: POST /api/payments/vietqr/create
  ↓
[Backend] 
  1. Tạo Payment record (status = PENDING)
  2. Gọi VietQR API với thông tin:
     - Số tài khoản chủ nhà
     - Số tiền
     - Nội dung: "THANHTOAN HOA_DON_123"
  3. Nhận response: qrCode (base64 image), qrString
  4. Lưu vào Payment record
  ↓
[Frontend] Hiển thị QR code
  ↓
[Tenant] Quét QR bằng app ngân hàng → Thanh toán
  ↓
[VietQR] Gọi callback: POST /api/payments/vietqr/callback
  ↓
[Backend]
  1. Xác thực callback
  2. Tìm Payment theo transactionId
  3. Cập nhật Payment (status = SUCCESS, paidAt = now)
  4. Cập nhật Invoice (status = PAID, paidAt = now)
  5. Gửi email xác nhận đã thanh toán
  ↓
[Frontend] Auto-refresh → Hiển thị trạng thái "Đã thanh toán"
```

### 4.4.5. Luồng xử lý sự cố

```
[Tenant] Báo sự cố → Nhập thông tin + Upload ảnh
  ↓
[Backend] Tạo Issue (status = PENDING)
  ↓
Gửi thông báo cho Admin
  ↓
[Admin] Xem danh sách sự cố → Chọn sự cố
  ↓
Xác nhận tiếp nhận (status = PROCESSING)
  ↓
Xử lý sự cố thực tế (sửa chữa, thay thế)
  ↓
Nhập chi phí sửa chữa (repairCost)
  ↓
Hoàn thành (status = DONE)
  ↓
[Backend] 
  1. Chi phí tự động tính vào Invoice.amountService của tháng đó
  2. Gửi thông báo cho Tenant
  ↓
[Tenant] Đánh giá chất lượng xử lý
```

## 4.5. Kiến trúc và Công nghệ

### 4.5.1. Kiến trúc tổng thể

Hệ thống sử dụng kiến trúc **Monolithic** với **Next.js Full-stack Framework**:

```
┌─────────────────────────────────────────────┐
│           Browser (Client)                  │
│  - React Components                         │
│  - Tailwind CSS                             │
│  - Client-side State Management             │
└──────────────┬──────────────────────────────┘
               │ HTTP/HTTPS
┌──────────────▼──────────────────────────────┐
│         Next.js App Router                  │
│  ┌─────────────────────────────────────┐   │
│  │  Pages (SSR/CSR)                    │   │
│  │  - /admin/*                         │   │
│  │  - /tenant/*                        │   │
│  │  - /login, /change-password         │   │
│  └─────────────────────────────────────┘   │
│  ┌─────────────────────────────────────┐   │
│  │  API Routes (RESTful)               │   │
│  │  - /api/auth/*                      │   │
│  │  - /api/admin/*                     │   │
│  │  - /api/tenant/*                    │   │
│  │  - /api/invoices/*                  │   │
│  │  - /api/payments/vietqr/*           │   │
│  └─────────────┬───────────────────────┘   │
└────────────────┼───────────────────────────┘
                 │
┌────────────────▼───────────────────────────┐
│       Prisma ORM                           │
│  - Type-safe database client               │
│  - Query builder                           │
│  - Migration management                    │
└────────────────┬───────────────────────────┘
                 │
┌────────────────▼───────────────────────────┐
│       PostgreSQL Database                  │
│  - Relational data storage                 │
│  - 15 tables with foreign keys             │
└────────────────────────────────────────────┘

┌────────────────────────────────────────────┐
│       External Integrations                │
│  - VietQR API (Payment gateway)            │
│  - SMTP Server (Email notifications)       │
└────────────────────────────────────────────┘
```

**Ưu điểm của kiến trúc này:**
- Dễ phát triển và deploy (một codebase duy nhất)
- Chia sẻ code dễ dàng giữa frontend và backend
- Type-safety với TypeScript xuyên suốt
- SSR giúp SEO tốt và performance tốt
- API Routes tích hợp sẵn, không cần setup server riêng

**Nhược điểm:**
- Khó scale khi lượng user tăng cao
- Không phù hợp cho microservices

### 4.5.2. Cơ sở dữ liệu

**Schema quan trọng:**

```
User (Người dùng)
  ├── 1:N → Contract (Hợp đồng)
  ├── 1:N → Issue (Sự cố)
  ├── 1:N → ServiceOrder (Đơn dịch vụ)
  ├── 1:N → Post (Bài đăng)
  └── 1:N → Document (Tài liệu)

Room (Phòng)
  ├── 1:N → Contract (Hợp đồng)
  ├── 1:N → Asset (Tài sản)
  ├── 1:N → MeterReading (Chỉ số điện nước)
  └── 1:N → Issue (Sự cố)

Contract (Hợp đồng)
  ├── N:1 → User
  ├── N:1 → Room
  ├── 1:N → Invoice (Hóa đơn)
  ├── 1:N → Document (Tài liệu)
  └── 1:N → ContractOccupant (Người ở cùng)

Invoice (Hóa đơn)
  ├── N:1 → Contract
  └── 1:N → Payment (Giao dịch thanh toán)

Service (Dịch vụ)
  └── 1:N → ServiceOrder (Đơn đặt dịch vụ)
```

**Indexes được tạo:**
- `User.phone` (unique)
- `User.email` (unique)
- `User.cccdNumber` (unique)
- `Room.name` (unique)
- `Invoice (contractId, month, year)` (composite, unique)

### 4.5.3. Bảo mật

**a) Authentication**
- Mật khẩu được hash bằng bcryptjs (salt rounds = 10)
- Session lưu trong localStorage (có thể nâng cấp lên httpOnly cookies)
- Middleware kiểm tra auth ở mỗi API route

**b) Authorization**
- Phân quyền dựa trên Role (ADMIN, TENANT)
- Admin có quyền truy cập tất cả
- Tenant chỉ xem được dữ liệu của mình
- Kiểm tra quyền ở API route level

**c) Input Validation**
- Validate ở cả client và server
- Sử dụng Prisma để prevent SQL injection
- Sanitize user input

**d) File Upload Security**
- Giới hạn kích thước file
- Kiểm tra loại file (chỉ cho phép ảnh)
- Lưu file trong thư mục public/uploads với unique filename

### 4.5.4. Performance Optimization

**a) Database**
- Sử dụng indexes cho các trường tìm kiếm thường xuyên
- Eager loading với Prisma `include` để giảm N+1 queries
- Connection pooling với Prisma

**b) Frontend**
- Code splitting tự động của Next.js
- Image optimization với Next.js Image component (có thể nâng cấp)
- Lazy loading cho các component nặng
- Debounce cho search inputs

**c) Caching**
- Browser caching cho static assets
- Có thể thêm Redis cache cho các queries thường xuyên

### 4.5.5. Responsive Design

Toàn bộ giao diện được thiết kế responsive với Tailwind CSS:
- Mobile first approach
- Breakpoints: sm (640px), md (768px), lg (1024px), xl (1280px)
- Sidebar collapse trên mobile
- Tables responsive (horizontal scroll hoặc card layout)
- Modal và dropdown tối ưu cho touch devices

## 4.6. Tích hợp bên thứ ba

### 4.6.1. VietQR - Thanh toán QR Code

**Mô tả:**
VietQR là dịch vụ cung cấp API để tạo mã QR thanh toán tương thích với các app ngân hàng Việt Nam.

**Cấu hình:**
```env
VIETQR_CLIENT_ID=your_client_id
VIETQR_API_KEY=your_api_key
BANK_ACCOUNT_NO=your_account_number
BANK_ACCOUNT_NAME=TEN_CHU_TAI_KHOAN
BANK_ID=970422  # Ví dụ: MB Bank
```

**Flow tích hợp:**
1. Call API create payment với thông tin hóa đơn
2. Nhận về QR code (base64 image) và QR string
3. Hiển thị QR cho user quét
4. Lắng nghe callback từ VietQR khi thanh toán thành công
5. Cập nhật trạng thái hóa đơn

**Code minh họa:**
```typescript
// lib/vietqr.ts
export async function createVietQRPayment(invoiceId: number, amount: number) {
  const response = await fetch('https://api.vietqr.io/v2/generate', {
    method: 'POST',
    headers: {
      'x-client-id': process.env.VIETQR_CLIENT_ID,
      'x-api-key': process.env.VIETQR_API_KEY,
    },
    body: JSON.stringify({
      accountNo: process.env.BANK_ACCOUNT_NO,
      accountName: process.env.BANK_ACCOUNT_NAME,
      acqId: process.env.BANK_ID,
      amount: amount,
      addInfo: `THANHTOAN_HOADON_${invoiceId}`,
      format: 'text',
      template: 'compact',
    }),
  });
  
  const data = await response.json();
  return {
    qrCode: data.data.qrDataURL,  // Base64 image
    qrString: data.data.qrCode,   // String for apps
  };
}
```

**Xử lý callback:**
```typescript
// app/api/payments/vietqr/callback/route.ts
export async function POST(req: Request) {
  const body = await req.json();
  
  // Xác thực signature
  if (!verifyVietQRSignature(body)) {
    return Response.json({ error: 'Invalid signature' }, { status: 403 });
  }
  
  // Tìm payment theo transactionId
  const payment = await prisma.payment.findFirst({
    where: { transactionId: body.transactionId },
    include: { invoice: true },
  });
  
  if (!payment) {
    return Response.json({ error: 'Payment not found' }, { status: 404 });
  }
  
  // Cập nhật payment và invoice
  await prisma.$transaction([
    prisma.payment.update({
      where: { id: payment.id },
      data: { status: 'SUCCESS', paidAt: new Date() },
    }),
    prisma.invoice.update({
      where: { id: payment.invoiceId },
      data: { status: 'PAID', paidAt: new Date() },
    }),
  ]);
  
  // Gửi email xác nhận
  await sendPaymentConfirmationEmail(payment.invoice);
  
  return Response.json({ success: true });
}
```

### 4.6.2. Nodemailer - Gửi Email

**Mô tả:**
Hệ thống tích hợp Nodemailer để gửi email thông báo tự động.

**Cấu hình:**
```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
```

**Các loại email:**
1. **Welcome email**: Gửi khi tạo tenant mới (username + password mặc định)
2. **Invoice notification**: Thông báo hóa đơn mới được phát hành
3. **Payment confirmation**: Xác nhận thanh toán thành công
4. **Issue update**: Thông báo sự cố đã được xử lý
5. **Password reset**: Email reset mật khẩu

**Code minh họa:**
```typescript
// lib/email.ts
import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT),
  secure: process.env.SMTP_SECURE === 'true',
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

export async function sendInvoiceEmail(
  to: string,
  invoiceData: {
    month: number;
    year: number;
    totalAmount: number;
    dueDate: string;
  }
) {
  const html = `
    <h2>Thông báo hóa đơn tháng ${invoiceData.month}/${invoiceData.year}</h2>
    <p>Kính gửi quý khách,</p>
    <p>Hóa đơn tháng ${invoiceData.month}/${invoiceData.year} của quý khách đã được phát hành.</p>
    <p><strong>Tổng tiền:</strong> ${invoiceData.totalAmount.toLocaleString()} VNĐ</p>
    <p><strong>Hạn thanh toán:</strong> ${invoiceData.dueDate}</p>
    <p>Vui lòng đăng nhập hệ thống để xem chi tiết và thanh toán.</p>
    <p><a href="${process.env.NEXT_PUBLIC_APP_URL}/tenant/invoices">Xem hóa đơn</a></p>
  `;

  await transporter.sendMail({
    from: process.env.SMTP_USER,
    to,
    subject: `[EZ-Home] Hóa đơn tháng ${invoiceData.month}/${invoiceData.year}`,
    html,
  });
}
```

### 4.6.3. jsPDF và html2canvas - Xuất PDF

**Mô tả:**
Sử dụng jsPDF và html2canvas để xuất hóa đơn ra file PDF.

**Cách hoạt động:**
1. Tạo HTML template cho hóa đơn
2. Dùng html2canvas để chụp HTML thành canvas
3. Dùng jsPDF để convert canvas thành PDF
4. Download file PDF

**Code minh họa:**
```typescript
// Client-side code
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';

async function exportInvoiceToPDF(invoiceId: number) {
  // Lấy element chứa hóa đơn
  const element = document.getElementById('invoice-content');
  
  // Chụp thành canvas
  const canvas = await html2canvas(element, {
    scale: 2, // Tăng resolution
  });
  
  // Convert canvas sang image
  const imgData = canvas.toDataURL('image/png');
  
  // Tạo PDF
  const pdf = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });
  
  const imgWidth = 210; // A4 width in mm
  const imgHeight = (canvas.height * imgWidth) / canvas.width;
  
  pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight);
  pdf.save(`Hoa-don-${invoiceId}.pdf`);
}
```

**Hoặc server-side PDF generation:**
```typescript
// app/api/invoices/[id]/pdf/route.ts
import { PDFDocument, rgb } from 'pdf-lib';

export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  const invoice = await prisma.invoice.findUnique({
    where: { id: Number(params.id) },
    include: { contract: { include: { user: true, room: true } } },
  });

  // Tạo PDF document
  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage([595, 842]); // A4 size

  // Vẽ nội dung
  page.drawText('HÓA ĐƠN TIỀN PHÒNG', {
    x: 50,
    y: 800,
    size: 20,
    color: rgb(0, 0, 0),
  });

  page.drawText(`Tháng: ${invoice.month}/${invoice.year}`, {
    x: 50,
    y: 750,
    size: 12,
  });

  // ... thêm các thông tin khác

  const pdfBytes = await pdfDoc.save();

  return new Response(pdfBytes, {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="Hoa-don-${invoice.id}.pdf"`,
    },
  });
}
```

### 4.6.4. XLSX - Import/Export Excel

**Mô tả:**
Sử dụng thư viện XLSX để import/export dữ liệu Excel.

**Use cases:**
1. Import danh sách cư dân từ Excel
2. Import chỉ số điện nước hàng loạt
3. Export báo cáo doanh thu
4. Export danh sách hóa đơn

**Code minh họa - Export:**
```typescript
// app/api/invoices/export/route.ts
import * as XLSX from 'xlsx';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const month = searchParams.get('month');
  const year = searchParams.get('year');

  // Lấy dữ liệu
  const invoices = await prisma.invoice.findMany({
    where: { month: Number(month), year: Number(year) },
    include: { contract: { include: { user: true, room: true } } },
  });

  // Chuẩn bị data cho Excel
  const data = invoices.map((inv) => ({
    'Tháng/Năm': `${inv.month}/${inv.year}`,
    'Phòng': inv.contract.room.name,
    'Cư dân': inv.contract.user.fullName,
    'Tiền phòng': Number(inv.amountRoom),
    'Tiền điện': Number(inv.amountElec),
    'Tiền nước': Number(inv.amountWater),
    'Phí DV': Number(inv.amountCommonService),
    'Phí sửa chữa': Number(inv.amountService),
    'Tổng cộng': Number(inv.totalAmount),
    'Trạng thái': inv.status,
  }));

  // Tạo workbook
  const ws = XLSX.utils.json_to_sheet(data);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Hóa đơn');

  // Generate buffer
  const buf = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });

  return new Response(buf, {
    headers: {
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': `attachment; filename="Hoa-don-${month}-${year}.xlsx"`,
    },
  });
}
```

**Code minh họa - Import:**
```typescript
// app/api/invoices/import/route.ts
import * as XLSX from 'xlsx';

export async function POST(req: Request) {
  const formData = await req.formData();
  const file = formData.get('file') as File;

  // Đọc file Excel
  const buffer = await file.arrayBuffer();
  const workbook = XLSX.read(buffer);
  const worksheet = workbook.Sheets[workbook.SheetNames[0]];
  const data = XLSX.utils.sheet_to_json(worksheet);

  // Validate và import
  const results = [];
  for (const row of data) {
    try {
      // Validate row data
      if (!row['Phòng'] || !row['Tháng/Năm']) {
        throw new Error('Thiếu thông tin bắt buộc');
      }

      // Parse và tạo invoice
      const [month, year] = row['Tháng/Năm'].split('/');
      // ... tạo invoice

      results.push({ success: true, room: row['Phòng'] });
    } catch (error) {
      results.push({ success: false, room: row['Phòng'], error: error.message });
    }
  }

  return Response.json({ results });
}
```

## 4.7. Testing và Quality Assurance

### 4.7.1. Manual Testing

Do thời gian phát triển, hệ thống chủ yếu sử dụng manual testing:

**Test cases chính:**
1. **Authentication flow**
   - Đăng nhập admin
   - Đăng nhập tenant lần đầu
   - Đổi mật khẩu
   - Reset mật khẩu

2. **Quản lý phòng và cư dân**
   - Tạo phòng mới
   - Tạo cư dân và hợp đồng
   - Cập nhật thông tin
   - Trả phòng

3. **Quản lý hóa đơn**
   - Phát hành hóa đơn tháng
   - Chỉnh sửa hóa đơn
   - Thanh toán (các phương thức)
   - Xuất PDF

4. **Quy trình nghiệp vụ end-to-end**
   - Cư dân báo sự cố → Admin xử lý → Tính phí vào hóa đơn
   - Tenant đặt dịch vụ → Admin xác nhận → Tính phí
   - Phát hành hóa đơn → Tenant thanh toán VietQR → Callback xử lý

### 4.7.2. Browser Testing

Đã test trên các trình duyệt:
- Google Chrome (chính)
- Microsoft Edge
- Firefox
- Safari (cơ bản)

### 4.7.3. Responsive Testing

Đã test trên các kích thước màn hình:
- Desktop: 1920x1080, 1366x768
- Tablet: iPad (768x1024)
- Mobile: iPhone 12 (390x844), Samsung Galaxy S21 (360x800)

### 4.7.4. Security Testing

**Đã kiểm tra:**
- SQL Injection: Prisma ORM tự động prevent
- XSS: Escape user input
- CSRF: Có thể cải thiện bằng CSRF tokens
- Unauthorized access: Middleware kiểm tra role

## 4.8. Cài đặt, Hosting và Deployment

### 4.8.1. Môi trường Development

**Yêu cầu hệ thống:**
- Node.js 20.x trở lên
- PostgreSQL 14.x trở lên
- npm hoặc yarn hoặc pnpm
- Git (để clone repository)

**Các bước cài đặt:**

**Bước 1: Clone repository**
```bash
git clone <repository-url>
cd ez-home
```

**Bước 2: Cài đặt dependencies**
```bash
npm install
# hoặc
yarn install
# hoặc
pnpm install
```

**Bước 3: Cấu hình môi trường**

Tạo file `.env` trong thư mục root:
```env
# Database
DATABASE_URL="postgresql://username:password@localhost:5432/ezhome"
DIRECT_URL="postgresql://username:password@localhost:5432/ezhome"

# App URL
NEXT_PUBLIC_APP_URL="http://localhost:3000"

# Email Configuration (Optional)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password

# VietQR Configuration (Optional)
VIETQR_CLIENT_ID=your_client_id
VIETQR_API_KEY=your_api_key
BANK_ACCOUNT_NO=your_account_number
BANK_ACCOUNT_NAME=TEN_CHU_TAI_KHOAN
BANK_ID=970422
```

**Bước 4: Setup Database**
```bash
# Tạo database
createdb ezhome

# Chạy migrations
npx prisma migrate dev

# Generate Prisma Client
npx prisma generate

# Seed dữ liệu mẫu (optional)
npx prisma db seed
```

**Bước 5: Chạy development server**
```bash
npm run dev
```

Truy cập: `http://localhost:3000`

**Bước 6: Tạo admin user đầu tiên**

Có thể tạo bằng script seed hoặc trực tiếp trong database:
```sql
-- Hash password "admin123" với bcrypt
-- Hoặc sử dụng script tạo user
```

### 4.8.2. Các phương án Hosting Production

#### 4.8.2.1. Option 1: Vercel (Khuyến nghị cho Next.js)

**Ưu điểm:**
- Tối ưu cho Next.js, hỗ trợ SSR/SSG tự động
- Deploy tự động từ Git
- SSL miễn phí
- CDN toàn cầu
- Hỗ trợ preview deployments
- Miễn phí cho dự án nhỏ

**Nhược điểm:**
- Database phải dùng service bên ngoài (không có PostgreSQL built-in)
- Giới hạn function execution time
- Có thể tốn phí khi scale lớn

**Các bước deploy:**

**Bước 1: Cài đặt Vercel CLI**
```bash
npm i -g vercel
```

**Bước 2: Đăng nhập Vercel**
```bash
vercel login
```

**Bước 3: Deploy lần đầu**
```bash
# Trong thư mục project
vercel
```

Làm theo hướng dẫn:
- Link to existing project? → No (lần đầu)
- Project name? → ez-home
- Directory? → ./
- Override settings? → No

**Bước 4: Cấu hình Environment Variables**

Truy cập Vercel Dashboard → Project Settings → Environment Variables, thêm:
- `DATABASE_URL`
- `DIRECT_URL`
- `NEXT_PUBLIC_APP_URL`
- `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`
- `VIETQR_CLIENT_ID`, `VIETQR_API_KEY`, etc.

**Bước 5: Setup Database (PostgreSQL)**

Vercel không cung cấp PostgreSQL, cần dùng service bên ngoài:

**a) Supabase (Miễn phí tier)**
1. Đăng ký tại https://supabase.com
2. Tạo project mới
3. Lấy connection string từ Settings → Database
4. Thêm vào Vercel environment variables

**b) Railway (Miễn phí tier)**
1. Đăng ký tại https://railway.app
2. Tạo PostgreSQL service
3. Lấy connection string
4. Thêm vào Vercel

**c) Neon (Miễn phí tier)**
1. Đăng ký tại https://neon.tech
2. Tạo database
3. Lấy connection string
4. Thêm vào Vercel

**Bước 6: Chạy migrations trên production**
```bash
# Set production database URL
export DATABASE_URL="postgresql://..."

# Chạy migrations
npx prisma migrate deploy

# Generate Prisma Client
npx prisma generate
```

**Bước 7: Deploy production**
```bash
vercel --prod
```

**Bước 8: Cấu hình Custom Domain (Optional)**

1. Vào Vercel Dashboard → Settings → Domains
2. Thêm domain của bạn
3. Cấu hình DNS records theo hướng dẫn:
   - A record: `@` → `76.76.21.21`
   - CNAME: `www` → `cname.vercel-dns.com`

**Bước 9: Auto-deploy từ Git**

1. Vào Vercel Dashboard → Settings → Git
2. Connect repository (GitHub/GitLab/Bitbucket)
3. Mỗi lần push lên main branch sẽ tự động deploy

**Ảnh giao diện**: Screenshot Vercel Dashboard với project đã deploy, environment variables, và domain settings.

#### 4.8.2.2. Option 2: Docker + VPS/Cloud Server

**Ưu điểm:**
- Kiểm soát hoàn toàn
- Có thể host database trên cùng server
- Phù hợp cho production lớn
- Linh hoạt trong cấu hình

**Nhược điểm:**
- Cần kiến thức về Docker và Linux
- Phải tự quản lý SSL, backup, monitoring
- Chi phí server

**Các bước deploy:**

**Bước 1: Tạo Dockerfile**

Tạo file `Dockerfile` trong root:
```dockerfile
# Stage 1: Dependencies
FROM node:20-alpine AS deps
WORKDIR /app
COPY package*.json ./
RUN npm ci

# Stage 2: Builder
FROM node:20-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Generate Prisma Client
RUN npx prisma generate

# Build Next.js
ENV NEXT_TELEMETRY_DISABLED 1
RUN npm run build

# Stage 3: Runner
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV production
ENV NEXT_TELEMETRY_DISABLED 1

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copy built files
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma

USER nextjs

EXPOSE 3000

ENV PORT 3000
ENV HOSTNAME "0.0.0.0"

CMD ["node", "server.js"]
```

**Bước 2: Cấu hình Next.js cho standalone output**

Thêm vào `next.config.js`:
```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  // ... other config
}

module.exports = nextConfig
```

**Bước 3: Tạo docker-compose.yml**

Tạo file `docker-compose.yml`:
```yaml
version: '3.8'

services:
  postgres:
    image: postgres:15-alpine
    container_name: ez-home-db
    environment:
      POSTGRES_USER: ezhome
      POSTGRES_PASSWORD: ${DB_PASSWORD}
      POSTGRES_DB: ezhome
    volumes:
      - postgres_data:/var/lib/postgresql/data
    ports:
      - "5432:5432"
    restart: unless-stopped
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U ezhome"]
      interval: 10s
      timeout: 5s
      retries: 5

  app:
    build:
      context: .
      dockerfile: Dockerfile
    container_name: ez-home-app
    environment:
      DATABASE_URL: postgresql://ezhome:${DB_PASSWORD}@postgres:5432/ezhome
      DIRECT_URL: postgresql://ezhome:${DB_PASSWORD}@postgres:5432/ezhome
      NEXT_PUBLIC_APP_URL: ${APP_URL}
      SMTP_HOST: ${SMTP_HOST}
      SMTP_PORT: ${SMTP_PORT}
      SMTP_USER: ${SMTP_USER}
      SMTP_PASS: ${SMTP_PASS}
      VIETQR_CLIENT_ID: ${VIETQR_CLIENT_ID}
      VIETQR_API_KEY: ${VIETQR_API_KEY}
      BANK_ACCOUNT_NO: ${BANK_ACCOUNT_NO}
      BANK_ACCOUNT_NAME: ${BANK_ACCOUNT_NAME}
      BANK_ID: ${BANK_ID}
    ports:
      - "3000:3000"
    depends_on:
      postgres:
        condition: service_healthy
    restart: unless-stopped
    command: sh -c "npx prisma migrate deploy && node server.js"

volumes:
  postgres_data:
```

**Bước 4: Tạo file .env cho production**

Tạo file `.env.production`:
```env
DB_PASSWORD=your_secure_password
APP_URL=https://yourdomain.com
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
VIETQR_CLIENT_ID=your_client_id
VIETQR_API_KEY=your_api_key
BANK_ACCOUNT_NO=your_account_number
BANK_ACCOUNT_NAME=TEN_CHU_TAI_KHOAN
BANK_ID=970422
```

**Bước 5: Deploy lên VPS**

**a) Chuẩn bị VPS (Ubuntu 22.04)**
```bash
# SSH vào server
ssh user@your-server-ip

# Update system
sudo apt update && sudo apt upgrade -y

# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Install Docker Compose
sudo apt install docker-compose -y

# Add user to docker group
sudo usermod -aG docker $USER
```

**b) Clone và deploy**
```bash
# Clone repository
git clone <repo-url>
cd ez-home

# Copy .env file
cp .env.production .env

# Build and start containers
docker-compose up -d --build

# Check logs
docker-compose logs -f

# Run migrations (nếu chưa tự động)
docker-compose exec app npx prisma migrate deploy
```

**Bước 6: Cấu hình Nginx Reverse Proxy**

Cài đặt Nginx:
```bash
sudo apt install nginx -y
```

Tạo file config `/etc/nginx/sites-available/ez-home`:
```nginx
server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

Enable site:
```bash
sudo ln -s /etc/nginx/sites-available/ez-home /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

**Bước 7: Cấu hình SSL với Let's Encrypt**

```bash
# Install Certbot
sudo apt install certbot python3-certbot-nginx -y

# Get SSL certificate
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com

# Auto-renewal (đã tự động setup)
sudo certbot renew --dry-run
```

**Bước 8: Cấu hình Firewall**

```bash
# Allow SSH, HTTP, HTTPS
sudo ufw allow 22/tcp
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw enable
```

**Ảnh giao diện**: Screenshot Docker containers đang chạy, Nginx config, và SSL certificate status.

#### 4.8.2.3. Option 3: Traditional VPS (không Docker)

**Các bước deploy:**

**Bước 1: Chuẩn bị server (Ubuntu 22.04)**
```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js 20
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install PostgreSQL
sudo apt-get install postgresql postgresql-contrib -y

# Install PM2 (process manager)
sudo npm install -g pm2

# Install Nginx
sudo apt install nginx -y
```

**Bước 2: Setup PostgreSQL**
```bash
# Switch to postgres user
sudo -u postgres psql

# Tạo database và user
CREATE DATABASE ezhome;
CREATE USER ezhome_user WITH ENCRYPTED PASSWORD 'your_password';
GRANT ALL PRIVILEGES ON DATABASE ezhome TO ezhome_user;
\q
```

**Bước 3: Clone và setup application**
```bash
# Clone repository
cd /var/www
sudo git clone <repo-url> ez-home
cd ez-home

# Install dependencies
sudo npm install --production

# Copy .env file
sudo cp .env.production .env
# Chỉnh sửa .env với database credentials

# Run migrations
sudo npx prisma migrate deploy
sudo npx prisma generate

# Build application
sudo npm run build
```

**Bước 4: Cấu hình PM2**
```bash
# Tạo ecosystem file
cat > ecosystem.config.js << EOF
module.exports = {
  apps: [{
    name: 'ez-home',
    script: 'npm',
    args: 'start',
    cwd: '/var/www/ez-home',
    instances: 2,
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production',
      PORT: 3000
    }
  }]
}
EOF

# Start application
pm2 start ecosystem.config.js

# Save PM2 configuration
pm2 save

# Setup PM2 to start on boot
pm2 startup
# Chạy lệnh được output
```

**Bước 5: Cấu hình Nginx**

Tạo file `/etc/nginx/sites-available/ez-home`:
```nginx
server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # Increase body size for file uploads
    client_max_body_size 10M;
}
```

Enable và reload:
```bash
sudo ln -s /etc/nginx/sites-available/ez-home /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

**Bước 6: Setup SSL (Let's Encrypt)**
```bash
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com
```

**Bước 7: Cấu hình Firewall**
```bash
sudo ufw allow 22/tcp
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw enable
```

**Ảnh giao diện**: Screenshot PM2 dashboard, Nginx status, và application đang chạy.

### 4.8.3. Cấu hình Domain và DNS

**Bước 1: Mua Domain**

Mua domain từ các nhà cung cấp:
- Namecheap
- GoDaddy
- Cloudflare
- FPT, P.A Vietnam (cho .vn)

**Bước 2: Cấu hình DNS Records**

**Nếu dùng Vercel:**
- A Record: `@` → `76.76.21.21`
- CNAME: `www` → `cname.vercel-dns.com`

**Nếu dùng VPS:**
- A Record: `@` → IP của VPS
- A Record: `www` → IP của VPS
- Hoặc CNAME: `www` → `yourdomain.com`

**Bước 3: Verify DNS**

Kiểm tra DNS propagation:
```bash
# Linux/Mac
dig yourdomain.com
nslookup yourdomain.com

# Hoặc dùng online tool: https://dnschecker.org
```

**Bước 4: Cấu hình trong ứng dụng**

Cập nhật `NEXT_PUBLIC_APP_URL` trong environment variables:
```env
NEXT_PUBLIC_APP_URL=https://yourdomain.com
```

**Ảnh giao diện**: Screenshot DNS configuration panel và kết quả DNS checker.

### 4.8.4. Backup và Recovery

#### 4.8.4.1. Database Backup

**a) Manual Backup Script (PowerShell)**
```powershell
# scripts/backup-database.ps1
$timestamp = Get-Date -Format "yyyyMMdd_HHmmss"
$backupDir = ".\backups"
$backupFile = "$backupDir\backup_$timestamp.sql"

# Tạo thư mục backup nếu chưa có
if (-not (Test-Path $backupDir)) {
    New-Item -ItemType Directory -Path $backupDir
}

# Set PostgreSQL password
$env:PGPASSWORD = $env:DB_PASSWORD

# Backup database
pg_dump -h localhost -U ezhome_user -d ezhome -F c -f $backupFile

Write-Host "Backup created: $backupFile"

# Upload to cloud storage (optional)
# aws s3 cp $backupFile s3://your-bucket/backups/
```

**b) Automated Backup (Linux Cron)**
```bash
# Tạo backup script
cat > /usr/local/bin/backup-ezhome.sh << 'EOF'
#!/bin/bash
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/var/backups/ez-home"
BACKUP_FILE="$BACKUP_DIR/backup_$TIMESTAMP.sql"

mkdir -p $BACKUP_DIR

# Backup database
PGPASSWORD=$DB_PASSWORD pg_dump -h localhost -U ezhome_user -d ezhome -F c -f $BACKUP_FILE

# Compress backup
gzip $BACKUP_FILE

# Delete backups older than 30 days
find $BACKUP_DIR -name "*.sql.gz" -mtime +30 -delete

# Upload to S3 (optional)
# aws s3 cp $BACKUP_FILE.gz s3://your-bucket/backups/
EOF

chmod +x /usr/local/bin/backup-ezhome.sh

# Thêm vào crontab (chạy mỗi ngày lúc 2h sáng)
crontab -e
# Thêm dòng:
0 2 * * * /usr/local/bin/backup-ezhome.sh
```

**c) Restore từ Backup**
```bash
# Restore database
pg_restore -h localhost -U ezhome_user -d ezhome -c backup_20240118_020000.sql

# Hoặc từ file compressed
gunzip < backup_20240118_020000.sql.gz | psql -h localhost -U ezhome_user -d ezhome
```

#### 4.8.4.2. File Uploads Backup

Nếu lưu file trong `public/uploads`:
```bash
# Backup uploads directory
tar -czf uploads_backup_$(date +%Y%m%d).tar.gz public/uploads/

# Restore
tar -xzf uploads_backup_20240118.tar.gz
```

**Khuyến nghị**: Nên dùng cloud storage (AWS S3, Cloudinary) thay vì lưu local.

### 4.8.5. Monitoring và Logging

#### 4.8.5.1. Application Monitoring

**a) PM2 Monitoring (nếu dùng PM2)**
```bash
# Xem logs
pm2 logs ez-home

# Xem status
pm2 status

# Monitor real-time
pm2 monit

# Restart application
pm2 restart ez-home
```

**b) Health Check Endpoint**

Tạo file `app/api/health/route.ts`:
```typescript
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    // Check database connection
    await prisma.$queryRaw`SELECT 1`;
    
    return NextResponse.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      database: 'connected',
    });
  } catch (error) {
    return NextResponse.json(
      {
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        database: 'disconnected',
        error: error.message,
      },
      { status: 503 }
    );
  }
}
```

**c) Uptime Monitoring**

Sử dụng dịch vụ:
- UptimeRobot (miễn phí)
- Pingdom
- StatusCake

Cấu hình monitor URL: `https://yourdomain.com/api/health`

#### 4.8.5.2. Error Logging

**a) Console Logging**
```typescript
// lib/logger.ts
export const logger = {
  error: (message: string, error?: Error) => {
    console.error(`[ERROR] ${new Date().toISOString()} - ${message}`, error);
    // Có thể gửi đến error tracking service
  },
  info: (message: string) => {
    console.log(`[INFO] ${new Date().toISOString()} - ${message}`);
  },
};
```

**b) Error Tracking Services (Optional)**
- Sentry (miễn phí tier)
- LogRocket
- Rollbar

**c) Application Logs**

Nếu dùng PM2, logs được lưu tại:
```bash
~/.pm2/logs/ez-home-out.log  # Standard output
~/.pm2/logs/ez-home-error.log # Error output
```

### 4.8.6. Performance Optimization

#### 4.8.6.1. Database Optimization

**a) Connection Pooling**
```typescript
// lib/prisma.ts
import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
    datasources: {
      db: {
        url: process.env.DATABASE_URL,
      },
    },
  });

// Connection pool configuration
if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;
```

**b) Index Optimization**

Đảm bảo các trường thường query có index:
```prisma
model Invoice {
  contractId Int
  month      Int
  year       Int
  
  @@unique([contractId, month, year])
  @@index([status])
  @@index([year, month])
}
```

#### 4.8.6.2. Caching

**a) Next.js Caching**
```typescript
// app/api/invoices/route.ts
export async function GET() {
  const invoices = await prisma.invoice.findMany();
  
  return NextResponse.json(invoices, {
    headers: {
      'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300',
    },
  });
}
```

**b) Redis Caching (Advanced)**
```typescript
// lib/redis.ts
import Redis from 'ioredis';

const redis = new Redis(process.env.REDIS_URL);

export async function getCachedData(key: string) {
  const cached = await redis.get(key);
  return cached ? JSON.parse(cached) : null;
}

export async function setCachedData(key: string, data: any, ttl = 3600) {
  await redis.setex(key, ttl, JSON.stringify(data));
}
```

### 4.8.7. Security Best Practices

#### 4.8.7.1. Environment Variables

- Không commit `.env` vào Git
- Sử dụng `.env.example` làm template
- Rotate secrets định kỳ
- Sử dụng secret management (AWS Secrets Manager, HashiCorp Vault)

#### 4.8.7.2. Database Security

```sql
-- Tạo user với quyền hạn chế
CREATE USER ezhome_app WITH PASSWORD 'strong_password';
GRANT CONNECT ON DATABASE ezhome TO ezhome_app;
GRANT USAGE ON SCHEMA public TO ezhome_app;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO ezhome_app;
```

#### 4.8.7.3. HTTPS và Security Headers

Thêm vào `next.config.js`:
```javascript
const nextConfig = {
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'X-DNS-Prefetch-Control',
            value: 'on'
          },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=63072000; includeSubDomains; preload'
          },
          {
            key: 'X-Frame-Options',
            value: 'SAMEORIGIN'
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff'
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block'
          },
          {
            key: 'Referrer-Policy',
            value: 'origin-when-cross-origin'
          }
        ],
      },
    ];
  },
};
```

### 4.8.8. Troubleshooting

#### 4.8.8.1. Common Issues

**Issue 1: Database connection failed**
```bash
# Kiểm tra PostgreSQL đang chạy
sudo systemctl status postgresql

# Kiểm tra connection string
psql -h localhost -U ezhome_user -d ezhome

# Kiểm tra firewall
sudo ufw status
```

**Issue 2: Application không start**
```bash
# Kiểm tra logs
pm2 logs ez-home
# hoặc
docker-compose logs app

# Kiểm tra port đã được sử dụng
sudo lsof -i :3000

# Kiểm tra environment variables
printenv | grep DATABASE_URL
```

**Issue 3: Prisma migration failed**
```bash
# Reset database (CẨN THẬN: mất dữ liệu)
npx prisma migrate reset

# Hoặc resolve migration conflicts
npx prisma migrate resolve --applied <migration_name>
```

**Issue 4: Build failed**
```bash
# Clear cache
rm -rf .next node_modules
npm install
npm run build
```

#### 4.8.8.2. Performance Issues

**Database slow queries:**
```sql
-- Enable query logging
SET log_min_duration_statement = 1000; -- Log queries > 1s

-- Analyze slow queries
SELECT query, mean_exec_time, calls
FROM pg_stat_statements
ORDER BY mean_exec_time DESC
LIMIT 10;
```

**Memory leaks:**
```bash
# Monitor memory usage
pm2 monit

# Restart application định kỳ
pm2 restart ez-home --cron-restart="0 4 * * *"
```

### 4.8.9. CI/CD Pipeline (Optional)

**GitHub Actions Example:**

Tạo file `.github/workflows/deploy.yml`:
```yaml
name: Deploy to Production

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '20'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Run tests
        run: npm test
      
      - name: Build
        run: npm run build
      
      - name: Deploy to Vercel
        uses: amondnet/vercel-action@v20
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.ORG_ID }}
          vercel-project-id: ${{ secrets.PROJECT_ID }}
          vercel-args: '--prod'
```

**Ảnh giao diện**: Screenshot GitHub Actions workflow đang chạy, deployment logs, và production site đã deploy thành công.

## 4.9. Thảo luận

### 4.9.1. Điểm mạnh của hệ thống

**a) Đầy đủ chức năng**
- Hệ thống bao phủ toàn bộ quy trình quản lý nhà trọ từ A-Z
- Tự động hóa nhiều nghiệp vụ (phát hành hóa đơn, tính phí, thông báo)
- Hỗ trợ cả admin và tenant với giao diện riêng biệt

**b) Công nghệ hiện đại**
- Next.js 16 với App Router mới nhất
- React 19 với performance cải thiện
- Tailwind CSS 4 cho UI đẹp và responsive
- TypeScript đảm bảo type-safety
- Prisma ORM giảm lỗi SQL

**c) User Experience tốt**
- Giao diện thân thiện, dễ sử dụng
- Dark mode hỗ trợ
- Responsive hoàn toàn
- Loading states và error handling rõ ràng
- Thông báo real-time

**d) Tích hợp thanh toán online**
- VietQR giúp tenant thanh toán nhanh chóng
- Tự động cập nhật trạng thái khi thanh toán thành công
- Giảm công việc đối chiếu cho admin

**e) Báo cáo và Thống kê**
- Dashboard trực quan
- Báo cáo tài chính chi tiết
- Dự báo doanh thu bằng AI (cơ bản)
- Export Excel để phân tích sâu

**f) Quản lý tài liệu**
- Upload và lưu trữ tài liệu
- CCCD scan, hợp đồng scan
- Dễ dàng tra cứu

### 4.9.2. Hạn chế và Thách thức

**a) Bảo mật session**
- Hiện tại dùng localStorage cho session
- Nên nâng cấp lên httpOnly cookies để tránh XSS
- Có thể bị đánh cắp session nếu không cẩn thận

**b) Scalability**
- Kiến trúc Monolithic khó scale khi user tăng
- Database có thể bottleneck khi dữ liệu lớn
- Chưa có caching layer (Redis)

**c) Real-time**
- Chưa có WebSocket cho thông báo real-time
- Phải refresh trang để thấy cập nhật mới
- Nên tích hợp Socket.io hoặc Server-Sent Events

**d) AI Forecast**
- Thuật toán dự báo còn đơn giản
- Chỉ dựa vào dữ liệu lịch sử, chưa xét các yếu tố khác (mùa vụ, sự kiện)
- Độ chính xác chưa cao

**e) Testing**
- Chưa có automated tests (unit tests, integration tests)
- Dễ bị regression bugs khi refactor
- Nên viết tests cho các nghiệp vụ quan trọng

**f) Error Handling**
- Một số trường hợp lỗi chưa được xử lý tốt
- Error messages có thể rõ ràng hơn
- Nên có error logging (Sentry, LogRocket)

**g) File Upload**
- Lưu file trong thư mục public, không tối ưu cho production
- Nên dùng cloud storage (AWS S3, Cloudinary)
- Chưa có resize/compress ảnh tự động

### 4.9.3. Lessons Learned (Bài học kinh nghiệm)

**a) Về thiết kế database**
- Nên thiết kế schema kỹ càng từ đầu
- Foreign keys và constraints rất quan trọng
- Migration strategy cần rõ ràng để tránh mất dữ liệu

**b) Về quản lý state**
- Client-side state management cần cẩn thận
- Nên dùng React Query hoặc SWR cho data fetching
- Tránh prop drilling bằng Context API

**c) Về UI/UX**
- Responsive design cần test nhiều thiết bị
- Loading states và feedback quan trọng
- Accessibility (a11y) cần chú ý

**d) Về tích hợp bên thứ ba**
- Đọc kỹ docs trước khi tích hợp
- Test thoroughly trong sandbox environment
- Có fallback plan khi API bên thứ ba lỗi

**e) Về deployment**
- Environment variables cần quản lý cẩn thận
- Backup database thường xuyên
- Monitoring và logging quan trọng

### 4.9.4. Hướng phát triển trong tương lai

**a) Ngắn hạn (1-3 tháng)**
1. **Cải thiện bảo mật**
   - Chuyển sang httpOnly cookies
   - Implement CSRF protection
   - Add rate limiting cho API

2. **Thêm tests**
   - Viết unit tests cho utils
   - Integration tests cho API routes
   - E2E tests với Playwright

3. **Tối ưu performance**
   - Add Redis caching
   - Optimize database queries
   - Implement pagination cho danh sách lớn

4. **Cải thiện UX**
   - Add loading skeletons
   - Better error messages
   - Toast notifications

**b) Trung hạn (3-6 tháng)**
1. **Real-time features**
   - WebSocket cho notifications
   - Live chat giữa admin và tenant
   - Real-time dashboard updates

2. **Mobile App**
   - React Native app cho tenant
   - Push notifications
   - Offline support

3. **Advanced Analytics**
   - Biểu đồ chi tiết hơn
   - Custom reports
   - Data visualization với Chart.js/Recharts

4. **Payment methods**
   - Thêm Momo, ZaloPay
   - Thanh toán trả góp
   - Auto-debit từ tài khoản

**c) Dài hạn (6-12 tháng)**
1. **Microservices Architecture**
   - Tách riêng Payment Service
   - Notification Service
   - File Storage Service

2. **AI nâng cao**
   - Dự báo doanh thu chính xác hơn
   - Gợi ý giá phòng tối ưu
   - Phân tích xu hướng khách thuê

3. **Multi-tenancy**
   - Hỗ trợ nhiều chủ nhà trọ
   - White-label solution
   - SaaS model

4. **IoT Integration**
   - Smart meter tự động đọc chỉ số
   - Smart lock cho phòng
   - Sensor nhiệt độ, độ ẩm

### 4.9.5. So sánh với các giải pháp hiện có

**Ưu điểm của EZ-Home:**
- Miễn phí, open-source (có thể)
- Tùy chỉnh dễ dàng theo nhu cầu
- Không phụ thuộc vào nhà cung cấp bên ngoài
- Dữ liệu tự quản lý, bảo mật

**So với phần mềm thương mại:**
- Phần mềm thương mại: Tính phí theo tháng, có support 24/7
- EZ-Home: Miễn phí nhưng cần tự maintain
- Phần mềm thương mại: Features nhiều hơn, stable hơn
- EZ-Home: Đủ dùng cho nhà trọ vừa và nhỏ

**So với Excel/Thủ công:**
- Excel: Dễ sai sót, khó quản lý khi lớn
- EZ-Home: Tự động, chính xác, dễ mở rộng
- Excel: Không có portal cho tenant
- EZ-Home: Tenant tự xem, tự thanh toán

## 4.10. Kết luận

Hệ thống quản lý nhà trọ EZ-Home đã được phát triển thành công với đầy đủ các chức năng cốt lõi, đáp ứng nhu cầu quản lý toàn diện cho cả chủ nhà và người thuê. Việc sử dụng công nghệ hiện đại (Next.js, React, TypeScript, Prisma) giúp hệ thống dễ bảo trì và mở rộng trong tương lai.

**Những thành tựu chính:**
- Hoàn thành 15 modules chức năng chính
- Tích hợp thành công VietQR payment gateway
- Giao diện user-friendly và responsive hoàn toàn
- Tự động hóa nhiều nghiệp vụ phức tạp

**Những hạn chế cần khắc phục:**
- Bảo mật session cần cải thiện
- Chưa có automated testing
- Performance có thể tối ưu hơn
- Real-time features chưa đầy đủ

Nhìn chung, dự án đã đạt được mục tiêu đề ra là xây dựng một hệ thống quản lý nhà trọ hoàn chỉnh, giúp số hóa quy trình quản lý và nâng cao trải nghiệm người dùng. Hệ thống có thể được triển khai thực tế và tiếp tục phát triển thêm các tính năng nâng cao.

---

**Ghi chú về ảnh giao diện:**
Tài liệu này đã mô tả chi tiết các màn hình và giao diện. Để bổ sung vào báo cáo, bạn nên:
1. Chụp màn hình các trang chính (Dashboard, Danh sách phòng, Tạo hóa đơn, Thanh toán VietQR, etc.)
2. Thêm caption cho mỗi ảnh (ví dụ: "Hình 4.1: Giao diện Dashboard Admin")
3. Chèn ảnh vào các phần tương ứng trong tài liệu
4. Có thể thêm ảnh so sánh Light mode vs Dark mode
5. Thêm ảnh responsive trên mobile/tablet

**Số trang ước tính:**
- 4.1 - 4.2: 2 trang
- 4.3: 6-7 trang (với ảnh)
- 4.4: 2 trang
- 4.5 - 4.6: 2-3 trang
- 4.7 - 4.9: 3-4 trang
- Tổng: 15-18 trang (đã bao gồm ảnh)
