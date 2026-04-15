# Koshiro Fashion Server

Backend API cho hệ thống thương mại điện tử Koshiro Fashion. Server được viết bằng Express + TypeScript, lưu trữ dữ liệu trên MongoDB thông qua Mongoose, phục vụ storefront React và admin dashboard.

## Tổng Quan

Server cung cấp các nhóm chức năng chính:

- Xác thực người dùng, admin, JWT, đổi mật khẩu và reset mật khẩu.
- Quản lý sản phẩm, danh mục, màu sắc, media Cloudinary.
- Giỏ hàng, wishlist, checkout, đơn hàng của khách và đơn hàng guest.
- Admin dashboard, thống kê, analytics, reports, import/export.
- Quản lý người dùng, vai trò, quyền truy cập theo RBAC.
- Khuyến mãi, flash sale, review, notification, activity log.
- Tồn kho, stock movements, vận chuyển, thanh toán, refund.
- Swagger API documentation tại `/api-docs`.

## Tech Stack

- Runtime: Node.js 18+
- Framework: Express.js
- Language: TypeScript
- Database: MongoDB + Mongoose
- Authentication: JWT + bcryptjs
- Validation: Zod, express-validator
- Security: Helmet, CORS, express-mongo-sanitize, xss-clean, rate limit
- Upload/media: Multer, Cloudinary
- Logging: Winston, Morgan
- Testing: Jest, ts-jest, Supertest
- API docs: swagger-jsdoc, swagger-ui-express

## Cấu Trúc Thư Mục

```text
Server/
├── src/
│   ├── config/          # env, database, swagger, cloudinary
│   ├── constants/       # role constants
│   ├── controllers/     # request handlers theo từng module
│   ├── lib/             # logger
│   ├── middleware/      # auth, authorization, rate limit, validate, upload
│   ├── models/          # Mongoose schemas/models
│   ├── routes/          # Express routers
│   ├── scripts/         # seed scripts
│   ├── services/        # email, cloudinary
│   ├── tests/           # Jest tests
│   ├── types/           # type declarations
│   ├── utils/           # error handler, seed data
│   └── index.ts         # app bootstrap và route mounting
├── env.example
├── jest.config.js
├── package.json
└── tsconfig.json
```

## Cài Đặt

```bash
cd Server
npm install
```

Tạo file `.env` trong thư mục `Server/`:

```env
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/database-name
JWT_SECRET=your-super-secret-jwt-key
JWT_EXPIRE=7d
PORT=3000
NODE_ENV=development
TRUST_PROXY=false
FRONTEND_URL=http://localhost:8080
PRODUCTION_FRONTEND_URL=https://your-production-domain.com

# Email reset password
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password

# Cloudinary media upload
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret
```

Tham khảo đầy đủ trong `env.example`.

## Scripts

```bash
npm run dev             # Chạy dev server bằng ts-node-dev
npm run build           # Compile TypeScript ra dist/
npm start               # Chạy dist/index.js
npm test                # Chạy Jest tests
npm run contract:check  # Kiểm tra contract OpenAPI tối thiểu
npm run env:production:check # Kiểm tra env production bắt buộc trước deploy
npm run openapi:export  # Xuất OpenAPI contract ra openapi.json
npm run audit           # Chạy npm audit ở mức moderate trở lên
npm run verify          # Build, test, contract check và audit dùng cho CI/local release check
npm run seed            # Seed dữ liệu mẫu cơ bản
```

## Chạy Local

```bash
cd Server
npm run dev
```

Mặc định server chạy tại:

```text
http://localhost:3000
```

Nếu port đang bận, server sẽ thử các port tiếp theo trong một khoảng nhỏ.

Kiểm tra trạng thái:

```text
GET /health
GET /api/health
GET /api/status
```

Swagger UI:

```text
GET /api-docs
```

Kiểm tra contract OpenAPI không cần kết nối database:

```bash
npm run contract:check
```

## Route Modules

Những route đang được mount trong `src/index.ts`:

```text
/api/auth
/api/products
/api/categories
/api/orders
/api/cart
/api/wishlist
/api/reviews
/api/admin
/api/activity
/api/notifications
/api/settings
/api/payment-methods
/api/promotions
/api/inventory
/api/admin/shipping
/api/admin/payments
/api/flash-sales
/api/roles
/api/permissions
/api/colors
/api/upload
/api/admin/api
```

## API Chính

### Auth

```text
POST   /api/auth/register
POST   /api/auth/login
POST   /api/auth/admin/login
POST   /api/auth/forgot-password
POST   /api/auth/reset-password
GET    /api/auth/profile
PUT    /api/auth/profile
POST   /api/auth/change-password
DELETE /api/auth/account
GET    /api/auth/addresses
POST   /api/auth/addresses
PUT    /api/auth/addresses/:id
DELETE /api/auth/addresses/:id
PUT    /api/auth/addresses/:id/default
```

### Products

```text
GET    /api/products
GET    /api/products/featured
GET    /api/products/search?q=query
GET    /api/products/:id
POST   /api/products
PUT    /api/products/:id
DELETE /api/products/:id
POST   /api/products/upload-images
DELETE /api/products/delete-images
```

### Categories

```text
GET    /api/categories
GET    /api/categories/tree
GET    /api/categories/slug/:slug
GET    /api/categories/:id
GET    /api/categories/:id/products
POST   /api/categories
PUT    /api/categories/:id
DELETE /api/categories/:id
POST   /api/categories/:id/upload-images
DELETE /api/categories/:id/images/:publicId
```

