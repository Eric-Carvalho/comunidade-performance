/* =====================================================================
   COMUNIDADE PERFORMANCE — running.js
   =====================================================================
   Used ONLY by running.html: the PACE CALCULATOR.
   Everything is calculated in the visitor's browser. Nothing is saved
   or sent anywhere.

   HOW IT WORKS
     pace (seconds per km) = time (seconds) / distance (km)
     time                  = pace x distance
     distance              = time / pace
     speed (km/h)          = 3600 / pace

   SAFE TO CHANGE
     - RACES: the list of races in the "previsao-de-provas" table
     - MAX_SPLITS: how many km rows the splits table shows at most
   ===================================================================== */

"use strict";

// Races shown in the prediction table (name + distance in km).
const RACES = [
  { name: "5 km",          km: 5 },
  { name: "10 km",         km: 10 },
  { name: "Meia maratona", km: 21.0975 },
  { name: "Maratona",      km: 42.195 },
];

const MAX_SPLITS = 100; // safety limit for the splits table

(function paceCalculator() {
  const root = document.querySelector("[data-pace]");
  if (!root) return; // not on this page

  // ---------- Inputs ----------
  const el = (id) => document.getElementById(id);
  const km = el("pace-km");
  const th = el("pace-h"), tm = el("pace-m"), ts = el("pace-s");
  const pm = el("pace-pm"), ps = el("pace-ps");
  const msg = document.querySelector("[data-pace-msg]");
  const chips = root.querySelectorAll("[data-km]");
  const groups = {
    dist: root.querySelector('[data-group="dist"]'),
    time: root.querySelector('[data-group="time"]'),
    pace: root.querySelector('[data-group="pace"]'),
  };

  // ---------- Outputs ----------
  const out = (name) => document.querySelector(`[data-out="${name}"]`);
  const cells = document.querySelectorAll("[data-cell]");

  // ---------- Helpers ----------
  const pad = (n) => String(n).padStart(2, "0");
  const nf1 = new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 1 });
  const nf2 = new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 2 });

  // Reads a number from a field; accepts "10,5" or "10.5". Empty = 0.
  function num(input) {
    const value = parseFloat(String(input.value).replace(",", "."));
    return Number.isFinite(value) && value > 0 ? value : 0;
  }

  // 3300 -> "55:00"   |   4530 -> "1:15:30"
  function fmtTime(totalSec) {
    const sec = Math.round(totalSec);
    const h = Math.floor(sec / 3600);
    const m = Math.floor((sec % 3600) / 60);
    const s = sec % 60;
    return h > 0 ? `${h}:${pad(m)}:${pad(s)}` : `${m}:${pad(s)}`;
  }

  // 330 -> "5:30"
  function fmtPace(secPerKm) {
    const sec = Math.round(secPerKm);
    return `${Math.floor(sec / 60)}:${pad(sec % 60)}`;
  }

  const mode = () => root.querySelector('input[name="pace-mode"]:checked').value;

  // Locks the group being calculated (it gets filled automatically).
  function updateLocks() {
    const m = mode();
    Object.entries(groups).forEach(([name, group]) => {
      const locked = name === m;
      group.querySelectorAll("input, button").forEach((input) => { input.disabled = locked; });
    });
    cells.forEach((cell) => cell.classList.toggle("is-calculated", cell.dataset.cell === m));
  }

  function clearResults(text) {
    msg.textContent = text;
    out("main").textContent = "—";
    out("summary").textContent = "";
    ["pace", "speed", "time", "dist"].forEach((name) => { out(name).textContent = "—"; });
    out("races").replaceChildren();
    out("splits").replaceChildren();
  }

  // Creates a table row: row(["5 km", "5", "27:30"], [false, true, true])
  function row(values, numeric, current) {
    const tr = document.createElement("tr");
    if (current) tr.className = "is-current";
    values.forEach((value, i) => {
      const td = document.createElement("td");
      td.textContent = value;
      if (numeric[i]) td.className = "num";
      tr.append(td);
    });
    return tr;
  }

  // ---------- Main calculation ----------
  function calc() {
    const m = mode();
    let dist = num(km);
    let time = num(th) * 3600 + num(tm) * 60 + num(ts);
    let pace = num(pm) * 60 + num(ps);

    if (m === "pace") {
      if (!(dist > 0 && time > 0)) return clearResults("Preencha a distância e o tempo.");
      pace = time / dist;
      // show the result inside the locked fields too
      const p = Math.round(pace);
      pm.value = Math.floor(p / 60);
      ps.value = p % 60;
    } else if (m === "time") {
      if (!(dist > 0 && pace > 0)) return clearResults("Preencha a distância e o pace.");
      time = pace * dist;
      const t = Math.round(time);
      th.value = Math.floor(t / 3600);
      tm.value = Math.floor((t % 3600) / 60);
      ts.value = t % 60;
    } else {
      if (!(time > 0 && pace > 0)) return clearResults("Preencha o tempo e o pace.");
      dist = time / pace;
      km.value = nf2.format(dist).replace(/\./g, "");
    }

    msg.textContent = "";
    const speed = 3600 / pace;

    // Big result = the value that was calculated
    const main = out("main");
    const label = out("main-label");
    const small = document.createElement("small");
    if (m === "pace") {
      label.textContent = "seu pace";
      small.textContent = "/km";
      main.replaceChildren(fmtPace(pace), small);
    } else if (m === "time") {
      label.textContent = "seu tempo";
      main.replaceChildren(fmtTime(time));
    } else {
      label.textContent = "sua distância";
      small.textContent = "km";
      main.replaceChildren(nf2.format(dist), small);
    }
    out("summary").textContent =
      `${nf2.format(dist)} km em ${fmtTime(time)} · pace ${fmtPace(pace)}/km · ${nf1.format(speed)} km/h`;

    // Small results grid
    out("pace").textContent = `${fmtPace(pace)} /km`;
    out("speed").textContent = `${nf1.format(speed)} km/h`;
    out("time").textContent = fmtTime(time);
    out("dist").textContent = `${nf2.format(dist)} km`;

    // Race predictions (same pace)
    out("races").replaceChildren(...RACES.map((race) =>
      row([race.name, `${nf2.format(race.km)} km`, fmtTime(pace * race.km)],
          [false, true, true],
          Math.abs(race.km - dist) < 0.01)));

    // Splits per km (+ the final partial km, if any)
    const whole = Math.min(Math.floor(dist), MAX_SPLITS);
    const splits = [];
    for (let i = 1; i <= whole; i += 1) {
      splits.push(row([`${i}`, fmtTime(pace * i)], [false, true]));
    }
    if (dist - whole > 0.001 && dist <= MAX_SPLITS) {
      splits.push(row([nf2.format(dist), fmtTime(time)], [false, true], true));
    }
    out("splits").replaceChildren(...splits);
  }

  // ---------- Events ----------
  root.addEventListener("input", (event) => {
    if (event.target.name === "pace-mode") return; // handled by "change"
    calc();
  });
  root.addEventListener("change", (event) => {
    if (event.target.name === "pace-mode") { updateLocks(); calc(); }
  });
  chips.forEach((chip) => chip.addEventListener("click", () => {
    // keep all decimals (21,0975 / 42,195) so race times are exact
    km.value = String(chip.dataset.km).replace(".", ",");
    calc();
  }));

  updateLocks();
  calc();
})();
