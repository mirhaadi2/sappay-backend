# Backend Architecture & Address Module Guide

## Project Overview

A production-grade Node.js + Express + TypeScript backend for an e-commerce platform (SapPay) with comprehensive user authentication, OTP verification, and address management systems.

## Technology Stack

### Core Framework
- **Node.js** with TypeScript
- **Express.js** v4 - Web server
- **CommonJS** modules (not ES modules) - for Sequelize compatibility
- **PostgreSQL** - Primary database
- **Redis** (optional) - For session storage

### Authentication & Security
- **Express Session** - Session-based authentication
- **Bcrypt** - Password hashing
- **Helmet.js** - Security headers
- **CORS** - Cross-origin resource sharing
- **UUID** - Unique identifiers

### Database & ORM
- **Sequelize** v6 - ORM for PostgreSQL
- **Sequelize CLI** - Database migrations
- **uuid-v4** - UUID generation

### Email Service
- **Nodemailer** - SMTP email delivery
- **Gmail** - Email provider (configurable)

### Validation & Error Handling
- **Zod** (optional) - Schema validation
- **Custom AppError** - Consistent error handling

## Project Structure

```
backend/
├── src/
│   ├── app.ts                    # Express app setup
│   ├── index.ts                  # Server entry point
│   ├── config/
│   │   ├── index.ts              # Environment config
│   │   ├── enums.ts              # Shared enums
│   │   ├── jwt.ts                # JWT config (if used)
│   │   └── session.ts            # Session config
│   ├── db/
│   │   ├── sequelize.ts          # Sequelize instance
│   │   ├── migrate.ts            # Migration runner
│   │   └── migrations/           # Migration files (.cjs)
│   ├── middleware/
│   │   ├── auth.middleware.ts    # Authentication check
│   │   └── error.middleware.ts   # Error handler
│   ├── modules/
│   │   ├── auth/                 # Authentication module
│   │   │   └── routes.ts
│   │   ├── users/                # User management module
│   │   │   ├── models.ts
│   │   │   ├── controller.ts
│   │   │   ├── service.ts
│   │   │   ├── repository.ts
│   │   │   ├── routes.ts
│   │   │   ├── otp.model.ts
│   │   │   └── otp.service.ts
│   │   └── address/              # NEW: Address management module
│   │       ├── address.model.ts
│   │       ├── address.controller.ts
│   │       ├── address.service.ts
│   │       ├── address.repository.ts
│   │       ├── address.routes.ts
│   │       ├── index.ts
│   │       └── API_DOCUMENTATION.md
│   ├── types/
│   │   ├── auth.ts
│   │   ├── user.ts
│   │   └── express.d.ts          # TypeScript declarations
│   └── utils/
│       ├── AppError.ts
│       ├── password.ts
│       ├── emailTransporter.ts
│       └── sendEmail.ts
├── jest.config.js
├── tsconfig.json
├── tsconfig.build.json
└── package.json
```

## Architecture Layers

### Controller Layer
Handles HTTP requests and responses. Located in each module's `controller.ts`.

```typescript
// Example: AddressController
async createAddress(req: Request, res: Response, next: NextFunction) {
  // 1. Extract user from request
  // 2. Validate input and request
  // 3. Call service layer
  // 4. Format and send response
  // 5. Pass errors to next middleware
}
```

**Responsibilities:**
- Parse request body/params
- Validate inputs
- Call service methods
- Format response
- Pass errors to middleware

---

### Service Layer
Contains business logic. Located in each module's `service.ts`.

```typescript
// Example: AddressService
async createAddress(userId: string, addressData: {...}) {
  // 1. Validate business rules
  // 2. Call repository
  // 3. Handle side effects
  // 4. Return data or throw errors
}
```

**Responsibilities:**
- Business logic validation
- Coordinate between repositories
- Handle side effects
- Throw meaningful errors

---

### Repository Layer
Data access abstraction. Located in each module's `repository.ts`.

```typescript
// Example: AddressRepository
async create(addressData: {...}) {
  // 1. Call database
  // 2. Return model instance
}
```

**Responsibilities:**
- Database queries
- Model manipulation
- Pure data operations

---

