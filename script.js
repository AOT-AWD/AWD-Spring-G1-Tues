const API_KEY = "fe6f2d8414114bc693fb79d3478ffbc2";
//api key 2: ee48f1e7ffa34acda941d7f71681ae34
//api key 1 :fe6f2d8414114bc693fb79d3478ffbc2 


//if api key doesnt work that means over daily limit, copy and paste the other key into API_KEY = "here";


let ingredients = [];
let cart = JSON.parse(localStorage.getItem("jennas-cart")) || [];
const recipeCache = {}; // stores recipe data so cart can reference it
// ─── Ingredient Input ────────────────────────────────────────

function addIngredient() {
  const input = document.getElementById("ingredient-input");
  const value = input.value.trim().toLowerCase();

  // Don't add if empty or already in the list
  if (!value || ingredients.includes(value)) {
    input.value = "";
    return;
  }

  ingredients.push(value);
  input.value = "";
  renderTags();
}

function handleEnter(e) {
  if (e.key === "Enter") addIngredient();
}

function removeIngredient(index) {
  ingredients.splice(index, 1);
  renderTags();
}

// Display each ingredient as a tag with an X button
function renderTags() {
  const container = document.getElementById("ingredient-tags");
  container.innerHTML = "";

  ingredients.forEach((ingredient, index) => {
    const tag = document.createElement("span");
    tag.className = "ingredient-tag";
    tag.innerHTML = `
      ${ingredient}
      <span onclick="removeIngredient(${index})" style="cursor:pointer; margin-left:6px; font-weight:bold;">×</span>
    `;
    container.appendChild(tag);
  });
}

// ─── Filters ─────────────────────────────────────────────────

function updateTimeLabel() {
  const value = document.getElementById("filter-time").value;
  document.getElementById("time-label").textContent = value == 120 ? "Any" : `${value} min`;
}

function getIntolerances() {
  const checked = [...document.querySelectorAll(".intolerance-cb:checked")];
  return checked.map(cb => cb.value).join(",");
}

// ─── Recipe Search ────────────────────────────────────────────

async function searchRecipes() {
  const statusDiv = document.getElementById("search-status");
  const resultsDiv = document.getElementById("api-results");

  // Make sure at least one ingredient was added
  if (ingredients.length === 0) {
    statusDiv.innerHTML = `<div class="alert alert-warning">Add at least one ingredient first!</div>`;
    return;
  }

  statusDiv.innerHTML = `<div class="alert alert-info">🔍 Searching for recipes…</div>`;
  resultsDiv.innerHTML = "";

  // Grab all filter values
  const diet      = document.getElementById("filter-diet").value;
  const cuisine   = document.getElementById("filter-cuisine").value;
  const type      = document.getElementById("filter-type").value;
  const timeValue = document.getElementById("filter-time").value;
  const maxTime   = timeValue == 120 ? "" : timeValue;
  const maxCals   = document.getElementById("filter-calories").value;
  const intoler   = getIntolerances();

  // Build the URL params
  const params = new URLSearchParams({
    includeIngredients: ingredients.join(","),
    sort: "max-used-ingredients",
    number: 8,
    addRecipeInformation: true,
    fillIngredients: true,
    ignorePantry: true,
    apiKey: API_KEY,
  });

  if (diet)     params.set("diet", diet);
  if (cuisine)  params.set("cuisine", cuisine);
  if (type)     params.set("type", type);
  if (intoler)  params.set("intolerances", intoler);
  if (maxTime)  params.set("maxReadyTime", maxTime);
  if (maxCals)  params.set("maxCalories", maxCals);

  const response = await fetch(`https://api.spoonacular.com/recipes/complexSearch?${params}`);
  const data = await response.json();
  const recipes = data.results || [];

  statusDiv.innerHTML = "";

  if (recipes.length === 0) {
    resultsDiv.innerHTML = `
      <div class="col-12 text-center">
        <p style="font-size:1.2rem; color:#7A5C3A;">
          No recipes found. Try fewer filters or different ingredients!
        </p>
      </div>`;
    return;
  }

  // Show results heading
  resultsDiv.innerHTML = `
    <div class="col-12 text-center mb-3">
      <h2 class="section-title">Recipes Found</h2>
      <hr class="section-divider">
    </div>`;

  recipes.forEach(recipe => {
    const col = document.createElement("div");
    col.className = "col-md-3 col-sm-6";
    col.innerHTML = buildRecipeCard(recipe);
    resultsDiv.appendChild(col);
  });
}

