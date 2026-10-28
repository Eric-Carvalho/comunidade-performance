/* =====================================================================
   COMUNIDADE PERFORMANCE — script.js
   =====================================================================
   SHARED by all 5 pages: small interactions that every page has.
   The site still works (and all content is readable) if JavaScript is
   turned off.

   PAGE-SPECIFIC TOOLS live in their own files:
     economics.js -> live market (TradingView)
     running.js   -> pace calculator
     brain.js     -> pomodoro, reading calculator, breathing

   SAFETY: these files do NOT
     - set cookies or use localStorage
     - send any request to any server (the CSP also blocks it)
     - read anything typed by the visitor outside this browser tab
   The only external content is the TradingView widgets
   (economics.js), which load ONLY after the visitor clicks a button.
   Please keep it that way.

   FILE MAP
     1. Setup ("js" class)
    1b. Light / dark theme button
     2. Mobile menu
     3. Scroll fade-in (reveal)
     4. Footer year
    4b. Top bar countdown
   ===================================================================== */

"use strict"; // catches common mistakes early

/* ---------------------------------------------------------------------
   1. SETUP
   Adds class "js" to <html>. styles.css uses it so that the fade-in
   animation only hides elements when JS is actually running.
   --------------------------------------------------------------------- */
document.documentElement.classList.add("js");


/* ---------------------------------------------------------------------
   1b. LIGHT / DARK THEME
   - Starts with the visitor's system theme (phone/computer setting).
   - The button in the menu switches between light and dark by setting
     <html data-theme="light|dark">; styles.css has the colors.
   - PRIVACY: the choice is NOT saved (no cookies, no localStorage),
     so every visit starts again with the system theme.
   - Button texts: change "Escuro" / "Claro" below.
   --------------------------------------------------------------------- */
(function themeToggle() {
  const root = document.documentElement;
  const button = document.querySelector(".theme-toggle");
  const label = document.querySelector(".theme-label");
  const systemDark = window.matchMedia("(prefers-color-scheme: dark)");
  let userChose = false; // becomes true after the first click

  function apply(theme) {
    root.setAttribute("data-theme", theme);
    if (!button) return;
    const isDark = theme === "dark";
    // The button shows the theme you will switch TO.
    if (label) label.textContent = isDark ? "Claro" : "Escuro";
    button.setAttribute("aria-pressed", String(isDark));
    button.setAttribute("aria-label", isDark ? "Ativar modo claro" : "Ativar modo escuro");
    // Tell other parts of the page (e.g. TradingView widgets) the theme changed.
    document.dispatchEvent(new CustomEvent("themechange", { detail: { theme } }));
  }

  // 1) start with the system theme
  apply(systemDark.matches ? "dark" : "light");

  // 2) follow system changes until the visitor clicks the button
  systemDark.addEventListener("change", (event) => {
    if (!userChose) apply(event.matches ? "dark" : "light");
  });

  // 3) click = switch
  if (button) {
    button.addEventListener("click", () => {
      userChose = true;
      apply(root.getAttribute("data-theme") === "dark" ? "light" : "dark");
    });
  }
})();


/* ---------------------------------------------------------------------
   2. MOBILE MENU
   Opens/closes the menu when the hamburger button is clicked.
   Uses the classes/attributes from the header of every page:
     .menu-toggle (button)   #menu-principal (nav)   .is-open (CSS)
   --------------------------------------------------------------------- */
(function mobileMenu() {
  const button = document.querySelector(".menu-toggle");
  const nav = document.getElementById("menu-principal");
  if (!button || !nav) return; // safety: stop if HTML changed

  function setOpen(open) {
    nav.classList.toggle("is-open", open);
    button.setAttribute("aria-expanded", String(open));
    button.querySelector(".sr-only").textContent = open ? "Fechar menu" : "Abrir menu";
  }

  button.addEventListener("click", () => {
    setOpen(button.getAttribute("aria-expanded") !== "true");
  });

  // Close the menu after choosing a link, or when pressing Escape.
  nav.addEventListener("click", (event) => {
    if (event.target.closest("a")) setOpen(false);
  });
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") setOpen(false);
  });
})();


/* ---------------------------------------------------------------------
   3. SCROLL FADE-IN
   Any element with class="reveal" fades in when it enters the screen.
   To animate a new element: just add class "reveal" to it in the HTML.
   threshold: 0.15 = start when 15% of the element is visible.
   --------------------------------------------------------------------- */
(function revealOnScroll() {
  const items = document.querySelectorAll(".reveal");

  // Old browsers without IntersectionObserver: just show everything.
  if (!("IntersectionObserver" in window)) {
    items.forEach((el) => el.classList.add("is-visible"));
    return;
  }

  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add("is-visible");
        observer.unobserve(entry.target); // animate only once
      }
    });
  }, { threshold: 0.15, rootMargin: "0px 0px -40px 0px" });

  items.forEach((el) => observer.observe(el));
})();


/* ---------------------------------------------------------------------
   4. FOOTER YEAR
   Keeps the © year up to date automatically.
   --------------------------------------------------------------------- */
document.querySelectorAll("[data-year]").forEach((el) => {
  el.textContent = String(new Date().getFullYear());
});


/* ---------------------------------------------------------------------
   4b. TOP BAR COUNTDOWN
   Shows how much time is left until midnight, using the visitor's own
   clock. Nothing is stored or sent. To count down to a fixed date
   instead (e.g. the V2 launch), replace the "end" line with:
     const end = new Date("2027-01-01T00:00:00");
   --------------------------------------------------------------------- */
(function countdown() {
  const h = document.querySelector("[data-cd-h]");
  const m = document.querySelector("[data-cd-m]");
  const s = document.querySelector("[data-cd-s]");
  if (!h || !m || !s) return;

  const pad = (n) => String(n).padStart(2, "0");

  function tick() {
    const now = new Date();
    const end = new Date(now);
    end.setHours(24, 0, 0, 0); // next midnight
    const left = Math.max(0, Math.floor((end - now) / 1000));
    h.textContent = pad(Math.floor(left / 3600));
    m.textContent = pad(Math.floor((left % 3600) / 60));
    s.textContent = pad(left % 60);
  }

  tick();
  setInterval(tick, 1000);
})();

