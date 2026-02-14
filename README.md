# Contribution Management System - NestJS Backend

A production-ready REST API for managing pooled financial contributions, built with NestJS, Prisma ORM, and PostgreSQL.

## Architecture

- **Clean Architecture** with Controller > Service > Repository layers
- **Modular Monolith** design (microservice-ready)
- **Double-entry inspired ledger** for financial integrity
- **JWT authentication** with role-based access control (ADMIN, OPERATOR, VIEWER)
- **Soft deletes** across all entities via Prisma middleware
- **Global exception handling** with consistent error responses
- **Swagger API documentation** auto-generated

## Prerequisites

- Node.js 18+
- PostgreSQL 14+ (local or remote)
- npm or yarn

## Setup

### 1. Install dependencies

```bash
cd nestjs-backend
npm install
```

### 2. Configure environment

```bash
cp .env.example .env
```

Edit `.env` and set your PostgreSQL connection string:

```
DATABASE_URL="postgresql://postgres:your_password@localhost:5432/contribution_db?schema=public"
JWT_SECRET="change-this-to-a-strong-random-string"
```

### 3. Create the database

```bash
# Create the database in PostgreSQL
createdb contribution_db

# Or via psql:
psql -U postgres -c "CREATE DATABASE contribution_db;"
```

### 4. Run migrations

```bash
npx prisma migrate dev --name init
```

### 5. Generate Prisma client

```bash
npx prisma generate
```

### 6. Seed the database

```bash
npx prisma db seed
```

This creates:
- Default admin user (admin@system.local / Admin@123)
- Transaction types (CASH_IN, CASH_OUT, SEAT_PAYMENT, EXPENSE)
- Default categories

### 7. Start the server

```bash
# Development (with hot reload)
npm run start:dev

# Production
npm run build
npm run start:prod
```

The API will be available at `http://localhost:3000/api`

## API Documentation

Swagger UI is available at: `http://localhost:3000/api/docs`

## API Endpoints

### Authentication
| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| POST | /api/auth/login | Public | Login with email/password |
| POST | /api/auth/register | ADMIN | Register a new user |
| GET | /api/auth/profile | Authenticated | Get current user profile |

### Members
| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| POST | /api/members | ADMIN, OPERATOR | Create member |
| GET | /api/members | All roles | List members (paginated, filterable) |
| GET | /api/members/:id | All roles | Get member with recent transactions |
| PATCH | /api/members/:id | ADMIN, OPERATOR | Update member |
| PATCH | /api/members/:id/deactivate | ADMIN | Deactivate member |
| DELETE | /api/members/:id | ADMIN | Soft delete member |

### Transactions
| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| POST | /api/transactions | ADMIN, OPERATOR | Record transaction |
| GET | /api/transactions | All roles | List transactions (paginated, filterable) |
| GET | /api/transactions/:id | All roles | Get transaction with ledger entries |

### Categories
| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| POST | /api/categories | ADMIN | Create category |
| GET | /api/categories | All roles | List categories |
| GET | /api/categories/:id | All roles | Get category |
| PATCH | /api/categories/:id | ADMIN | Update category |
| DELETE | /api/categories/:id | ADMIN | Soft delete category |

### Seats
| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| POST | /api/seats | ADMIN, OPERATOR | Create seat |
| GET | /api/seats | All roles | List seats with contributions |
| GET | /api/seats/:id | All roles | Get seat details |
| PATCH | /api/seats/:id | ADMIN, OPERATOR | Update seat |
| DELETE | /api/seats/:id | ADMIN | Soft delete seat |

### Seat Contributions
| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| POST | /api/seat-contributions | ADMIN, OPERATOR | Record contribution |
| GET | /api/seat-contributions | All roles | List contributions (filterable) |

### Expenses
| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| POST | /api/expenses | ADMIN, OPERATOR | Record expense |
| GET | /api/expenses | All roles | List expenses (paginated) |
| GET | /api/expenses/:id | All roles | Get expense with ledger entries |
| PATCH | /api/expenses/:id | ADMIN, OPERATOR | Update expense |
| DELETE | /api/expenses/:id | ADMIN | Soft delete expense |

### Ledger
| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| GET | /api/ledger | ADMIN | Query ledger entries |
| GET | /api/ledger/balances | ADMIN | Get account balances |

### Reports
| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| GET | /api/reports/member-statement/:memberId | ADMIN, OPERATOR | Member financial statement |
| GET | /api/reports/monthly-collection | ADMIN | Monthly collection report |
| GET | /api/reports/expense-summary | ADMIN | Expense summary by category |
| GET | /api/reports/cash-flow | ADMIN | Cash flow report |

### Dashboard
| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| GET | /api/dashboard/summary | Authenticated | Dashboard summary statistics |

## Quick Test

```bash
# 1. Login
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@system.local","password":"Admin@123"}'

# 2. Use the returned accessToken in subsequent requests
export TOKEN="your-access-token-here"

# 3. Create a member
curl -X POST http://localhost:3000/api/members \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"name":"John Doe","phone":"+1234567890","email":"john@example.com"}'

# 4. Record a transaction
curl -X POST http://localhost:3000/api/transactions \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"memberId":"<member-uuid>","transactionType":"CASH_IN","amount":5000,"transactionDate":"2024-01-15","description":"Monthly contribution"}'

# 5. Get dashboard
curl http://localhost:3000/api/dashboard/summary \
  -H "Authorization: Bearer $TOKEN"
```

## DBeaver Connection

To connect DBeaver to your local PostgreSQL:
1. Host: `localhost`
2. Port: `5432`
3. Database: `contribution_db`
4. Username: `postgres`
5. Password: your PostgreSQL password

## Project Structure

```
src/
├── main.ts                          # Bootstrap, global config
├── app.module.ts                    # Root module
├── config/configuration.ts          # Environment config
├── prisma/                          # Prisma service & module
├── common/                          # Shared utilities
│   ├── decorators/                  # @Roles(), @CurrentUser()
│   ├── filters/                     # Global exception filter
│   ├── guards/                      # JWT & Roles guards
│   ├── interceptors/                # Response transform
│   ├── pipes/                       # Custom validation
│   └── types/                       # Shared TypeScript types
└── modules/
    ├── auth/                        # JWT login, registration
    ├── members/                     # Member CRUD
    ├── categories/                  # Category CRUD
    ├── transactions/                # Financial transactions + ledger
    ├── seats/                       # Seat management
    ├── seat-contributions/          # Per-seat contributions
    ├── expenses/                    # Expense tracking
    ├── ledger/                      # Financial truth layer
    ├── reports/                     # Financial reports
    └── dashboard/                   # Summary statistics
```

## Financial Integrity

- All monetary amounts use `DECIMAL(15,2)` precision
- Every financial operation creates paired ledger entries (double-entry inspired)
- All financial writes use `prisma.$transaction()` for atomicity
- Running balances are maintained on both transactions and ledger entries
- Ledger entries are immutable (corrections via reversal entries)
- Soft deletes prevent data loss