// Build the HTML for one recipe card
function buildRecipeCard(recipe, showRemove = false) {
  const time     = recipe.readyInMinutes ? `⏱ ${recipe.readyInMinutes} min` : "";
  const servings = recipe.servings       ? `👤 Serves ${recipe.servings}`   : "";
  const stats    = [time, servings].filter(Boolean).join(" &nbsp;·&nbsp; ");

  const title = recipe.title.toLowerCase().replace(/\s+/g, '-');
  const url   = recipe.url || `https://spoonacular.com/recipes/${title}-${recipe.id}`;

  const badges = [];
  if (recipe.vegetarian) badges.push(`<span class="badge rounded-pill" style="background:#4A6741;">Vegetarian</span>`);
  if (recipe.vegan)      badges.push(`<span class="badge rounded-pill" style="background:#4A6741;">Vegan</span>`);
  if (recipe.glutenFree) badges.push(`<span class="badge rounded-pill" style="background:#8B4513;">GF</span>`);
  if (recipe.dairyFree)  badges.push(`<span class="badge rounded-pill" style="background:#8B4513;">DF</span>`);

  // Cache the recipe so the cart can reference it later
  recipeCache[recipe.id] = {
    id: recipe.id,
    title: recipe.title,
    image: recipe.image || 'https://via.placeholder.com/400x300?text=No+Image',
    url,
    ingredients: (recipe.extendedIngredients || []).map(i => i.name)
  };

  const alreadyInCart = cart.find(item => item.id === recipe.id);

  return `
    <div class="recipe-card">
      <img src="${recipe.image || 'https://via.placeholder.com/400x300?text=No+Image'}" alt="${recipe.title}" loading="lazy">
      <div class="card-body">
        <h5 class="card-title">${recipe.title}</h5>
        ${badges.length ? `<div class="d-flex flex-wrap gap-1 mb-2">${badges.join("")}</div>` : ""}
        <p class="card-text">${stats}</p>
        <a href="${url}" target="_blank" class="btn btn-primary btn-sm mt-1">View Recipe</a>
        ${!showRemove && !alreadyInCart ? `<button onclick="addToCart(${recipe.id})" class="btn btn-success btn-sm mt-1">🛒 Save</button>` : ""}
        ${showRemove ? `<button onclick="removeFromCart(${recipe.id})" class="btn btn-danger btn-sm mt-1">Remove</button>` : ""}
      </div>
    </div>`;
}

// ─── Reset ────────────────────────────────────────────────────

function resetAll() {
  // Clear ingredients
  ingredients = [];
  renderTags();
  document.getElementById("ingredient-input").value = "";

  // Reset all filters
  document.getElementById("filter-diet").value     = "";
  document.getElementById("filter-cuisine").value  = "";
  document.getElementById("filter-type").value     = "";
  document.getElementById("filter-calories").value = "";
  document.getElementById("filter-time").value     = 120;
  updateTimeLabel();
  document.querySelectorAll(".intolerance-cb").forEach(cb => cb.checked = false);

  // Clear results
  document.getElementById("api-results").innerHTML  = "";
  document.getElementById("search-status").innerHTML = "";
}

// ─── About Page Favorites ─────────────────────────────────────

