const pages = [
  { id: "all", label: "전체 ETF", html: "html/all.html", script: "js/all.js" },
  { id: "watchlist", label: "관심 ETF", html: "html/watchlist.html", script: "js/watchlist.js" },
  { id: "etf2", label: "ETF2", html: "html/etf2.html", script: "js/etf2.js" }
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
  const html = await fetch(page.html).then(response => response.text());

  app.innerHTML = html;
  renderNav(page.id);
  setPageParam(page.id);

  const existingScript = document.querySelector("script[data-page-script]");
  if (existingScript) {
    existingScript.remove();
  }

  const script = document.createElement("script");
  script.src = page.script;
  script.dataset.pageScript = "true";
  document.body.appendChild(script);
}

const initialPage = new URLSearchParams(window.location.search).get("page") || "all";
loadPage(initialPage);
