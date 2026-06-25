const { createClient } = require("@supabase/supabase-js");

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

module.exports = async (req, res) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") {
    res.writeHead(200);
    return res.end();
  }

  try {
    const url = new URL(req.url, `http://${req.headers.host}`);
    const category = url.searchParams.get("category");
    const cursor = url.searchParams.get("cursor");
    const limit = parseInt(url.searchParams.get("limit")) || 20;
    const pageSize = Math.min(Math.max(limit, 1), 100);

    let query = supabase
      .from("products")
      .select("id, name, category, price, created_at")
      .order("created_at", { ascending: false })
      .order("id", { ascending: false })
      .limit(pageSize + 1);

    if (category) {
      query = query.eq("category", category);
    }

    if (cursor) {
      const [cursorDate, cursorId] = cursor.split("|");
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

    const { count } = await supabase
      .from("products")
      .select("*", { count: "exact", head: true });

    const body = JSON.stringify({ products, nextCursor, total: count });
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(body);
  } catch (err) {
    const body = JSON.stringify({ error: err.message });
    res.writeHead(500, { "Content-Type": "application/json" });
    res.end(body);
  }
};
