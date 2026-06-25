// script.js - Frontend logic for products browser

const API_BASE = "/api";
const PAGE_SIZE = 20;

let cursorStack = []; // stack of cursors for "Previous" navigation
let currentCursor = null;
let currentCategory = "";
let nextCursor = null;

// Fetch products from API
async function fetchProducts(category, cursor) {
  const params = new URLSearchParams({ limit: PAGE_SIZE });
  if (category) params.set("category", category);
  if (cursor) params.set("cursor", cursor);

  const res = await fetch(`${API_BASE}?${params}`);
  if (!res.ok) throw new Error(`API error: ${res.status}`);
  return res.json();
}

// Render products to the page
function renderProducts(products) {
  const grid = document.getElementById("products");
  grid.innerHTML = products
    .map(
      (p) => `
    <div class="product-card">
      <div class="name">${p.name}</div>
      <div class="category">${p.category}</div>
      <div class="price">$${Number(p.price).toFixed(2)}</div>
      <div class="date">Created: ${new Date(p.created_at).toLocaleDateString()}</div>
    </div>`
    )
    .join("");
}

// Load a page of products
async function loadPage(cursor = null) {
  const loading = document.getElementById("loading");
  loading.classList.remove("hidden");

  try {
    const data = await fetchProducts(currentCategory, cursor);
    renderProducts(data.products);
    nextCursor = data.nextCursor;
    document.getElementById("total").textContent = `${data.total.toLocaleString()} products`;
    document.getElementById("prev").disabled = cursorStack.length === 0;
    document.getElementById("next").disabled = !data.nextCursor;
  } catch (err) {
    document.getElementById("products").innerHTML = `<p>Error: ${err.message}</p>`;
  } finally {
    loading.classList.add("hidden");
  }
}

// Load categories into dropdown
async function loadCategories() {
  try {
    const res = await fetch(`${API_BASE}?limit=0`);
    // Categories are hardcoded from seed - fetch one page to get categories
    const categories = [
      "Electronics", "Clothing", "Home & Garden", "Sports", "Books",
      "Toys", "Automotive", "Health", "Food", "Office"
    ];
    const select = document.getElementById("category");
    categories.forEach((cat) => {
      const opt = document.createElement("option");
      opt.value = cat;
      opt.textContent = cat;
      select.appendChild(opt);
    });
  } catch (err) {
    console.error("Failed to load categories:", err);
  }
}

// Event listeners
document.getElementById("category").addEventListener("change", (e) => {
  currentCategory = e.target.value;
  cursorStack = [];
  currentCursor = null;
  loadPage();
});

document.getElementById("next").addEventListener("click", () => {
  if (nextCursor) {
    cursorStack.push(currentCursor);
    currentCursor = nextCursor;
    loadPage(currentCursor);
  }
});

document.getElementById("prev").addEventListener("click", () => {
  if (cursorStack.length > 0) {
    currentCursor = cursorStack.pop();
    loadPage(currentCursor);
  }
});

// Initial load
loadCategories();
loadPage();