### Orders

```text
GET    /api/orders/track/:orderNumber
GET    /api/orders/track-email/:email
POST   /api/orders/guest
GET    /api/orders/my-orders
GET    /api/orders/my-orders/:id
POST   /api/orders
PUT    /api/orders/:id/cancel
GET    /api/orders
GET    /api/orders/stats
GET    /api/orders/:id
POST   /api/orders/admin
PUT    /api/orders/:id
PUT    /api/orders/:id/status
```

### Admin

```text
GET    /api/admin/stats
GET    /api/admin/revenue-data
GET    /api/admin/product-stats
GET    /api/admin/orders
GET    /api/admin/orders/:orderId
PUT    /api/admin/orders/:id
PUT    /api/admin/orders/:id/status
PUT    /api/admin/orders/:id/cancel
DELETE /api/admin/orders/:id
PUT    /api/admin/orders/bulk-status
GET    /api/admin/orders/:orderId/print
POST   /api/admin/orders/:orderId/email
GET    /api/admin/products
POST   /api/admin/products
PUT    /api/admin/products/:id
DELETE /api/admin/products/:id
GET    /api/admin/categories
POST   /api/admin/categories
PUT    /api/admin/categories/:id
DELETE /api/admin/categories/:id
GET    /api/admin/users
GET    /api/admin/users/:userId
POST   /api/admin/users
PUT    /api/admin/users/:id
PUT    /api/admin/users/bulk-status
DELETE /api/admin/users/:id
GET    /api/admin/analytics
GET    /api/admin/analytics/orders
GET    /api/admin/analytics/customers
GET    /api/admin/analytics/sales
GET    /api/admin/analytics/products
GET    /api/admin/analytics/daily-revenue
POST   /api/admin/reports
POST   /api/admin/export
POST   /api/admin/import
```

### Commerce Modules

```text
/api/cart
/api/wishlist
/api/reviews
/api/promotions
/api/flash-sales
/api/inventory
/api/payment-methods
/api/admin/payments
/api/admin/shipping
/api/notifications
/api/settings
/api/activity
/api/roles
/api/permissions
/api/colors
```

## Database Models

Model chính trong `src/models`:

- `User`: tài khoản, role, trạng thái, địa chỉ, preference, thống kê mua hàng.
- `Role`, `Permission`: RBAC theo resource/action và role level.
- `Product`: sản phẩm đa ngôn ngữ, giá, media, variants, stock, SEO, badges.
- `Category`: danh mục đa ngôn ngữ, cây cha-con, ảnh và banner.
- `Order`: đơn hàng user/guest, items, địa chỉ, thanh toán, coupon/referral.
- `Cart`, `Wishlist`: giỏ hàng và danh sách yêu thích theo user.
- `Review`: đánh giá sản phẩm.
- `Promotion`, `FlashSale`: coupon, khuyến mãi, giảm giá theo thời gian.
- `Inventory`, `StockMovement`: tồn kho và lịch sử điều chỉnh.
- `Settings`: cấu hình website, theme, shipping, notification.
- `Notification`, `ActivityLog`: thông báo và audit log.
- `ShippingMethod`, `Shipment`, `TrackingEvent`: vận chuyển và tracking.
- `PaymentMethod`, `Transaction`, `Refund`: thanh toán admin, giao dịch, hoàn tiền.
- `ApiKey`, `ApiLog`, `Integration`: API key và tích hợp hệ thống.
- `Color`: bảng màu sản phẩm.

## Bảo Mật

Server áp dụng các lớp bảo vệ:

- Helmet security headers.
- CORS allowlist theo environment.
- JWT bearer token cho protected routes.
- Role check `Admin`, `Super Admin`, `Customer`.
- RBAC theo `Role`/`Permission` cho một số module.
- Rate limit riêng cho API chung, auth, admin, password reset, product listing.
- `TRUST_PROXY` mặc định `false`; khi deploy sau một proxy/load balancer tin cậy, đặt số hop cụ thể như `1`, không dùng `true`.
- Sanitize NoSQL injection bằng `express-mongo-sanitize`.
- XSS sanitize bằng `xss-clean`.
- Validate request body/params bằng Zod middleware.

## Seed Dữ Liệu

Seed dữ liệu mẫu:

```bash
npm run seed
```

Ngoài ra trong `src/scripts` có các script seed mở rộng:

```text
seedData.ts
seedEnhancedData.ts
seedRolesAndPermissions.ts
```

## Testing

```bash
npm test
```

Jest được cấu hình trong `jest.config.js`. Hiện có test mẫu cho order controller trong `src/tests/controllers`.

## Build Production

```bash
npm run build
npm start
```

Cần đảm bảo production đã cấu hình các biến:

```text
MONGODB_URI
JWT_SECRET
NODE_ENV=production
FRONTEND_URL or PRODUCTION_FRONTEND_URL
TRUST_PROXY=false or a concrete trusted proxy hop count, for example TRUST_PROXY=1
```

Nếu dùng upload Cloudinary hoặc reset password, cần thêm Cloudinary và Email env tương ứng.

Kiểm tra env production trước deploy:

```bash
NODE_ENV=production npm run env:production:check
```

Script này kiểm tra các biến bắt buộc cho production gồm MongoDB, JWT, frontend URL, Cloudinary và email reset password. `TRUST_PROXY=true` bị chặn; hãy dùng `false` hoặc số hop cụ thể như `1`.

## License

MIT