async function loadFavorites() {
  const row = document.getElementById("favorites-row");
  if (!row) return;

  const response = await fetch(
  `https://api.spoonacular.com/recipes/random?number=3&fillIngredients=true&apiKey=${API_KEY}`
);
  const data = await response.json();

  row.innerHTML = "";

  data.recipes.forEach(recipe => {
    const title = recipe.title.toLowerCase().replace(/\s+/g, '-');
    const url   = `https://spoonacular.com/recipes/${title}-${recipe.id}`;

    // Cache so the cart can use it
    recipeCache[recipe.id] = {
      id: recipe.id,
      title: recipe.title,
      image: recipe.image,
      url,
      ingredients: (recipe.extendedIngredients || []).map(i => i.name)
    };

    const col = document.createElement("div");
    col.className = "col-sm-4";
    col.innerHTML = `
      <div class="fav-card">
        <img src="${recipe.image}" alt="${recipe.title}">
        <div class="fav-card-overlay">
          <div class="overlay-title">${recipe.title}</div>
          <a href="${url}" target="_blank">View Recipe</a>
        </div>
        <div class="fav-card-body">
          <h5>${recipe.title}</h5>
          <p>⏱ ${recipe.readyInMinutes} min &nbsp;·&nbsp; 🍽 ${recipe.servings} servings</p>
          <button onclick="addToCart(${recipe.id})" class="btn btn-success btn-sm mt-2">🛒 Save</button>
        </div>
      </div>`;

    row.appendChild(col);
  });
}

loadFavorites();


// ─── Newsletter ───────────────────────────────────────────────

function handleNewsletter(event) {
  event.preventDefault(); // stops the page from refreshing

  const msg = event.target.querySelector("#newsletter-msg");
  const input = event.target.querySelector("input");

  msg.style.color = "#4A6741";
  msg.textContent = `✅ Thanks for subscribing, ${input.value}!`;

  input.value = ""; // clear the field
}

// ─── Cart ─────────────────────────────────────────────────────

function addToCart(id) {
  const recipe = recipeCache[id];
  if (!recipe) return;

  // Don't add duplicates
  if (cart.find(item => item.id === id)) {
    alert(`"${recipe.title}" is already saved!`);
    return;
  }

  cart.push(recipe);
  localStorage.setItem("jennas-cart", JSON.stringify(cart));
  updateCartCount();
  alert(`✅ "${recipe.title}" saved to cart!`);
}

function removeFromCart(id) {
  cart = cart.filter(item => item.id !== id);
  localStorage.setItem("jennas-cart", JSON.stringify(cart));
  updateCartCount();
  renderCart();
}

function clearCart() {
  cart = [];
  localStorage.setItem("jennas-cart", JSON.stringify(cart));
  updateCartCount();
  renderCart();
}

// Update the cart badge number in the navbar
function updateCartCount() {
  const badge = document.getElementById("cart-count");
  if (badge) badge.textContent = cart.length;
}

// Render the cart page content
function renderCart() {
  const recipesDiv = document.getElementById("cart-recipes");
  const listDiv    = document.getElementById("cart-shopping-list");
  if (!recipesDiv) return;

  // Empty state
  if (cart.length === 0) {
    recipesDiv.innerHTML = `
      <div class="col-12 text-center py-5">
        <p style="font-size:1.2rem; color:#7A5C3A;">
          Your cart is empty. <a href="recipes.html">Find some recipes →</a>
        </p>
      </div>`;
    listDiv.innerHTML = "";
    return;
  }

  // Render saved recipe cards
  recipesDiv.innerHTML = "";
  cart.forEach(item => {
    const col = document.createElement("div");
    col.className = "col-md-4 mb-4";
    col.innerHTML = buildRecipeCard(item, true) + 
  `<button onclick="removeFromCart(${item.id})" class="btn btn-danger btn-sm mt-1 ms-1">Remove</button>`;
    recipesDiv.appendChild(col);
  });

  // Build combined shopping list from all saved recipes
  const allIngredients = cart.flatMap(item => item.ingredients || []);
  const unique = [...new Set(allIngredients)]; // remove duplicates

  listDiv.innerHTML = unique.length > 0
    ? `<ul class="list-group">
        ${unique.map(ing => `<li class="list-group-item">🛒 ${ing}</li>`).join("")}
       </ul>`
    : `<p style="color:#7A5C3A;">No ingredients found for these recipes.</p>`;
}

// Run on every page load
updateCartCount();
renderCart();
