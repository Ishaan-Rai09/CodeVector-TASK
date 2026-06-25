// api/index.js - Vercel serverless function
// Cursor-based pagination: uses (created_at, id) as cursor instead of OFFSET.
// Why? OFFSET is slow on large tables and breaks when data changes mid-browse.
// Cursor approach: WHERE (created_at, id) < ($before_created_at, $before_id)
// guarantees no duplicates or skipped rows even if products are inserted/deleted.

const { createClient } = require("@supabase/supabase-js");

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

module.exports = async (req, res) => {
  // CORS headers
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(200).end();

  try {
    const { category, cursor, limit = 20 } = req.query;
    const pageSize = Math.min(Math.max(parseInt(limit) || 20, 1), 100);

    let query = supabase
      .from("products")
      .select("id, name, category, price, created_at")
      .order("created_at", { ascending: false })
      .order("id", { ascending: false })
      .limit(pageSize + 1); // fetch one extra to detect "hasMore"

    // Filter by category
    if (category) {
      query = query.eq("category", category);
    }

    // Cursor-based pagination: filter rows older than the cursor
    if (cursor) {
      const [cursorDate, cursorId] = cursor.split("|");
      // Keyset pagination: (created_at, id) < (cursorDate, cursorId)
      // This works because we order by created_at DESC, id DESC
      query = query.or(
        `created_at.lt.${cursorDate},and(created_at.eq.${cursorDate},id.lt.${cursorId})`
      );
    }

    const { data, error } = await query;
    if (error) throw error;

    const hasMore = data.length > pageSize;
    const products = hasMore ? data.slice(0, pageSize) : data;
    const nextCursor = hasMore
      ? `${products[products.length - 1].created_at}|${products[products.length - 1].id}`
      : null;

    // Get total count (cached by Supabase/PostgreSQL)
    const { count } = await supabase
      .from("products")
      .select("*", { count: "exact", head: true });

    res.json({ products, nextCursor, total: count });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
