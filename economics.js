/* =====================================================================
   COMUNIDADE PERFORMANCE — economics.js
   =====================================================================
   Used ONLY by economics.html: the live market area (TradingView).
   Must be loaded AFTER script.js (it listens to the theme button).

   WHY THIS WAY: TradingView's copy-paste code uses an INLINE <script>
   with the settings inside it. Our Content-Security-Policy blocks
   inline scripts on purpose (protection against injected code).
   So the same widgets are created from here instead — same result,
   strict security kept.

   PRIVACY: nothing loads until the visitor clicks the button
   "Carregar dados ao vivo" (data-tv-load in economics.html).
   To load automatically (less private), set AUTO_LOAD to true.

   HOW TO CHANGE A WIDGET (safe to edit):
     Everything is in TV_WIDGETS below. Each widget has:
       script   -> TradingView file name (don't change unless their
                   docs say so)
       credit   -> the "by TradingView" link shown under the widget
                   (TradingView's terms ask you to keep it)
       settings -> the same JSON you copy from TradingView's site.
                   "theme" is filled in automatically (light/dark).
     Examples:
       - other stock:     symbol: "BMFBOVESPA:PETR4"
       - Bitcoin:         symbol: "BITSTAMP:BTCUSD"
       - English:         locale: "en"
       - Brazil heatmap:  dataSource: "IBOV"

   TO ADD A NEW WIDGET:
     1) Copy one entry in TV_WIDGETS, give it a new name, e.g. "ticker"
     2) In economics.html, add a slot: <div class="tv-slot" data-tv="ticker">
   ===================================================================== */

"use strict";

const AUTO_LOAD = false; // true = load widgets without the click (less private)

const TV_BASE = "https://s3.tradingview.com/external-embedding/";

// Page colors, so the widgets blend into each theme.
const TV_COLORS = {
  light: { bg: "#ffffff", grid: "rgba(0, 0, 0, 0.08)" },
  dark:  { bg: "#000000", grid: "rgba(242, 242, 242, 0.12)" },
};

const TV_WIDGETS = {
  // ---------- WIDGET: advanced chart ----------
  chart: {
    script: "embed-widget-advanced-chart.js",
    credit: { href: "https://www.tradingview.com/symbols/NASDAQ-AAPL/", text: "Gráfico AAPL" },
    settings: (theme) => ({
      allow_symbol_change: true,      // visitor can type another symbol
      calendar: false,
      details: false,
      hide_side_toolbar: true,
      hide_top_toolbar: false,
      hide_legend: false,
      hide_volume: false,
      hotlist: false,
      interval: "D",                  // D = daily candles
      locale: "br",                   // Portuguese
      save_image: true,
      style: "1",                     // 1 = candles
      symbol: "NASDAQ:AAPL",          // <- change the starting symbol here
      theme: theme,
      timezone: "Etc/UTC",
      backgroundColor: TV_COLORS[theme].bg,
      gridColor: TV_COLORS[theme].grid,
      watchlist: [],
      withdateranges: false,
      compareSymbols: [],
      studies: [],
      autosize: true,                 // fills the slot (size set in styles.css)
    }),
  },

  // ---------- WIDGET: top stories (news) ----------
  news: {
    script: "embed-widget-timeline.js",
    credit: { href: "https://www.tradingview.com/news/top-providers/tradingview/", text: "Principais notícias" },
    settings: (theme) => ({
      displayMode: "adaptive",
      feedMode: "all_symbols",
      colorTheme: theme,
      isTransparent: false,           // keep false: "true" shows a white box in dark mode
      locale: "br",
      width: "100%",
      height: "100%",
    }),
  },

  // ---------- WIDGET: stock heatmap ----------
  heatmap: {
    script: "embed-widget-stock-heatmap.js",
    credit: { href: "https://www.tradingview.com/heatmap/stock/", text: "Mapa de calor" },
    settings: (theme) => ({
      dataSource: "SPX500",           // S&P 500 (try "IBOV" for Brazil)
      blockSize: "market_cap_basic",
      blockColor: "change",
      grouping: "sector",
      locale: "br",
      symbolUrl: "",
      colorTheme: theme,
      exchanges: [],
      hasTopBar: false,
      isDataSetEnabled: false,
      isZoomEnabled: true,
      hasSymbolTooltip: true,
      isMonoSize: false,
      width: "100%",
      height: "100%",
    }),
  },
};

(function tradingView() {
  const slots = document.querySelectorAll("[data-tv]");
  const loadButton = document.querySelector("[data-tv-load]");
  const consent = document.querySelector("[data-tv-consent]");
  if (!slots.length) return;

  let loaded = false;

  const currentTheme = () =>
    document.documentElement.getAttribute("data-theme") === "dark" ? "dark" : "light";

  // Builds one widget inside its slot (replaces whatever was there).
  function build(slot, theme) {
    const cfg = TV_WIDGETS[slot.getAttribute("data-tv")];
    if (!cfg) return; // unknown name: leave the slot alone

    const container = document.createElement("div");
    container.className = "tradingview-widget-container";

    const widget = document.createElement("div");
    widget.className = "tradingview-widget-container__widget";

    // Credit link (opens in a new tab, safely)
    const credit = document.createElement("div");
    credit.className = "tradingview-widget-copyright";
    const link = document.createElement("a");
    link.href = cfg.credit.href;
    link.target = "_blank";
    link.rel = "noopener noreferrer nofollow";
    link.textContent = cfg.credit.text;
    credit.append(link, " by TradingView");

    // TradingView's loader: external file + settings as its text
    const script = document.createElement("script");
    script.src = TV_BASE + cfg.script;
    script.async = true;
    script.textContent = JSON.stringify(cfg.settings(theme));

    container.append(widget, credit, script);
    slot.replaceChildren(container);
  }

  function loadAll() {
    if (loaded) return;
    loaded = true;
    const theme = currentTheme();
    slots.forEach((slot) => build(slot, theme));
    if (consent) consent.classList.add("is-loaded");
    if (loadButton) {
      loadButton.disabled = true;
      loadButton.firstChild.textContent = "Dados ao vivo carregados ";
    }
  }

  if (loadButton) loadButton.addEventListener("click", loadAll);

  // When the site theme changes, rebuild the widgets in the new theme.
  document.addEventListener("themechange", (event) => {
    if (!loaded) return;
    slots.forEach((slot) => build(slot, event.detail.theme));
  });

  if (AUTO_LOAD) loadAll();
})();
