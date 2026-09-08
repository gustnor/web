const pages = [
  { id: "etf2", label: "전체 ETF", html: "html/etf2.html", script: "js/etf2.js" }
];

const nav = document.getElementById("nav");
const app = document.getElementById("app");

function renderNav(currentId) {
  nav.innerHTML = pages
    .map(page => `
      <a href="#" data-page="${page.id}" class="${page.id === currentId ? "active" : ""}">
        ${page.label}
      </a>
    `)
    .join("");

  nav.querySelectorAll("a[data-page]").forEach(link => {
    link.addEventListener("click", event => {
      event.preventDefault();
      const pageId = link.dataset.page;
      loadPage(pageId);
    });
  });
}

function setPageParam(pageId) {
  const url = new URL(window.location.href);
  url.searchParams.set("page", pageId);
  window.history.replaceState({}, "", url);
}

async function loadPage(pageId) {
  const page = pages.find(item => item.id === pageId) || pages[0];
  const response = await fetch(page.html);
  if (!response.ok) {
    throw new Error(`${page.html} 요청 실패 (${response.status})`);
  }
  const html = await response.text();

  app.innerHTML = html;
  renderNav(page.id);
  setPageParam(page.id);

  const existingScript = document.querySelector("script[data-page-script]");
  if (existingScript) {
    existingScript.remove();
  }

  const script = document.createElement("script");
  script.src = page.script;
  if (page.csv) {
    script.dataset.csv = page.csv;
  }
  script.dataset.pageScript = "true";
  document.body.appendChild(script);
}

async function discoverWatchlistPages() {
  try {
    const response = await fetch("./data/watchlists.json");
    if (!response.ok) {
      return;
    }

    const files = await response.json();
    files.forEach(file => {
      const match = file.match(/^etf_watchlist(\d+)\.csv$/);
      if (!match) {
        return;
      }

      const suffix = match[1];
      const csv = `./data/${file}`;
    pages.push({
      id: `watchlist-csv-${suffix}`,
      label: `관심 ETF ${suffix}`,
      html: "html/watchlist-csv.html",
      script: "js/watchlist-csv.js",
      csv
    });
    });
  } catch (error) {
    console.error("watchlist 목록 확인 실패", error);
  }
}

async function initialize() {
  const initialPage = new URLSearchParams(window.location.search).get("page") || "etf2";
  const isWatchlistPage = initialPage.startsWith("watchlist-csv-");

  if (!isWatchlistPage) {
    loadPage(initialPage);
  }

  await discoverWatchlistPages();

  if (isWatchlistPage) {
    loadPage(initialPage);
  } else {
    renderNav(initialPage);
  }
}

initialize();
