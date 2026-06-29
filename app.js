const header = document.querySelector("[data-header]");
const nav = document.querySelector("[data-nav]");
const navToggle = document.querySelector("[data-nav-toggle]");
const megaShell = document.querySelector("[data-mega-shell]");
const menuTriggers = document.querySelectorAll("[data-menu-trigger]");
let menuPanels = document.querySelectorAll("[data-menu-panel]");
const navHighlight = document.querySelector("[data-nav-highlight]");
let menuCloseTimer;
let menuCloseAnimationTimer;

function hydrateMegaMenus() {
  if (!megaShell) return;
  megaShell.innerHTML = `
    <section class="mega-menu" id="menu-program" data-menu-panel="program" aria-label="Program menu">
      <a class="mega-row mega-row-feature" href="program.html">
        <img src="assets/generated/assessment-stilllife.png" alt="" />
        <span><strong>Diabetes Management</strong><small>Assessment, meal planning, glucose education, and follow-up support.</small></span>
      </a>
      <a class="mega-row" href="program.html#meal-planning">
        <img src="assets/generated/meal-planning-colorful.png" alt="" />
        <span><strong>Meal Planning</strong><small>Build meals around culture, schedule, and blood sugar goals.</small></span>
      </a>
      <a class="mega-row" href="program.html#carb-management">
        <img src="assets/generated/carb-education-foods.png" alt="" />
        <span><strong>Carb Management</strong><small>Learn portions, pairings, and post-meal patterns.</small></span>
      </a>
      <p class="mega-section-label">Featured care</p>
      <a class="mega-article" href="program.html#monitoring"><strong>Blood sugar monitoring</strong><small>Understand readings and food responses</small></a>
      <a class="mega-article" href="program.html#heart-health"><strong>Heart health support</strong><small>Nutrition for long-term risk reduction</small></a>
      <a class="mega-all-link" href="program.html">View all program areas <span>-></span></a>
    </section>
    <section class="mega-menu" id="menu-support" data-menu-panel="support" aria-label="Recipes menu">
      <a class="mega-row mega-row-feature" href="recipe-detail.html?slug=dijon-salmon-spinach">
        <img src="assets/recipe-covers/dijon-salmon-spinach.webp" alt="" />
        <span><strong>Dijon Salmon with Spinach</strong><small>15 min prep / heart-healthy dinner</small></span>
      </a>
      <a class="mega-row" href="recipe-detail.html?slug=cottage-cheese-blueberries-hemp-seeds">
        <img src="assets/recipe-covers/cottage-cheese-blueberries.webp" alt="" />
        <span><strong>Cottage Cheese with Blueberries</strong><small>High-protein breakfast or snack</small></span>
      </a>
      <a class="mega-row" href="recipe-detail.html?slug=turkey-meatball-wonton-soup-bok-choy-carrots">
        <img src="assets/recipe-covers/turkey-meatball-wonton-soup.webp" alt="" />
        <span><strong>Turkey Meatball Wonton Soup</strong><small>Brothy dinner with bok choy</small></span>
      </a>
      <p class="mega-section-label">More recipes</p>
      <a class="mega-article" href="recipe-detail.html?slug=chicken-salad-collard-wraps"><strong>Chicken salad collard wraps</strong><small>Low-carb lunch</small></a>
      <a class="mega-article" href="recipe-detail.html?slug=low-carb-easy-tiramisu"><strong>Low-carb easy tiramisu</strong><small>Planned dessert</small></a>
      <a class="mega-article" href="recipe-detail.html?slug=mediterranean-zucchini"><strong>Mediterranean zucchini</strong><small>Vegetable side</small></a>
      <a class="mega-all-link" href="recipes.html">Browse all recipes <span>-></span></a>
    </section>
    <section class="mega-menu" id="menu-learn" data-menu-panel="learn" aria-label="Research menu">
      <a class="mega-row mega-row-feature" href="research.html">
        <img src="assets/generated/behavior-education-cards.png" alt="" />
        <span><strong>Research Explained</strong><small>Public diabetes studies translated into plain language.</small></span>
      </a>
      <a class="mega-row" href="research.html">
        <img src="assets/generated/diabetes-symptoms-awareness.png" alt="" />
        <span><strong>Diabetes Basics</strong><small>A1C, glucose patterns, symptoms, and daily care.</small></span>
      </a>
      <a class="mega-row" href="research.html">
        <img src="assets/generated/glucose-device-modern.png" alt="" />
        <span><strong>Blood Sugar & A1C</strong><small>What studies suggest for food, movement, and monitoring.</small></span>
      </a>
      <p class="mega-section-label">Featured research</p>
      <a class="mega-article" href="research-detail.html?slug=walking-after-meals"><strong>Walking after meals</strong><small>What it can mean for glucose</small></a>
      <a class="mega-article" href="research-detail.html?slug=high-fiber-foods-a1c"><strong>High-fiber foods and A1C</strong><small>Plain-English takeaway</small></a>
      <a class="mega-all-link" href="research.html">View research library <span>-></span></a>
    </section>
  `;
  menuPanels = document.querySelectorAll("[data-menu-panel]");
}

