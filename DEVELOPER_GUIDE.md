# Developer Guide: Adding New Endpoints

Quick reference for adding new API endpoints to the e-commerce platform following the functional pattern.

## File Structure Per Module

```
/modules/moduleName/
├── controller.ts      # HTTP handlers
├── service.ts         # Business logic
├── repository.ts      # Data access
├── routes.ts          # Route definitions
├── model.ts           # Sequelize model
└── index.ts           # Exports
```

## Step-by-Step: Adding a New Endpoint

### Example: Add "Get Seller Reviews" Endpoint

---

## 1. Add Repository Function

**File:** `modules/sellers/repository.ts`

```typescript
export const getSellerReviews = async (sellerId: string, filters: any) => {
  const { limit = 10, offset = 0 } = filters;
  
  // Assuming you have a Review model
  return await Review.findAndCountAll({
    where: { sellerId },
    limit,
    offset,
    order: [['createdAt', 'DESC']],
  });
};
```

---

## 2. Add Service Function

**File:** `modules/sellers/service.ts`

```typescript
import { getSellerReviews } from './repository';
import { AppError } from '../../utils/AppError';

export const getSellerReviewsService = async (sellerId: string, filters: any) => {
  const seller = await findById(sellerId);
  if (!seller) {
    throw new AppError('Seller not found', 404);
  }

  return await getSellerReviews(sellerId, filters);
};
```

---

## 3. Add Controller Handler

**File:** `modules/sellers/controller.ts`

```typescript
import { getSellerReviewsService } from './service';
import { AppError } from '../../utils/AppError';

export const getSellerReviewsHandler = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { sellerId } = req.params;
    const { limit, offset } = req.query;

    const result = await getSellerReviewsService(sellerId, {
      limit: limit ? parseInt(limit as string) : 10,
      offset: offset ? parseInt(offset as string) : 0,
    });

    res.json({
      success: true,
      data: result.rows,
      pagination: { total: result.count, limit, offset },
    });
  } catch (error) {
    next(error);
  }
};
```

---

## 4. Add Route

**File:** `modules/sellers/routes.ts`

```typescript
import { getSellerReviewsHandler } from './controller';

const router = Router();

// Add this line
router.get('/:sellerId/reviews', getSellerReviewsHandler);

export default router;
```

---

## 5. Export from Index

**File:** `modules/sellers/index.ts` (if exists)

```typescript
export { default as routes } from './routes';
export * from './controller';
export * from './service';
```

---

## Complete Pattern Reference

### ❌ DON'T DO THIS (Old Pattern)
```typescript
// ❌ Class-based
export class SellerService {
  async getSellerReviews(sellerId: string) {
    // ...
  }
}

export default new SellerService(); // Instance export

// Usage in routes:
router.get('/:id', (req, res, next) => service.getSellerReviews(...));
```

### ✅ DO THIS (New Pattern)
```typescript
// ✅ Function-based
export const getSellerReviewsService = async (sellerId: string, filters: any) => {
  // ...
};

// Usage in routes:
router.get('/:id/reviews', getSellerReviewsHandler);
```

---

## Naming Convention

Follow these conventions for consistency:

| Layer | Pattern | Example |
|-------|---------|---------|
| **Controller** | `[action]Handler` | `getSellerReviewsHandler` |
| **Service** | `[action]Service` | `getSellerReviewsService` |
| **Repository** | `[action]` | `getSellerReviews` |
| **Route** | RESTful | `GET /sellers/:id/reviews` |

---

## Common Patterns

### Creating a Resource
```typescript
// repository.ts
export const create = async (data: any) => {
  return await Model.create(data);
};

// service.ts
export const createService = async (data: any) => {
  // Validate and create
  return await create(data);
};

// controller.ts
export const createHandler = async (req, res, next) => {
  try {
    const result = await createService(req.body);
    res.status(201).json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
};

// routes.ts
router.post('/', createHandler);
```

