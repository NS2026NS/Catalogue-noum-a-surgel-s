(function () {
  "use strict";

  // ---------- Build 3-level hierarchy from flat PRODUCTS ----------
  const TREE = {};
  PRODUCTS.forEach((p) => {
    TREE[p.univers] = TREE[p.univers] || { count: 0, sfs: {} };
    TREE[p.univers].count++;
    const sfNode = (TREE[p.univers].sfs[p.sf] = TREE[p.univers].sfs[p.sf] || { count: 0, sf2s: {} });
    sfNode.count++;
    if (p.sf2) {
      sfNode.sf2s[p.sf2] = (sfNode.sf2s[p.sf2] || 0) + 1;
    }
  });
  const UNIVERS_LIST = Object.keys(TREE).sort((a, b) => a.localeCompare(b, "fr"));

  function sfKeysFor(univ) {
    return Object.keys(TREE[univ].sfs).sort((a, b) => a.localeCompare(b, "fr"));
  }
  function sf2KeysFor(univ, sf) {
    return Object.keys(TREE[univ].sfs[sf].sf2s).sort((a, b) => a.localeCompare(b, "fr"));
  }

  // ---------- State ----------
  const PAGE_SIZE = 30;
  const state = {
    univers: null,
    sf: null,
    sf2: null,
    query: "",
    sort: "name-asc",
    visibleCount: PAGE_SIZE,
    showProductsNow: false, // set by the "voir tous les produits" shortcut
  };

  // ---------- DOM refs ----------
  const $tree = document.getElementById("tree");
  const $grid = document.getElementById("grid");
  const $breadcrumb = document.getElementById("breadcrumb");
  const $sectionTitle = document.getElementById("sectionTitle");
  const $resultCount = document.getElementById("resultCount");
  const $emptyState = document.getElementById("emptyState");
  const $searchInput = document.getElementById("searchInput");
  const $searchClear = document.getElementById("searchClear");
  const $sortSelect = document.getElementById("sortSelect");
  const $sortWrap = document.getElementById("sortWrap");
  const $sidebar = document.getElementById("sidebar");
  const $drawerToggle = document.getElementById("drawerToggle");
  const $drawerOverlay = document.getElementById("drawerOverlay");
  const $resetFilters = document.getElementById("resetFilters");
  const $emptyReset = document.getElementById("emptyReset");

  const $lightbox = document.getElementById("lightbox");
  const $lightboxClose = document.getElementById("lightboxClose");
  const $lightboxImage = document.getElementById("lightboxImage");
  const $lightboxName = document.getElementById("lightboxName");
  const $lightboxPrice = document.getElementById("lightboxPrice");
  const $lightboxRef = document.getElementById("lightboxRef");
  const $lightboxUnivers = document.getElementById("lightboxUnivers");
  const $lightboxSf = document.getElementById("lightboxSf");
  const $lightboxCond = document.getElementById("lightboxCond");
  const $lightboxTgc = document.getElementById("lightboxTgc");
  const $lightboxAsk = document.getElementById("lightboxAsk");

  const $tabHome = document.getElementById("tabHome");
  const $tabCatalogue = document.getElementById("tabCatalogue");
  const $tabAbout = document.getElementById("tabAbout");
  const $tabContact = document.getElementById("tabContact");
  const $homeView = document.getElementById("homeView");
  const $catalogueView = document.getElementById("catalogueView");
  const $aboutView = document.getElementById("aboutView");
  const $contactView = document.getElementById("contactView");
  const $searchBox = document.querySelector(".search");
  const $layout = document.getElementById("layout");
  const $heroCatalogueBtn = document.getElementById("heroCatalogueBtn");
  const $heroContactBtn = document.getElementById("heroContactBtn");
  const $heroStats = document.getElementById("heroStats");
  const $contactForm = document.getElementById("contactForm");
  const $contactCopy = document.getElementById("contactCopy");
  const $contactNote = document.getElementById("contactNote");
  const $cName = document.getElementById("cName");
  const $cPhone = document.getElementById("cPhone");
  const $cCompany = document.getElementById("cCompany");
  const $cRef = document.getElementById("cRef");
  const $cMessage = document.getElementById("cMessage");

  let activeTab = "home";

  // ---------- Helpers ----------
  function formatPrice(cents) {
    if (cents === null || cents === undefined) return null;
    const euros = cents / 100;
    return euros.toLocaleString("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + " €";
  }

  function placeholderSVG() {
    return `<div class="card__placeholder">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.4">
        <path d="M3 7l9-4 9 4-9 4-9-4z"></path>
        <path d="M3 7v10l9 4 9-4V7"></path>
        <path d="M12 11v10"></path>
      </svg>
      <span>PHOTO À VENIR</span>
    </div>`;
  }

  function clearTransientNodes() {
    document.querySelectorAll(".home-intro, .back-btn").forEach((el) => el.remove());
    const more = document.querySelector(".load-more");
    if (more) more.remove();
  }

  // ---------- Sidebar tree (unchanged: direct jump to products) ----------
  function buildTree() {
    $tree.innerHTML = "";
    UNIVERS_LIST.forEach((univ) => {
      const data = TREE[univ];
      const wrap = document.createElement("div");
      wrap.className = "tree-univers";
      wrap.dataset.univers = univ;

      const btn = document.createElement("button");
      btn.innerHTML = `<span>${univ}</span><span class="tree-univers__count">${data.count}</span><span class="tree-univers__chevron">▶</span>`;
      btn.addEventListener("click", () => {
        const isOpen = wrap.classList.contains("is-open");
        document.querySelectorAll(".tree-univers").forEach((el) => el.classList.remove("is-open"));
        if (!isOpen) wrap.classList.add("is-open");
        goTo(univ, null, null, true);
      });
      wrap.appendChild(btn);

      const sfList = document.createElement("div");
      sfList.className = "tree-sf-list";
      sfKeysFor(univ).forEach((sf) => {
        const sfData = data.sfs[sf];
        const hasSf2 = Object.keys(sfData.sf2s).length > 0;
        const sfWrap = document.createElement("div");
        sfWrap.className = "tree-sf";
        sfWrap.dataset.sf = sf;

        const sfBtn = document.createElement("button");
        sfBtn.innerHTML = `<span>${sf}</span><span class="tree-sf__count">${sfData.count}</span>${hasSf2 ? '<span class="tree-sf__chevron">▶</span>' : ""}`;
        sfBtn.addEventListener("click", (e) => {
          e.stopPropagation();
          if (hasSf2) {
            const isOpen = sfWrap.classList.contains("is-open");
            wrap.querySelectorAll(".tree-sf").forEach((el) => el.classList.remove("is-open"));
            if (!isOpen) sfWrap.classList.add("is-open");
          }
          goTo(univ, sf, null, true);
        });
        sfWrap.appendChild(sfBtn);

        if (hasSf2) {
          const sf2List = document.createElement("div");
          sf2List.className = "tree-sf2-list";
          sf2KeysFor(univ, sf).forEach((sf2) => {
            const sf2Wrap = document.createElement("div");
            sf2Wrap.className = "tree-sf2";
            sf2Wrap.dataset.sf2 = sf2;
            const sf2Btn = document.createElement("button");
            sf2Btn.innerHTML = `<span>${sf2}</span><span class="tree-sf2__count">${sfData.sf2s[sf2]}</span>`;
            sf2Btn.addEventListener("click", (e) => {
              e.stopPropagation();
              goTo(univ, sf, sf2, true);
            });
            sf2Wrap.appendChild(sf2Btn);
            sf2List.appendChild(sf2Wrap);
          });
          sfWrap.appendChild(sf2List);
        }
        sfList.appendChild(sfWrap);
      });
      wrap.appendChild(sfList);
      $tree.appendChild(wrap);
    });
  }

  // goTo: central navigation function.
  // forceProducts=true (sidebar clicks) jumps straight to the product list.
  // forceProducts=false (home tiles) lets render() decide whether to show
  // the next tile level or the product list.
  function goTo(univ, sf, sf2, forceProducts) {
    if (activeTab !== "catalogue") switchTab("catalogue");
    state.univers = univ || null;
    state.sf = sf || null;
    state.sf2 = sf2 || null;
    state.query = "";
    state.visibleCount = PAGE_SIZE;
    state.showProductsNow = !!forceProducts;
    $searchInput.value = "";
    $searchClear.hidden = true;
    syncSidebarActive();
    closeDrawer();
    render();
  }

  function syncSidebarActive() {
    document.querySelectorAll(".tree-univers").forEach((el) => {
      const isActive = el.dataset.univers === state.univers;
      el.classList.toggle("is-active", isActive && !state.sf);
      if (isActive) el.classList.add("is-open");
    });
    document.querySelectorAll(".tree-sf").forEach((el) => {
      const parentUniv = el.closest(".tree-univers").dataset.univers;
      const isMatchSf = parentUniv === state.univers && el.dataset.sf === state.sf;
      el.classList.toggle("is-active", isMatchSf && !state.sf2);
      if (isMatchSf && state.sf2) el.classList.add("is-open");
    });
    document.querySelectorAll(".tree-sf2").forEach((el) => {
      const parentSfEl = el.closest(".tree-sf");
      const parentUniv = el.closest(".tree-univers").dataset.univers;
      const isMatch = parentUniv === state.univers && parentSfEl.dataset.sf === state.sf && el.dataset.sf2 === state.sf2;
      el.classList.toggle("is-active", isMatch);
    });
  }

  function resetAll() {
    state.univers = null;
    state.sf = null;
    state.sf2 = null;
    state.query = "";
    state.visibleCount = PAGE_SIZE;
    state.showProductsNow = false;
    $searchInput.value = "";
    $searchClear.hidden = true;
    document.querySelectorAll(".tree-univers").forEach((el) => el.classList.remove("is-active", "is-open"));
    document.querySelectorAll(".tree-sf").forEach((el) => el.classList.remove("is-active", "is-open"));
    document.querySelectorAll(".tree-sf2").forEach((el) => el.classList.remove("is-active"));
    render();
  }

  // ---------- Filtering / sorting ----------
  function getFiltered() {
    let list = PRODUCTS;
    if (state.query) {
      const q = state.query.toLowerCase();
      list = list.filter((p) => p.name.toLowerCase().includes(q) || p.ref.toLowerCase().includes(q));
    } else {
      if (state.univers) list = list.filter((p) => p.univers === state.univers);
      if (state.sf) list = list.filter((p) => p.sf === state.sf);
      if (state.sf2) list = list.filter((p) => p.sf2 === state.sf2);
    }
    const sorted = list.slice();
    sorted.sort((a, b) => {
      switch (state.sort) {
        case "name-desc":
          return b.name.localeCompare(a.name, "fr");
        case "price-asc":
          return (a.price ?? Infinity) - (b.price ?? Infinity);
        case "price-desc":
          return (b.price ?? -Infinity) - (a.price ?? -Infinity);
        case "ref-asc":
          return a.ref.localeCompare(b.ref, "fr");
        default:
          return a.name.localeCompare(b.name, "fr");
      }
    });
    return sorted;
  }

  // ---------- Breadcrumb ----------
  function renderBreadcrumb() {
    $breadcrumb.innerHTML = "";
    const atHome = !state.univers && !state.sf && !state.sf2 && !state.query;
    const crumbs = [{ label: "Catalogue", action: resetAll, current: atHome }];
    if (state.query) {
      crumbs.push({ label: `Recherche : "${state.query}"`, current: true });
    } else {
      if (state.univers) crumbs.push({ label: state.univers, action: () => goTo(state.univers), current: !state.sf });
      if (state.sf) crumbs.push({ label: state.sf, action: () => goTo(state.univers, state.sf), current: !state.sf2 });
      if (state.sf2) crumbs.push({ label: state.sf2, current: true });
    }
    crumbs.forEach((c, i) => {
      if (i > 0) {
        const sep = document.createElement("span");
        sep.className = "sep";
        sep.textContent = "/";
        $breadcrumb.appendChild(sep);
      }
      if (c.current) {
        const span = document.createElement("span");
        span.className = "current";
        span.textContent = c.label;
        $breadcrumb.appendChild(span);
      } else {
        const btn = document.createElement("button");
        btn.textContent = c.label;
        btn.addEventListener("click", c.action);
        $breadcrumb.appendChild(btn);
      }
    });
  }

  // ---------- Tile levels (home / univers / sous-famille) ----------
  const UNIVERS_ICONS = {
    "CHARCUTERIE": "🥓",
    "CRÉMERIE & FROMAGES": "🧀",
    "ÉPICERIE": "🛒",
    "FRAIS": "🥗",
    "FRUITS & LÉGUMES": "🥕",
    "PAIN, VIENNOISERIE & PÂTISSERIE": "🥖",
    "PLATS & SNACKING": "🍕",
    "PRODUIT DE LA MER": "🐟",
    "VIANDES": "🥩",
    "VOLAILLES": "🍗",
  };

  function renderTileLevel({ title, subtitle, intro, tiles, onSeeAll, seeAllLabel, onBack, icon }) {
    clearTransientNodes();
    $sectionTitle.textContent = title;
    $resultCount.textContent = subtitle;
    $sortWrap.hidden = true;
    $emptyState.hidden = true;
    $grid.hidden = false;
    $grid.classList.add("home-grid");
    $grid.classList.remove("grid");
    $grid.innerHTML = "";

    const introEl = document.createElement("p");
    introEl.className = "home-intro";
    introEl.textContent = intro;
    $grid.insertAdjacentElement("beforebegin", introEl);

    if (onBack) {
      const back = document.createElement("button");
      back.className = "back-btn";
      back.innerHTML = "← Retour";
      back.addEventListener("click", onBack);
      introEl.insertAdjacentElement("beforebegin", back);
    }

    const frag = document.createDocumentFragment();
    tiles.forEach((t) => {
      const tile = document.createElement("button");
      tile.className = "home-tile";
      const iconHTML = t.icon ? `<span class="home-tile__icon">${t.icon}</span>` : "";
      tile.innerHTML = `${iconHTML}<div class="home-tile__name">${t.label}</div><span class="home-tile__count">${t.count} produit${t.count > 1 ? "s" : ""}</span>`;
      tile.addEventListener("click", t.onClick);
      frag.appendChild(tile);
    });
    $grid.appendChild(frag);

    if (onSeeAll) {
      const more = document.createElement("button");
      more.className = "load-more";
      more.textContent = seeAllLabel;
      more.addEventListener("click", onSeeAll);
      $grid.insertAdjacentElement("afterend", more);
    }
  }

  function showUniversTiles() {
    renderTileLevel({
      title: "Choisissez une catégorie",
      subtitle: `${UNIVERS_LIST.length} univers · ${PRODUCTS.length} produits`,
      intro: "Choisissez un univers pour parcourir le catalogue, ou utilisez la recherche pour trouver un produit directement.",
      tiles: UNIVERS_LIST.map((univ) => ({
        label: univ,
        count: TREE[univ].count,
        icon: UNIVERS_ICONS[univ] || "📦",
        onClick: () => goTo(univ),
      })),
    });
  }

  function showSfTiles(univ) {
    const keys = sfKeysFor(univ);
    renderTileLevel({
      title: univ,
      subtitle: `${keys.length} sous-famille${keys.length > 1 ? "s" : ""} · ${TREE[univ].count} produits`,
      intro: `Choisissez une sous-famille dans ${univ}.`,
      tiles: keys.map((sf) => ({
        label: sf,
        count: TREE[univ].sfs[sf].count,
        onClick: () => goTo(univ, sf),
      })),
      onSeeAll: () => goTo(univ, null, null, true),
      seeAllLabel: `Voir tous les produits de « ${univ} » (${TREE[univ].count})`,
      onBack: resetAll,
    });
  }

  function showSf2Tiles(univ, sf) {
    const keys = sf2KeysFor(univ, sf);
    const sfCount = TREE[univ].sfs[sf].count;
    renderTileLevel({
      title: sf,
      subtitle: `${keys.length} sous-familles · ${sfCount} produits`,
      intro: `Choisissez une sous-famille dans ${sf}.`,
      tiles: keys.map((sf2) => ({
        label: sf2,
        count: TREE[univ].sfs[sf].sf2s[sf2],
        onClick: () => goTo(univ, sf, sf2),
      })),
      onSeeAll: () => goTo(univ, sf, null, true),
      seeAllLabel: `Voir tous les produits de « ${sf} » (${sfCount})`,
      onBack: () => goTo(univ),
    });
  }

  // ---------- Product grid ----------
  function renderCards(fullList) {
    const more = document.querySelector(".load-more");
    if (more) more.remove();
    $grid.innerHTML = "";
    const list = fullList.slice(0, state.visibleCount);
    const frag = document.createDocumentFragment();
    list.forEach((p) => {
      const card = document.createElement("article");
      card.className = "card";
      card.tabIndex = 0;
      card.setAttribute("role", "button");
      card.setAttribute("aria-label", `${p.name}, ${formatPrice(p.price) || "prix sur demande"}`);

      const priceHTML = p.price !== null
        ? `<span class="tag-badge">${formatPrice(p.price)}</span>`
        : `<span class="tag-badge tag-badge--empty">N/D</span>`;

      const imgHTML = p.img
        ? `<img src="${p.img}" alt="${p.name}" loading="lazy">`
        : placeholderSVG();

      card.innerHTML = `
        ${priceHTML}
        <div class="card__imgwrap">${imgHTML}</div>
        <div class="card__body">
          ${state.query ? `<span class="card__cat">${p.univers}</span>` : ""}
          <div class="card__name">${p.name}</div>
          <div class="card__meta">
            <span>Réf. ${p.ref}</span>
            <span>${p.cond ? "x" + p.cond : ""}</span>
          </div>
        </div>
      `;
      card.addEventListener("click", () => openLightbox(p));
      card.addEventListener("keydown", (e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          openLightbox(p);
        }
      });
      frag.appendChild(card);
    });
    $grid.appendChild(frag);

    if (fullList.length > list.length) {
      const more = document.createElement("button");
      more.className = "load-more";
      more.textContent = `Afficher plus (${list.length} / ${fullList.length})`;
      more.addEventListener("click", () => {
        state.visibleCount += PAGE_SIZE;
        renderCards(fullList);
      });
      $grid.insertAdjacentElement("afterend", more);
    }
  }

  function showProducts() {
    $sortWrap.hidden = false;
    clearTransientNodes();
    $grid.classList.remove("home-grid");
    $grid.classList.add("grid");

    const list = getFiltered();

    if (state.query) {
      $sectionTitle.textContent = "Résultats de recherche";
    } else if (state.sf2) {
      $sectionTitle.textContent = state.sf2;
    } else if (state.sf) {
      $sectionTitle.textContent = state.sf;
    } else if (state.univers) {
      $sectionTitle.textContent = state.univers;
    }

    $resultCount.textContent = `${list.length} produit${list.length > 1 ? "s" : ""}`;

    // Back button above product lists (not for search)
    if (!state.query && state.univers) {
      const back = document.createElement("button");
      back.className = "back-btn";
      back.innerHTML = "← Retour";
      back.addEventListener("click", () => {
        if (state.sf2) goTo(state.univers, state.sf);
        else if (state.sf) goTo(state.univers);
        else resetAll();
      });
      $breadcrumb.insertAdjacentElement("afterend", back);
    }

    if (list.length === 0) {
      $grid.hidden = true;
      $emptyState.hidden = false;
    } else {
      $grid.hidden = false;
      $emptyState.hidden = true;
      renderCards(list);
    }
  }

  // ---------- Main render: decides which level to show ----------
  function render() {
    if (activeTab !== "catalogue") return;
    renderBreadcrumb();

    if (state.query || state.showProductsNow) {
      showProducts();
      return;
    }
    if (!state.univers) {
      showUniversTiles();
      return;
    }
    if (!state.sf) {
      const keys = sfKeysFor(state.univers);
      if (keys.length === 1) {
        state.sf = keys[0];
      } else {
        showSfTiles(state.univers);
        return;
      }
    }
    if (!state.sf2) {
      const keys = sf2KeysFor(state.univers, state.sf);
      if (keys.length === 0) {
        showProducts();
        return;
      }
      if (keys.length === 1) {
        state.sf2 = keys[0];
        showProducts();
        return;
      }
      showSf2Tiles(state.univers, state.sf);
      return;
    }
    showProducts();
  }

  // ---------- Lightbox ----------
  function openLightbox(p) {
    $lightboxImage.innerHTML = p.img
      ? `<img src="${p.img}" alt="${p.name}">`
      : placeholderSVG();
    $lightboxName.textContent = p.name;
    $lightboxPrice.textContent = p.price !== null ? formatPrice(p.price) : "Prix sur demande";
    $lightboxRef.textContent = p.ref;
    $lightboxUnivers.textContent = p.univers;
    $lightboxSf.textContent = p.sf2 ? `${p.sf} — ${p.sf2}` : p.sf;
    $lightboxCond.textContent = p.cond ? `x${p.cond}` : "—";
    $lightboxTgc.textContent = p.tgc !== null && p.tgc !== undefined ? `${p.tgc} %` : "—";
    $lightbox.hidden = false;
    document.body.style.overflow = "hidden";
  }

  function closeLightbox() {
    $lightbox.hidden = true;
    document.body.style.overflow = "";
  }

  function openDrawer() {
    $sidebar.classList.add("is-open");
    $drawerOverlay.classList.add("is-open");
    $drawerToggle.setAttribute("aria-expanded", "true");
  }
  function closeDrawer() {
    $sidebar.classList.remove("is-open");
    $drawerOverlay.classList.remove("is-open");
    $drawerToggle.setAttribute("aria-expanded", "false");
  }

  // ---------- Events ----------
  let searchTimer = null;
  $searchInput.addEventListener("input", (e) => {
    clearTimeout(searchTimer);
    const val = e.target.value;
    $searchClear.hidden = val.length === 0;
    searchTimer = setTimeout(() => {
      if (activeTab !== "catalogue") switchTab("catalogue");
      state.query = val.trim();
      state.visibleCount = PAGE_SIZE;
      render();
    }, 80);
  });
  $searchClear.addEventListener("click", () => {
    $searchInput.value = "";
    $searchClear.hidden = true;
    state.query = "";
    state.visibleCount = PAGE_SIZE;
    render();
    $searchInput.focus();
  });

  $sortSelect.addEventListener("change", (e) => {
    state.sort = e.target.value;
    state.visibleCount = PAGE_SIZE;
    render();
  });

  $resetFilters.addEventListener("click", resetAll);
  $emptyReset.addEventListener("click", resetAll);

  $drawerToggle.addEventListener("click", () => {
    if ($sidebar.classList.contains("is-open")) closeDrawer();
    else openDrawer();
  });
  $drawerOverlay.addEventListener("click", closeDrawer);

  $lightboxClose.addEventListener("click", closeLightbox);
  $lightbox.addEventListener("click", (e) => {
    if (e.target === $lightbox) closeLightbox();
  });
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      if (!$lightbox.hidden) closeLightbox();
      else if ($sidebar.classList.contains("is-open")) closeDrawer();
    }
  });

  // ---------- Tabs & contact ----------
  const CONTACT_EMAIL = "contact@noumea-surgeles.nc"; // à remplacer par la vraie adresse

  const TABS = {
    home: { btn: $tabHome, view: $homeView },
    catalogue: { btn: $tabCatalogue, view: $catalogueView },
    about: { btn: $tabAbout, view: $aboutView },
    contact: { btn: $tabContact, view: $contactView },
  };

  function switchTab(tab) {
    activeTab = tab;
    Object.keys(TABS).forEach((key) => {
      const isActive = key === tab;
      TABS[key].btn.classList.toggle("is-active", isActive);
      TABS[key].view.hidden = !isActive;
    });
    $sidebar.hidden = tab !== "catalogue";
    $searchBox.hidden = tab !== "catalogue";
    $layout.classList.toggle("no-sidebar", tab !== "catalogue");
    if (tab === "catalogue") render();
  }

  function buildMessageBody() {
    const lines = [];
    lines.push(`Nom : ${$cName.value.trim()}`);
    if ($cCompany.value.trim()) lines.push(`Société : ${$cCompany.value.trim()}`);
    if ($cPhone.value.trim()) lines.push(`Téléphone : ${$cPhone.value.trim()}`);
    if ($cRef.value.trim()) lines.push(`Référence produit : ${$cRef.value.trim()}`);
    lines.push("");
    lines.push($cMessage.value.trim());
    return lines.join("\n");
  }

  function showNote(text) {
    $contactNote.textContent = text;
    $contactNote.hidden = false;
    setTimeout(() => { $contactNote.hidden = true; }, 4000);
  }

  $tabHome.addEventListener("click", () => switchTab("home"));
  $tabCatalogue.addEventListener("click", () => switchTab("catalogue"));
  $tabAbout.addEventListener("click", () => switchTab("about"));
  $tabContact.addEventListener("click", () => switchTab("contact"));
  $heroCatalogueBtn.addEventListener("click", () => switchTab("catalogue"));
  $heroContactBtn.addEventListener("click", () => switchTab("contact"));

  function renderHeroStats() {
    $heroStats.innerHTML = `
      <div class="hero__stat"><strong>${PRODUCTS.length}</strong><span>produits</span></div>
      <div class="hero__stat"><strong>${UNIVERS_LIST.length}</strong><span>univers</span></div>
    `;
  }

  $contactForm.addEventListener("submit", (e) => {
    e.preventDefault();
    if (!$cName.value.trim() || !$cMessage.value.trim()) {
      showNote("Merci de renseigner votre nom et votre message.");
      return;
    }
    const subject = $cRef.value.trim()
      ? `Demande produit réf. ${$cRef.value.trim()} — Catalogue Nouméa Surgelés`
      : "Demande — Catalogue Nouméa Surgelés";
    const url = `mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(buildMessageBody())}`;
    window.location.href = url;
  });

  $contactCopy.addEventListener("click", () => {
    if (!$cName.value.trim() || !$cMessage.value.trim()) {
      showNote("Merci de renseigner votre nom et votre message.");
      return;
    }
    const text = `À : ${CONTACT_EMAIL}\n\n${buildMessageBody()}`;
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(
        () => showNote("Message copié ! Collez-le dans votre messagerie."),
        () => showNote("Impossible de copier automatiquement — sélectionnez le texte manuellement.")
      );
    } else {
      showNote("Copie non disponible sur ce navigateur — sélectionnez le texte manuellement.");
    }
  });

  $lightboxAsk.addEventListener("click", () => {
    const ref = $lightboxRef.textContent;
    const name = $lightboxName.textContent;
    closeLightbox();
    switchTab("contact");
    $cRef.value = ref;
    if (!$cMessage.value.trim()) {
      $cMessage.value = `Bonjour,\n\nJe souhaite des informations sur le produit « ${name} » (réf. ${ref}).\n\nMerci d'avance.`;
    }
    $cName.focus();
    window.scrollTo({ top: 0 });
  });

  // ---------- Init ----------
  buildTree();
  renderHeroStats();
  switchTab("home");
})();