function hydrateMobileMenu() {
  if (!nav) return;
  nav.innerHTML = `
    <div class="mobile-section">
      <p>Program</p>
      <a href="program.html">Assessment</a>
      <a href="program.html#meal-planning">Meal planning</a>
      <a href="program.html#carb-management">Carb management</a>
      <a href="program.html#monitoring">Blood sugar monitoring</a>
    </div>
    <div class="mobile-section">
      <p>Recipes</p>
      <a href="recipes.html">All recipes</a>
      <a href="recipe-detail.html?slug=dijon-salmon-spinach">Dijon salmon</a>
      <a href="recipe-detail.html?slug=cottage-cheese-blueberries-hemp-seeds">Cottage cheese berries</a>
      <a href="recipe-detail.html?slug=turkey-meatball-wonton-soup-bok-choy-carrots">Turkey meatball soup</a>
    </div>
    <div class="mobile-section">
      <p>Research</p>
      <a href="research.html">Research library</a>
      <a href="research-detail.html?slug=walking-after-meals">Walking after meals</a>
      <a href="research-detail.html?slug=high-fiber-foods-a1c">High-fiber foods</a>
    </div>
    <a class="mobile-cta" href="book.html">Book Now</a>
  `;
}

hydrateMegaMenus();
hydrateMobileMenu();

function updateHeader() {
  if (!header) return;
  header.classList.toggle("is-scrolled", window.scrollY > 12);
}

function hideNavHighlight() {
  if (navHighlight) navHighlight.style.opacity = "0";
}

function moveNavHighlight(target) {
  if (!navHighlight || !target.parentElement) return;
  const navRect = target.parentElement.getBoundingClientRect();
  const targetRect = target.getBoundingClientRect();
  navHighlight.style.width = `${targetRect.width}px`;
  navHighlight.style.transform = `translateX(${targetRect.left - navRect.left}px)`;
  navHighlight.style.opacity = "1";
}

function closeMegaMenu() {
  window.clearTimeout(menuCloseTimer);
  window.clearTimeout(menuCloseAnimationTimer);
  if (!header || !megaShell) return;
  header.classList.remove("has-open-menu");
  if (megaShell.classList.contains("is-open")) {
    megaShell.classList.remove("is-open");
    megaShell.classList.add("is-closing");
    menuCloseAnimationTimer = window.setTimeout(() => {
      megaShell.classList.remove("is-closing");
    }, 180);
  }
  menuTriggers.forEach((trigger) => {
    trigger.classList.remove("is-active");
    trigger.setAttribute("aria-expanded", "false");
  });
  menuPanels.forEach((panel) => panel.classList.remove("is-active"));
  hideNavHighlight();
}

function openMegaMenu(menuName) {
  if (!header || !megaShell) return;
  window.clearTimeout(menuCloseTimer);
  window.clearTimeout(menuCloseAnimationTimer);
  header.classList.add("has-open-menu");
  megaShell.classList.remove("is-closing");
  megaShell.classList.add("is-open");
  menuTriggers.forEach((trigger) => {
    const isActive = trigger.dataset.menuTrigger === menuName;
    trigger.classList.toggle("is-active", isActive);
    trigger.setAttribute("aria-expanded", String(isActive));
    if (isActive) moveNavHighlight(trigger);
  });
  menuPanels.forEach((panel) => {
    panel.classList.toggle("is-active", panel.dataset.menuPanel === menuName);
  });
}

function closeNav() {
  if (!nav || !navToggle) return;
  nav.classList.remove("is-open");
  document.body.classList.remove("nav-open");
  navToggle.setAttribute("aria-expanded", "false");
}

function scheduleMegaMenuClose() {
  window.clearTimeout(menuCloseTimer);
  menuCloseTimer = window.setTimeout(closeMegaMenu, 190);
}

if (header) {
  updateHeader();
  window.addEventListener("scroll", updateHeader, { passive: true });
  header.addEventListener("mouseleave", scheduleMegaMenuClose);
  header.addEventListener("mouseenter", () => window.clearTimeout(menuCloseTimer));
}