### Model Layer
ORM models with schema definitions. Located in each module's `model.ts`.

```typescript
// Example: Address Model
export class Address extends Model implements AddressAttributes {
  // Schema definition
  // Type definitions
  // Associations with other models
}
```

**Responsibilities:**
- Define schema
- Type definitions
- Model associations
- Validation rules

---

### Routes Layer
HTTP route definitions. Located in each module's `routes.ts`.

```typescript
// Example: Address Routes
const router = Router();
router.use(authMiddleware);  // Apply auth to all routes
router.post("/", AddressController.createAddress);
router.get("/", AddressController.getAddresses);
```

**Responsibilities:**
- Define endpoints
- Apply middleware
- Map HTTP methods to handlers

## Address Module (NEW)

### Model Relations

```
User (1) ──→ (Many) Address
- User.id (UUID, PK)
- Address.userId (UUID, FK to User)
- CASCADE DELETE: Deleting user removes all addresses
```

### Database Indexes

```sql
-- Primary lookup
CREATE INDEX idx_addresses_userId ON addresses(userId);

-- Optimized for "get all with default first"
CREATE INDEX idx_addresses_userId_isDefault ON addresses(userId, isDefault);
```

### Features

✅ **Full CRUD Operations**
- Create addresses
- Read/list addresses
- Update address details
- Delete addresses

✅ **Default Address Management**
- Set one default address per user
- Automatic cascade (only one marked as default)
- Fast retrieval via index

✅ **Data Validation**
- Phone number format (10 digits)
- Address type enum (HOME, WORK, OTHER)
- Required fields enforcement

✅ **Security**
- User isolation (can only access own addresses)
- Session-based authentication
- Cascade delete on user deletion

### API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/addresses` | Create address |
| GET | `/api/addresses` | List all user addresses |
| GET | `/api/addresses/:id` | Get address by ID |
| GET | `/api/addresses/default` | Get default address |
| PUT | `/api/addresses/:id` | Update address |
| DELETE | `/api/addresses/:id` | Delete address |
| POST | `/api/addresses/:id/set-default` | Set as default |

See `src/modules/address/API_DOCUMENTATION.md` for complete API docs.

## Database Migrations

### Running Migrations

```bash
# Run all pending migrations
npm run migrate

# Run specific migration
node src/db/migrate.ts 20260317-create-addresses-table
```

### Creating New Migration

```bash
npx sequelize-cli migration:generate --name name-of-migration
```

**Migration Convention:**
- File format: `YYYYMMDD-description.cjs` (CommonJS)
- Located in: `src/db/migrations/`
- Must implement `up()` and `down()` functions

### Existing Migrations

1. **20260317092512-add-deleted_at-column-in-users-table.cjs**
   - Adds soft delete column to users

2. **20260317104618-add-email-column-in-otp-and-remove-phone-column.cjs**
   - Adds email column to OTP
   - Removes phone column requirement

3. **20260317-create-addresses-table.cjs** (NEW)
   - Creates addresses table
   - Sets up foreign key to users
   - Creates performance indexes

## Authentication Flow

### Session-Based Authentication

1. **Register User**
   ```
   POST /api/auth/register → Create user session → Return success
   ```

2. **Login User**
   ```
   POST /api/auth/login → Set session cookie → Return user data
   ```

3. **Protected Routes**
   ```
   All requests → authMiddleware checks session → Pass to controller
   ```

4. **Logout**
   ```
   POST /api/auth/logout → Destroy session cookie → Return success
   ```

### Authentication Middleware

```typescript
// auth.middleware.ts
export function authMiddleware(req: Request, res: Response, next: NextFunction) {
  if (!req.user) {
    throw new AppError("User not authenticated", 401);
  }
  next();
}
```

**Applied to:**
- All address endpoints
- User profile endpoints
- Admin endpoints

## Error Handling

### Custom AppError Class

```typescript
// utils/AppError.ts
export class AppError extends Error {
  constructor(message: string, public code: number) {
    super(message);
  }
}
```

### Error Middleware

```typescript
// middleware/error.middleware.ts
app.use((err, req, res, next) => {
  const code = err.code || 500;
  const message = err.message || "Internal server error";
  
  res.status(code).json({
    success: false,
    message,
    code,
  });
});
```