### Updating a Resource
```typescript
// repository.ts
export const update = async (id: string, data: any) => {
  const item = await Model.findByPk(id);
  if (!item) throw new AppError('Not found', 404);
  return await item.update(data);
};

// service.ts
export const updateService = async (id: string, userId: string, data: any) => {
  const item = await findById(id);
  if (!item) throw new AppError('Not found', 404);
  if (item.userId !== userId) throw new AppError('Unauthorized', 403);
  return await update(id, data);
};

// controller.ts
export const updateHandler = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.session?.user?.id;
    const result = await updateService(id, userId, req.body);
    res.json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
};

// routes.ts
router.put('/:id', updateHandler);
```

### Deleting a Resource
```typescript
// repository.ts
export const deleteItem = async (id: string) => {
  const item = await Model.findByPk(id);
  if (!item) throw new AppError('Not found', 404);
  return await item.destroy();
};

// service.ts
export const deleteService = async (id: string, userId: string) => {
  const item = await findById(id);
  if (item.userId !== userId) throw new AppError('Unauthorized', 403);
  return await deleteItem(id);
};

// controller.ts
export const deleteHandler = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.session?.user?.id;
    await deleteService(id, userId);
    res.json({ success: true, message: 'Deleted successfully' });
  } catch (error) {
    next(error);
  }
};

// routes.ts
router.delete('/:id', deleteHandler);
```

---

## Error Handling

Always use the `AppError` class:

```typescript
import { AppError } from '../../utils/AppError';

// In service
throw new AppError('Not found', 404);
throw new AppError('Unauthorized', 403);
throw new AppError('Validation error', 400, 'Invalid input');

// Error middleware will catch and format properly
```

---

## Authentication

Use session to get current user:

```typescript
// In controller
const userId = req.session?.user?.id;
if (!userId) {
  throw new AppError('Please login', 401);
}

// Pass to service
const result = await serviceFunction(userId, ...);
```

---

## Response Format

All successful responses follow this format:

```typescript
{
  success: true,
  data: {...},
  message?: "Optional message",
  pagination?: {
    total: 100,
    limit: 20,
    offset: 0
  }
}
```

---

## Pagination

For list endpoints, always include pagination:

```typescript
// controller.ts
const { limit, offset } = req.query;

const result = await listService({
  limit: limit ? parseInt(limit as string) : 20,
  offset: offset ? parseInt(offset as string) : 0,
});

res.json({
  success: true,
  data: result.rows,
  pagination: { total: result.count, limit, offset },
});
```

```typescript
// repository.ts
export const findAll = async (filters: any) => {
  const { limit = 20, offset = 0 } = filters;
  return await Model.findAndCountAll({
    limit,
    offset,
  });
};
```

---

## Testing Your New Endpoint

### 1. Build the project
```bash
npm run build
```

### 2. Start the server
```bash
npm start
```

### 3. Test with curl
```bash
# Example: Get seller reviews
curl -X GET "http://localhost:3000/api/sellers/seller-123/reviews?limit=10&offset=0" \
  -H "Cookie: connect.sid=your_session_cookie"
```

### 4. Or use Postman/Insomnia
- Method: GET
- URL: `http://localhost:3000/api/sellers/:sellerId/reviews`
- Query: `limit=10&offset=0`
- Headers: Include session cookie

---

## Quick Checklist

- [ ] Added function to repository.ts
- [ ] Added function to service.ts
- [ ] Added handler to controller.ts
- [ ] Added route to routes.ts
- [ ] Updated API_ENDPOINTS.md with new endpoint
- [ ] Used consistent naming conventions
- [ ] Used AppError for error handling
- [ ] Used req.session?.user?.id for auth
- [ ] Included pagination for list endpoints
- [ ] Tested the endpoint

---

## Common Mistakes

❌ **Using classes** - Use functions instead
❌ **Forgetting error handling** - Always wrap in try/catch
❌ **Inconsistent naming** - Follow Handler/Service/Repo pattern
❌ **No validation** - Check required fields
❌ **Missing auth checks** - Verify user login when needed
❌ **No pagination on lists** - Always add limit/offset
❌ **Hardcoded values** - Use constants or config

---

## Reference Modules

All 5 modules follow this exact pattern:
- `modules/sellers/`
- `modules/products/`
- `modules/orders/`
- `modules/inventory/`
- `modules/address/`

Use them as examples when adding new endpoints.
