// seed.js - Generate 200,000 products in Supabase
// Run: node seed.js (after setting env vars)

require("dotenv").config();
const { createClient } = require("@supabase/supabase-js");

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

const CATEGORIES = [
  "Electronics", "Clothing", "Home & Garden", "Sports", "Books",
  "Toys", "Automotive", "Health", "Food", "Office"
];

const BATCH_SIZE = 1000; // Supabase max per insert
const TOTAL = 200_000;

function randomItem(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randomPrice() {
  return +(Math.random() * 999 + 1).toFixed(2);
}

function makeBatch(startId, batchSize) {
  const now = new Date();
  const rows = [];
  for (let i = 0; i < batchSize; i++) {
    const id = startId + i;
    // Spread created_at over past 365 days for realistic data
    const daysAgo = Math.floor(Math.random() * 365);
    const createdAt = new Date(now - daysAgo * 86400000);
    rows.push({
      id,
      name: `Product ${id}`,
      category: randomItem(CATEGORIES),
      price: randomPrice(),
      created_at: createdAt.toISOString(),
      updated_at: createdAt.toISOString(),
    });
  }
  return rows;
}

async function seed() {
  console.log(`Seeding ${TOTAL} products...`);
  const startTime = Date.now();

  for (let start = 1; start <= TOTAL; start += BATCH_SIZE) {
    const batch = makeBatch(start, Math.min(BATCH_SIZE, TOTAL - start + 1));
    const { error } = await supabase.from("products").insert(batch);
    if (error) {
      console.error("Insert error at id", start, error.message);
      process.exit(1);
    }
    if (start % 10000 === 1) {
      console.log(`  Progress: ${start - 1}/${TOTAL}`);
    }
  }

  const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
  console.log(`Done! Seeded ${TOTAL} products in ${elapsed}s`);
}

seed();
