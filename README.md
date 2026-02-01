# ROMS - Restaurant Order Management System

A QR-based, in-restaurant ordering and payment system for small restaurants and chains.

## Features

### Customer Web App
- Scan QR code to access restaurant menu
- Browse menu with categories and items
- Add items to cart with modifiers
- Choose payment method (Cash or Card via Stripe)
- Real-time order status updates
- Geofenced ordering (must be at restaurant location)

### Restaurant Dashboard
- **Owners**: View analytics across all locations, manage staff
- **Managers**: View analytics for assigned location, manage orders
- **Cashiers/Servers**: View and update order statuses

### Platform Admin Dashboard
- View total revenue across all restaurants
- Track platform commission (3% of gross orders)
- Monitor restaurant performance
- Manage payouts via Stripe Connect

## Tech Stack

### Backend
- **Framework**: Laravel 11 (PHP 8.2+)
- **Database**: PostgreSQL 15+
- **Cache/Queue**: Redis
- **Real-time**: Laravel Reverb
- **Payments**: Stripe Connect

### Frontend
- **Framework**: Next.js 14 (React 18)
- **Styling**: Tailwind CSS
- **State Management**: Zustand
- **API Client**: Axios

## Project Structure

```
ROMS/
├── backend/                 # Laravel API
│   ├── app/
│   │   ├── Http/
│   │   │   ├── Controllers/
│   │   │   └── Middleware/
│   │   ├── Models/
│   │   └── Services/
│   ├── database/
│   │   ├── migrations/
│   │   └── seeders/
│   └── routes/
├── frontend/               # Next.js monorepo
│   ├── apps/
│   │   ├── customer/       # Customer ordering app
│   │   └── dashboard/      # Restaurant & Admin dashboard
│   └── packages/
│       └── shared/         # Shared components/types
├── docker/                 # Docker configuration
└── docs/                   # Documentation
```

## Getting Started

### Prerequisites
- PHP 8.2+
- Composer
- Node.js 20+
- PostgreSQL 15+
- Redis

### Backend Setup
```bash
cd backend
composer install
cp .env.example .env
php artisan key:generate
php artisan migrate
php artisan serve
```

### Frontend Setup
```bash
cd frontend
pnpm install
pnpm dev
```

## Environment Variables

### Backend (.env)
```
DB_CONNECTION=pgsql
DB_HOST=127.0.0.1
DB_PORT=5432
DB_DATABASE=roms
DB_USERNAME=postgres
DB_PASSWORD=

STRIPE_KEY=
STRIPE_SECRET=
STRIPE_WEBHOOK_SECRET=
```

### Frontend (.env.local)
```
NEXT_PUBLIC_API_URL=http://localhost:8000/api
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=
```

## License

Proprietary - All rights reserved.