if (navToggle && nav) {
  navToggle.addEventListener("click", () => {
    const isOpen = nav.classList.toggle("is-open");
    document.body.classList.toggle("nav-open", isOpen);
    navToggle.setAttribute("aria-expanded", String(isOpen));
    closeMegaMenu();
  });

  nav.addEventListener("click", (event) => {
    if (event.target instanceof HTMLAnchorElement) closeNav();
  });
}

menuTriggers.forEach((trigger) => {
  trigger.addEventListener("mouseenter", () => {
    closeNav();
    moveNavHighlight(trigger);
    openMegaMenu(trigger.dataset.menuTrigger);
  });

  trigger.addEventListener("focus", () => {
    closeNav();
    moveNavHighlight(trigger);
    openMegaMenu(trigger.dataset.menuTrigger);
  });

  trigger.addEventListener("click", () => {
    if (trigger.classList.contains("is-active")) {
      closeMegaMenu();
      return;
    }
    closeNav();
    openMegaMenu(trigger.dataset.menuTrigger);
  });
});

if (megaShell) {
  megaShell.addEventListener("click", (event) => {
    if (event.target instanceof HTMLAnchorElement) closeMegaMenu();
  });
}

document.addEventListener("click", (event) => {
  if (header && !header.contains(event.target)) closeMegaMenu();
});

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") {
    closeMegaMenu();
    closeNav();
  }
});

const quizForm = document.querySelector(".quiz-form");
if (quizForm) {
  quizForm.addEventListener("submit", (event) => {
    event.preventDefault();
    const button = event.currentTarget.querySelector("button");
    button.textContent = "Recommendations sent";
    button.disabled = true;
  });
}

function getParam(name) {
  return new URLSearchParams(window.location.search).get(name);
}

function renderCards(container, items, type) {
  if (!container) return;
  container.innerHTML = items
    .map((item) => {
      const href =
        type === "recipe"
          ? `recipe-detail.html?slug=${item.slug}`
          : `research-detail.html?slug=${item.slug}`;
      const meta =
        type === "recipe"
          ? `${item.prepTime || item.prep} prep / serves ${item.servings}`
          : `${item.source} / ${item.year}`;
      const image = item.image || "assets/generated/behavior-education-cards.png";
      return `
        <article class="listing-card">
          <a href="${href}" class="listing-image">
            <img src="${image}" alt="" />
          </a>
          <div class="listing-card-body">
            <p class="tag">${item.category}</p>
            <h3><a href="${href}">${item.title}</a></h3>
            <p>${item.excerpt || item.summary}</p>
            <span>${meta}</span>
          </div>
        </article>
      `;
    })
    .join("");
}

function initFilterPage(listId, data, type) {
  const list = document.getElementById(listId);
  if (!list || !Array.isArray(data)) return;
  const filters = document.querySelectorAll("[data-filter]");

  function applyFilter(value) {
    const items = value === "All" ? data : data.filter((item) => item.category === value || item.tags?.includes(value));
    filters.forEach((filter) => filter.classList.toggle("is-active", filter.dataset.filter === value));
    renderCards(list, items, type);
  }

  filters.forEach((filter) => {
    filter.addEventListener("click", () => applyFilter(filter.dataset.filter));
  });

  applyFilter("All");
}