### Throwing Errors

```typescript
// In service layer
if (!address) {
  throw new AppError("Address not found", 404);
}

// In controller layer (pass to next)
try {
  // ...
} catch (error) {
  next(error);
}
```

## Environment Variables

### Required (.env file)

```env
# Database
DB_HOST=localhost
DB_PORT=5432
DB_NAME=sappay
DB_USER=postgres
DB_PASSWORD=your_password

# Email (Gmail SMTP)
GMAIL_USER=your-email@gmail.com
GMAIL_APP_PASSWORD=your-app-password

# Server
NODE_ENV=development
PORT=3000

# Session
SESSION_SECRET=your-secret-key

# Frontend
FRONTEND_ORIGIN=http://localhost:5173

# Optional
REDIS_URL=redis://localhost:6379
```

### Development vs Production

```env
# Development
NODE_ENV=development

# Production
NODE_ENV=production
```

## Running the Backend

### Install Dependencies

```bash
npm install
```

### Development Mode

```bash
npm run dev      # With hot reload
# or
npm start        # Direct start
```

### Build

```bash
npm run build    # Compile TypeScript
```

### Production

```bash
npm run build
npm start
```

### Testing

```bash
npm test         # Run all tests
npm run test:watch  # Watch mode
npm run test:coverage  # With coverage report
```

## API Response Format

### Success Response

```json
{
  "success": true,
  "data": {...},
  "message": "Operation successful",
  "count": 1
}
```

### Error Response

```json
{
  "success": false,
  "message": "Error description",
  "code": 400
}
```

## Security Best Practices

✅ **Implemented**
- Helmet.js security headers
- CORS with credentials support
- Password hashing with bcrypt
- Session-based authentication
- SQL injection prevention (Sequelize ORM)
- Input validation

⚠️ **Recommended**
- Rate limiting (add express-rate-limit)
- Request logging (add winston or morgan)
- Audit logging for sensitive operations
- HTTPS in production
- Environment-based configuration
- Regular security updates

## Performance Considerations

### Database Indexes
- `userId` - Fast address lookup
- `userId + isDefault` - Optimized default address retrieval

### Caching Strategy
- Session caching in Redis (optional)
- Frontend React Query caching (5 min stale time)

### Query Optimization
- Use Sequelize eager loading for relations
- Select only required fields
- Avoid N+1 queries

## Troubleshooting

### Database Connection Issues

```bash
# Test PostgreSQL connection
psql -h localhost -U postgres -d sappay -c "SELECT 1"

# Reset database
npm run db:drop
npm run db:create
npm run migrate
```

### Session Issues

```bash
# Clear session store
redis-cli FLUSHDB     # If using Redis
# or restart app to clear memory store
```

### Migration Errors

```bash
# Check migration status
npx sequelize-cli db:migrate:status

# Rollback specific migration
npx sequelize-cli db:migrate:undo:all
```

## Testing Endpoints

### Using cURL

```bash
# Create address
curl -X POST http://localhost:3000/api/addresses \
  -H "Content-Type: application/json" \
  -H "Cookie: connect.sid=<session>" \
  -d '{
    "type": "HOME",
    "addressLine1": "123 Main St",
    "city": "NY",
    "state": "NY",
    "postalCode": "10001",
    "country": "USA",
    "phone": "2125551234"
  }'

# Get all addresses
curl -X GET http://localhost:3000/api/addresses \
  -H "Cookie: connect.sid=<session>"
```

### Using Postman

1. Set up collection variable: `session` = <connect.sid value>
2. Add header: `Cookie: connect.sid={{session}}`
3. Import endpoints from API_DOCUMENTATION.md

## Version History

- **v1.0** - Core authentication and user management
- **v1.1** - Email OTP verification
- **v1.2** - NEW: Complete address management system with CRUD APIs

## Contributing Guidelines

1. Maintain layer separation (Controller → Service → Repository)
2. Add TypeScript types for all data
3. Use custom AppError for error handling
4. Add tests for business logic
5. Update API_DOCUMENTATION.md for new endpoints
6. Follow commit message format: `feat:`, `fix:`, `refactor:`

## License

See LICENSE file in project root
