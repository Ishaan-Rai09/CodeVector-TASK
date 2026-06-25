const API = "/api";
const PAGE_SIZE = 20;
let cursorStack = [];
let currentCursor = null;
let currentCategory = "";
let nextCursor = null;
let pageNumber = 1;

async function fetchProducts(category, cursor) {
  const params = new URLSearchParams({ limit: PAGE_SIZE });
  if (category) params.set("category", category);
  if (cursor) params.set("cursor", cursor);
  const res = await fetch(`${API}?${params}`);
  if (!res.ok) throw new Error(`API error: ${res.status}`);
  return res.json();
}

function renderProducts(products) {
  document.getElementById("products").innerHTML = products.map(p => `
    <div class="product-card">
      <div class="product-header">
        <div class="product-name">${p.name}</div>
        <div class="product-price">$${Number(p.price).toFixed(2)}</div>
      </div>
      <div class="product-category">${p.category}</div>
      <div class="product-meta">
        <span class="product-id">#${p.id}</span>
        <span>${new Date(p.created_at).toLocaleDateString()}</span>
      </div>
    </div>
  `).join("");
}

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
    document.getElementById("pageInfo").textContent = `Page ${pageNumber}`;
  } catch (err) {
    document.getElementById("products").innerHTML = `<p style="text-align:center;color:#ef4444;padding:48px">Error: ${err.message}</p>`;
  } finally {
    loading.classList.add("hidden");
  }
}

document.getElementById("category").addEventListener("change", e => {
  currentCategory = e.target.value;
  cursorStack = [];
  currentCursor = null;
  pageNumber = 1;
  loadPage();
});

document.getElementById("next").addEventListener("click", () => {
  if (nextCursor) {
    cursorStack.push(currentCursor);
    currentCursor = nextCursor;
    pageNumber++;
    loadPage(currentCursor);
  }
});

document.getElementById("prev").addEventListener("click", () => {
  if (cursorStack.length > 0) {
    currentCursor = cursorStack.pop();
    pageNumber--;
    loadPage(currentCursor);
  }
});

// Init
const categories = [
  "Electronics", "Clothing", "Home & Garden", "Sports", "Books",
  "Toys", "Automotive", "Health", "Food", "Office"
];
const select = document.getElementById("category");
categories.forEach(cat => {
  const opt = document.createElement("option");
  opt.value = cat;
  opt.textContent = cat;
  select.appendChild(opt);
});

loadPage();