function renderRecipeDetail() {
  const target = document.getElementById("recipe-detail");
  const recipes = window.diabetesRecipes || [];
  if (!target || recipes.length === 0) return;
  const aliasMap = {
    "cottage-cheese-blueberries": "cottage-cheese-blueberries-hemp-seeds",
    "low-carb-tiramisu": "low-carb-easy-tiramisu",
    "turkey-meatball-wonton-soup": "turkey-meatball-wonton-soup-bok-choy-carrots"
  };
  const requestedSlug = getParam("slug");
  const normalizedSlug = aliasMap[requestedSlug] || requestedSlug;
  const recipe = recipes.find((item) => item.slug === normalizedSlug) || recipes[0];
  target.innerHTML = `
    <section class="recipe-detail-hero">
      <div class="recipe-detail-copy">
        <p class="eyebrow">${recipe.category} / ${recipe.date || "NutriAll recipe"}</p>
        <h1>${recipe.title}</h1>
        <p>${recipe.excerpt}</p>
        <div class="detail-meta">
          <span>${recipe.prepTime || recipe.prep} prep</span>
          <span>${recipe.cookTime || recipe.cook} cook</span>
          <span>Serves ${recipe.servings}</span>
        </div>
      </div>
      <div class="recipe-detail-image">
        <img src="${recipe.image}" alt="" />
      </div>
    </section>
    <section class="recipe-body-band">
      <div class="recipe-body-intro">
        <p class="eyebrow">Cook from the card</p>
        <h2>Original NutriAll recipe, rebuilt for clearer reading.</h2>
        <p>The full ingredient list, steps, nutrition notes, and diabetes-care context are kept together so the page feels like a proper recipe, not a scattered set of notes.</p>
      </div>
    </section>
    <section class="recipe-content-grid">
      <aside class="ingredients-panel">
        <p class="eyebrow">Ingredients</p>
        <h2>What you need</h2>
        <ul>${recipe.ingredients.map((item) => `<li>${item}</li>`).join("")}</ul>
      </aside>
      <article class="instructions-panel">
        <p class="eyebrow">Instructions</p>
        <h2>How to make it</h2>
        <ol>${recipe.instructions.map((item, index) => `<li><span>${index + 1}</span><p>${item}</p></li>`).join("")}</ol>
      </article>
    </section>
    <section class="recipe-support-grid">
      <article>
        <p class="eyebrow">Diabetes note</p>
        <h2>How this recipe fits</h2>
        <p>${recipe.diabetesNote}</p>
        <p>${recipe.carbAwareness}</p>
      </article>
      <article>
        <p class="eyebrow">Per serving</p>
        <h2>Nutrition</h2>
        <div class="nutrition-pills">${recipe.nutrition.map((item) => `<span>${item}</span>`).join("")}</div>
      </article>
    </section>
    <section class="original-card-section">
      <div>
        <p class="eyebrow">Original recipe card</p>
        <h2>Migrated from NutriAll's original recipe library.</h2>
        <p>The structured recipe above follows the original NutriAll card, with extra diabetes-care context added for this standalone site.</p>
        <a class="button button-primary" href="recipes.html">Back to all recipes</a>
      </div>
      <img src="${recipe.originalCard}" alt="${recipe.title} original recipe card" />
    </section>
  `;
}

function renderResearchDetail() {
  const target = document.getElementById("research-detail");
  const research = window.diabetesResearch || [];
  if (!target || research.length === 0) return;
  const article = research.find((item) => item.slug === getParam("slug")) || research[0];
  target.innerHTML = `
    <section class="page-full-hero research-full-hero research-detail-full-hero">
      <div>
        <p class="eyebrow">${article.category} / ${article.source} / ${article.year}</p>
        <h1>${article.title}</h1>
        <p>${article.summary}</p>
      </div>
    </section>
    <section class="detail-grid research-detail-grid">
      <article>
        <p class="eyebrow">Plain-English takeaway</p>
        <h2>What it means in real life</h2>
        <p>${article.takeaway}</p>
      </article>
      <aside>
        <h3>Key points</h3>
        <ul>${article.findings.map((item) => `<li>${item}</li>`).join("")}</ul>
      </aside>
    </section>
  `;
}

function initBooking() {
  const booking = document.querySelector("[data-booking]");
  if (!booking) return;
  const steps = Array.from(booking.querySelectorAll("[data-step]"));
  const activeFlowSteps = steps.filter((step) => !step.hasAttribute("data-booking-complete"));
  const progress = booking.querySelector("[data-booking-progress]");
  let currentStep = 0;

  function showStep(index) {
    currentStep = Math.max(0, Math.min(index, steps.length - 1));
    steps.forEach((step, stepIndex) => step.classList.toggle("is-active", stepIndex === currentStep));
    if (progress) {
      const progressStep = Math.min(currentStep + 1, activeFlowSteps.length);
      progress.style.width = `${(progressStep / activeFlowSteps.length) * 100}%`;
    }
  }

  booking.querySelectorAll("[data-next]").forEach((button) => {
    button.addEventListener("click", () => showStep(currentStep + 1));
  });

  booking.querySelectorAll("[data-prev]").forEach((button) => {
    button.addEventListener("click", () => showStep(currentStep - 1));
  });

  booking.querySelectorAll(".option-card").forEach((button) => {
    button.addEventListener("click", () => {
      const group = button.closest(".booking-options");
      group?.querySelectorAll(".option-card").forEach((option) => option.classList.remove("is-selected"));
      button.classList.add("is-selected");
    });
  });

  booking.addEventListener("submit", (event) => {
    event.preventDefault();
    showStep(steps.length - 1);
  });

  showStep(0);
}

initFilterPage("recipes-list", window.diabetesRecipes, "recipe");
initFilterPage("research-list", window.diabetesResearch, "research");
renderRecipeDetail();
renderResearchDetail();
initBooking();
