# Inventory Management System

A full-stack inventory management system built with React (Vite), Node.js (Express), and Prisma. Features invoice billing, purchase orders, product management, and barcode scanner support.

## Features

### Admin Features
- **Employee Management**: Create, update, and delete employee accounts
- **Statistics Dashboard**: View detailed statistics for invoices and purchase orders
- **View All Records**: Access all invoices and purchase orders from all employees
- **Inventory Management**: View complete inventory status

### Employee Features
- **Invoice Creation**: Create invoices with barcode scanner support
- **Purchase Order Creation**: Create purchase orders with barcode scanner support
- **Product Management**: Add, edit, and delete products
- **Inventory View**: View current inventory levels
- **Personal Records**: View only their own invoices and purchase orders

### Common Features
- **Barcode Scanner Support**: USB barcode scanner integration for quick product addition
- **Multi-user System**: Role-based access control (Admin/Employee)
- **Real-time Inventory Tracking**: Automatic stock updates on purchase orders
- **Professional UI**: Clean, modern interface built with shadcn/ui

## Tech Stack

### Frontend
- React 18 with TypeScript
- Vite
- React Router
- TanStack Query
- Zustand (State Management)
- shadcn/ui (UI Components)
- Tailwind CSS
- Recharts (Charts)

### Backend
- Node.js
- Express
- TypeScript
- Prisma ORM
- PostgreSQL (Neon Database)
- JWT Authentication
- bcryptjs (Password Hashing)

## Prerequisites

- Node.js 18+ and npm/yarn
- PostgreSQL database (or Neon Database account)
- USB Barcode Scanner (optional, for barcode scanning feature)

## Installation

### 1. Clone the repository

```bash
git clone <repository-url>
cd inventory
```

### 2. Backend Setup

```bash
cd server
npm install
```

Create a `.env` file in the `server` directory:

```env
DATABASE_URL="postgresql://user:password@host:5432/database?sslmode=require"
JWT_SECRET="your-secret-key-change-this-in-production"
PORT=5000
NODE_ENV=development
```

Generate Prisma client and run migrations:

```bash
npx prisma generate
npx prisma migrate dev --name init
```

(Optional) Seed the database with an admin user:

```bash
npx ts-node prisma/seed.ts
```

Start the development server:

```bash
npm run dev
```

### 3. Frontend Setup

```bash
cd client
npm install
```

Start the development server:

```bash
npm run dev
```

The application will be available at `http://localhost:3000`

## Database Seeding

To create an initial admin user, you can use the seed script:

```bash
cd server
npx ts-node prisma/seed.ts
```

Or manually create a user via the registration endpoint:

```bash
POST http://localhost:5000/api/auth/register
{
  "email": "admin@example.com",
  "password": "password123",
  "name": "Admin User",
  "role": "ADMIN"
}
```

## Barcode Scanner Setup

1. Connect your USB barcode scanner to your computer
2. The scanner will act as a keyboard input device
3. When creating an invoice or purchase order, focus on the barcode input field
4. Scan a product barcode - it will automatically add the product if it exists in the database
5. The system also supports manual barcode entry

**Note**: Make sure products have barcodes assigned in the product management page for barcode scanning to work.

## Project Structure

```
inventory/
├── server/
│   ├── src/
│   │   ├── routes/          # API routes
│   │   ├── middleware/      # Auth middleware
│   │   └── index.ts         # Server entry point
│   ├── prisma/
│   │   └── schema.prisma    # Database schema
│   └── package.json
├── client/
│   ├── src/
│   │   ├── components/      # React components
│   │   ├── pages/          # Page components
│   │   ├── lib/            # Utilities
│   │   └── store/          # State management
│   └── package.json
└── README.md
```

## API Endpoints

### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/register` - User registration (for initial setup)

### Users (Admin only)
- `GET /api/users` - Get all users
- `POST /api/users` - Create user
- `PUT /api/users/:id` - Update user
- `DELETE /api/users/:id` - Delete user

### Products
- `GET /api/products` - Get all products
- `POST /api/products` - Create product
- `PUT /api/products/:id` - Update product
- `DELETE /api/products/:id` - Delete product

### Invoices
- `GET /api/invoices` - Get invoices (all for admin, own for employee)
- `POST /api/invoices` - Create invoice
- `GET /api/invoices/:id` - Get invoice details
- `DELETE /api/invoices/:id` - Delete invoice

### Purchase Orders
- `GET /api/purchase-orders` - Get purchase orders (all for admin, own for employee)
- `POST /api/purchase-orders` - Create purchase order
- `GET /api/purchase-orders/:id` - Get purchase order details
- `DELETE /api/purchase-orders/:id` - Delete purchase order

### Statistics (Admin only)
- `GET /api/statistics/invoices` - Invoice statistics
- `GET /api/statistics/purchase-orders` - Purchase order statistics

### Inventory
- `GET /api/inventory` - Get inventory status

## Development

### Backend
```bash
cd server
npm run dev  # Starts with nodemon
npm run build  # Build for production
npm start  # Run production build
```

### Frontend
```bash
cd client
npm run dev  # Development server
npm run build  # Build for production
npm run preview  # Preview production build
```

## Production Deployment

### Quick Start

1. **Backend Setup:**
```bash
cd server
npm install
cp .env.example .env
# Edit .env with your production values
npx prisma generate
npx prisma migrate deploy
npm run build
npm start
```

2. **Frontend Setup:**
```bash
cd client
npm install
# Create .env.production with: VITE_API_URL=https://api.yourdomain.com
npm run build
# Deploy the dist/ folder to your hosting service
```

### Environment Variables

**Frontend (`client/.env.production`):**
```env
VITE_API_URL=https://api.yourdomain.com
```

**Backend (`server/.env`):**
```env
DATABASE_URL="postgresql://user:password@host:5432/database?sslmode=require"
JWT_SECRET="your-secret-key-change-this-in-production"
PORT=5000
NODE_ENV=production
CORS_ORIGIN="https://yourdomain.com"
LOG_LEVEL="info"
```

### Important Notes

- **Frontend:** Vite environment variables must be prefixed with `VITE_` and are embedded at build time
- **Backend:** Environment variables are read at runtime from `.env` file
- **API URL:** In development, uses Vite proxy. In production, must set `VITE_API_URL`
- **CORS:** Backend `CORS_ORIGIN` must match your frontend domain

For detailed deployment instructions, see [DEPLOYMENT.md](./DEPLOYMENT.md)

## License

ISC

## Support

For issues and questions, please open an issue in the repository.

