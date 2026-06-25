# Interview Preparation Guide

## Project Overview

This is a product browsing backend that handles 200,000 products with fast pagination and category filtering.

## Key Files

| File | Lines | Purpose |
|------|-------|---------|
| `api/index.js` | ~40 | Serverless API endpoint |
| `seed.js` | ~50 | Generate 200k products |
| `schema.sql` | ~15 | Database schema |
| `public/index.html` | ~30 | UI |
| `public/script.js` | ~80 | Frontend logic |
| `public/styles.css` | ~100 | Styling |

## Architecture Decisions

### 1. Why Cursor-Based Pagination?

**Offset-based (LIMIT/OFFSET):**
```sql
SELECT * FROM products ORDER BY created_at DESC LIMIT 20 OFFSET 1000;
```
- Problem 1: If a product is inserted at position 999, the next page shows a duplicate
- Problem 2: If a product is deleted, the next page skips an item
- Problem 3: PostgreSQL must scan and skip 1000 rows (slow at high offsets)

**Cursor-based (Keyset):**
```sql
SELECT * FROM products 
WHERE (created_at, id) < ('2025-01-15', 12345)
ORDER BY created_at DESC, id DESC 
LIMIT 20;
```
- Uses index directly: O(log n) vs O(offset)
- Data changes don't affect already-fetched pages
- The cursor is the last item's (created_at, id)

### 2. Why Composite Index?

```sql
CREATE INDEX idx_products_created_id ON products (created_at DESC, id DESC);
```
- PostgreSQL uses the index for both sorting AND filtering
- The `id` in the index ensures deterministic ordering when timestamps are equal

### 3. Why Supabase?

- Free PostgreSQL hosting
- Built-in REST API (we use the JS client)
- Easy setup for the assignment

## API Design

```
GET /api?category=Electronics&cursor=2025-01-15T10:30:00.000Z|12345&limit=20

Response:
{
  "products": [...],
  "nextCursor": "2025-01-15T10:30:00.000Z|12345",
  "total": 200000
}
```

- `cursor`: Encodes the last item's position
- `nextCursor`: null if no more pages
- `total`: For showing "X products" count

## Live Coding Preparation

### Question: "How does cursor pagination work?"

Explain:
1. First page: No cursor, fetch first 20 items
2. Response includes `nextCursor` = last item's `(created_at, id)`
3. Next page: Pass cursor, SQL filters `WHERE (created_at, id) < cursor`
4. This uses the index directly, no OFFSET needed

### Question: "What if data changes mid-browse?"

Explain:
- New products added: They appear at the top (newest first), don't affect already-fetched pages
- Products deleted: Already-fetched items are still valid
- The cursor points to a specific position, not an offset

### Question: "How would you improve this?"

Potential answers:
- Add Redis caching for total count
- Use PostgreSQL materialized views for category counts
- Add full-text search with tsvector
- Implement infinite scroll instead of pagination buttons

### Live Coding Task: "Add a search feature"

```javascript
// Add to api/index.js
if (search) {
  query = query.ilike('name', `%${search}%`);
}
```

## Deployment Steps

1. Create Supabase project
2. Run schema.sql in SQL Editor
3. Set environment variables in Vercel
4. Run `npm run seed` to populate data
5. Deploy with `vercel --prod`
