# Koshiro Fashion Server

Backend API cho ứng dụng thời trang Nhật Bản Koshiro Fashion.

## 🚀 Công nghệ sử dụng

- **Node.js** - Runtime environment
- **Express.js** - Web framework
- **MongoDB** - NoSQL database
- **Mongoose** - MongoDB ODM
- **TypeScript** - Type safety
- **JWT** - Authentication
- **bcryptjs** - Password hashing

## 📋 Yêu cầu hệ thống

- Node.js 18+
- MongoDB Atlas account
- npm hoặc yarn

## 🛠️ Cài đặt

1. **Clone repository và cài đặt dependencies:**
```bash
cd server
npm install
```

2. **Tạo file .env:**
```bash
# MongoDB Connection
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/database-name

# JWT Secret
JWT_SECRET=koshiro-fashion-secret-key-2024

# Server Config
PORT=3000
NODE_ENV=development
```

3. **Seed dữ liệu mẫu:**
```bash
npm run seed
```

4. **Chạy server:**
```bash
# Development
npm run dev

# Production
npm run build
npm start
```

## 📊 Cấu trúc Database

### Collections

#### Users
- Thông tin người dùng và admin
- Authentication và authorization
- Thống kê đơn hàng

#### Categories
- Danh mục sản phẩm
- Hỗ trợ đa ngôn ngữ (VI, EN, JA)
- Hierarchical structure

#### Products
- Thông tin sản phẩm
- Hỗ trợ đa ngôn ngữ
- Images, sizes, colors, tags
- Stock management

#### Orders
- Đơn hàng của khách hàng
- Order items với product details
- Shipping và billing addresses
- Payment status

## 🔐 Authentication

### JWT Token
- Access token với thời hạn 7 ngày
- Role-based access control (admin/customer)
- Secure password hashing với bcrypt

### Endpoints
- `POST /api/auth/register` - Đăng ký khách hàng
- `POST /api/auth/login` - Đăng nhập khách hàng
- `POST /api/auth/admin/login` - Đăng nhập admin
- `GET /api/auth/profile` - Lấy thông tin profile

## 🛡️ Security

- **Helmet** - Security headers
- **CORS** - Cross-origin resource sharing
- **Input validation** - Sanitize user inputs
- **Rate limiting** - Prevent abuse
- **JWT verification** - Secure API access

## 📈 Performance

- **MongoDB Indexes** - Optimized queries
- **Connection pooling** - Efficient database connections
- **Compression** - Reduced response size
- **Caching** - Fast data retrieval

## 🔧 Development

### Scripts
```bash
npm run dev      # Development server với hot reload
npm run build    # Build TypeScript
npm run start    # Production server
npm run seed     # Seed dữ liệu mẫu
npm run test     # Run tests
```

### Environment Variables
- `MONGODB_URI` - MongoDB connection string
- `JWT_SECRET` - Secret key cho JWT
- `PORT` - Server port (default: 3000)
- `NODE_ENV` - Environment (development/production)

## 📝 API Documentation

### Base URL
```
http://localhost:3000/api
```

### Health Check
```
GET /api/health
```

### Authentication
```
POST /api/auth/register
POST /api/auth/login
POST /api/auth/admin/login
GET /api/auth/profile
```

### Products
```
GET    /api/products                    - Get all products (with filters)
GET    /api/products/featured           - Get featured products
GET    /api/products/search?q=query     - Search products
GET    /api/products/:id                - Get single product
POST   /api/products                    - Create product (admin)
PUT    /api/products/:id                - Update product (admin)
DELETE /api/products/:id                - Delete product (admin)
```

### Categories
```
GET    /api/categories                  - Get all categories
GET    /api/categories/tree             - Get category tree
GET    /api/categories/slug/:slug       - Get category by slug
GET    /api/categories/:id              - Get single category
GET    /api/categories/:id/products     - Get category with products
POST   /api/categories                  - Create category (admin)
PUT    /api/categories/:id              - Update category (admin)
DELETE /api/categories/:id              - Delete category (admin)
```

### Orders
```
GET    /api/orders                      - Get all orders (admin)
GET    /api/orders/stats                - Get order statistics (admin)
GET    /api/orders/:id                  - Get single order (admin)
PUT    /api/orders/:id/status           - Update order status (admin)
GET    /api/orders/my-orders            - Get user orders (customer)
GET    /api/orders/my-orders/:id        - Get user order (customer)
POST   /api/orders                      - Create order (customer)
PUT    /api/orders/:id/cancel           - Cancel order (customer)
```

## 🚀 Deployment

### Production Build
```bash
npm run build
npm start
```

### Environment Variables
Đảm bảo set các environment variables cho production:
- `MONGODB_URI`
- `JWT_SECRET`
- `NODE_ENV=production`

## 📞 Support

Nếu có vấn đề, vui lòng tạo issue hoặc liên hệ team development.

## 📄 License

MIT License 