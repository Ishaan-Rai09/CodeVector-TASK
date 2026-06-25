# CodeVector Products Browser

A fast product browsing backend with cursor-based pagination.

## Why Cursor-Based Pagination?

**The Problem**: Offset-based pagination (`LIMIT x OFFSET y`) is slow on large tables and breaks when data changes:
- If a product is inserted before the current page, the next page will show a duplicate
- If a product is deleted, the next page will skip an item
- OFFSET gets slower as the offset grows (PostgreSQL must scan and skip all prior rows)

**The Solution**: Cursor-based pagination uses the last item's `(created_at, id)` as a "cursor". The next query uses `WHERE (created_at, id) < (cursor)` to get the next page. This:
- Guarantees no duplicates or skipped rows, even if data changes mid-browse
- Is O(1) instead of O(offset) since it uses the index directly
- Works perfectly with `ORDER BY created_at DESC, id DESC`

## Setup

1. Create a Supabase project at https://supabase.com
2. Run `schema.sql` in the SQL Editor
3. Set environment variables:
   ```
   SUPABASE_URL=https://your-project.supabase.co
   SUPABASE_ANON_KEY=your-anon-key
   ```
4. Run `npm install`
5. Seed the database: `npm run seed`
6. Deploy to Vercel: `vercel deploy --prod`

## API

```
GET /api?category=Electronics&cursor=<timestamp>|<id>&limit=20

Response:
{
  "products": [...],
  "nextCursor": "2025-01-15T10:30:00.000Z|12345",
  "total": 200000
}
```
