const HOMEWORK =
  Array.isArray(window.HOMEWORK_DATA)
    ? window.HOMEWORK_DATA.slice()
    : [];

const QUICK_DAYS = 14;

const state = {
  subject: "",
  mode: "future",
  date: null
};

const els = {
  subject: document.querySelector("#subject-filter"),
  chips: document.querySelector("#date-chips"),
  reset: document.querySelector("#reset-filters"),
  list: document.querySelector("#homework-list"),
  empty: document.querySelector("#empty-state"),
  count: document.querySelector("#result-count"),
  updated: document.querySelector("#updated-label"),
  rangeCaption: document.querySelector("#range-caption")
};


function pad(number) {
  return String(number).padStart(2, "0");
}


function toIsoDate(date) {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}


function parseIsoDate(value) {
  const [year, month, day] = value.split("-").map(Number);

  return new Date(year, month - 1, day);
}


function startOfToday() {
  const now = new Date();

  return new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate()
  );
}


function addDays(date, amount) {
  const copy = new Date(date);

  copy.setDate(copy.getDate() + amount);

  return copy;
}


const TODAY = startOfToday();
const TODAY_VALUE = toIsoDate(TODAY);


function escapeHtml(value = "") {
  return String(value).replace(
    /[&<>'"]/g,
    character => ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      "'": "&#39;",
      "\"": "&quot;"
    })[character]
  );
}


function formatWeekdayShort(date) {
  return new Intl.DateTimeFormat(
    "it-IT",
    { weekday: "short" }
  )
    .format(date)
    .replace(".", "");
}


function formatLongDate(value) {
  return new Intl.DateTimeFormat(
    "it-IT",
    {
      weekday: "long",
      day: "numeric",
      month: "long"
    }
  ).format(parseIsoDate(value));
}


function relativeLabel(value) {
  const date = parseIsoDate(value);

  const diff =
    Math.round((date - TODAY) / 86400000);

  if (diff === 0) return "Oggi";
  if (diff === 1) return "Domani";
  if (diff === 2) return "Dopodomani";

  return "Giorno";
}


function buildSubjectOptions() {
  const subjects =
    [...new Set(HOMEWORK.map(item => item.subject))]
      .filter(Boolean)
      .sort((a, b) => a.localeCompare(b, "it-IT"));

  els.subject.innerHTML =
    `<option value="">Tutte le materie</option>`;

  subjects.forEach(subject => {
    const option = document.createElement("option");
    option.value = subject;
    option.textContent = subject;
    els.subject.appendChild(option);
  });
}


function buildDateChips() {
  els.chips.innerHTML = "";

  const futureChip = document.createElement("button");
  futureChip.type = "button";
  futureChip.className =
    `date-chip is-wide${state.mode === "future" ? " is-active" : ""}`;

  futureChip.innerHTML = `
    <span class="date-chip-week">Vista</span>
    <strong>Da oggi</strong>
  `;

  futureChip.addEventListener("click", () => {
    state.mode = "future";
    state.date = null;
    buildDateChips();
    render();
  });

  els.chips.appendChild(futureChip);

  for (let index = 0; index < QUICK_DAYS; index += 1) {
    const date = addDays(TODAY, index);
    const value = toIsoDate(date);

    const chip = document.createElement("button");
    chip.type = "button";
    chip.className =
      `date-chip${state.mode === "date" && state.date === value ? " is-active" : ""}`;

    chip.innerHTML = `
      <span class="date-chip-week">${formatWeekdayShort(date)}</span>
      <strong>${date.getDate()}</strong>
    `;

    chip.addEventListener("click", () => {
      state.mode = "date";
      state.date = value;
      buildDateChips();
      render();
    });

    els.chips.appendChild(chip);
  }
}


function updateMeta() {
  if (HOMEWORK.length === 0) {
    els.updated.textContent = "Nessun compito pubblicato";
  } else {
    const sortedDates =
      HOMEWORK
        .map(item => item.date)
        .sort();

    const lastDate = sortedDates[sortedDates.length - 1];
    els.updated.textContent =
      `Ultimo giorno salvato: ${lastDate}`;
  }

  if (state.mode === "future") {
    els.rangeCaption.textContent = "Da oggi in poi";
  } else {
    els.rangeCaption.textContent = formatLongDate(state.date);
  }
}


function groupByDate(items) {
  return items.reduce((map, item) => {
    if (!map.has(item.date)) {
      map.set(item.date, []);
    }

    map.get(item.date).push(item);

    return map;
  }, new Map());
}


function renderCards(items) {
  return items.map(item => `
    <article class="homework-card">
      <div class="card-topline">
        <span class="subject-pill">${escapeHtml(item.subject)}</span>
      </div>

      <h3>${escapeHtml(item.title)}</h3>
      <p>${escapeHtml(item.details)}</p>
    </article>
  `).join("");
}


function render() {
  let filtered = HOMEWORK.slice();

  if (state.subject) {
    filtered = filtered.filter(
      item => item.subject === state.subject
    );
  }

  if (state.mode === "future") {
    filtered = filtered.filter(
      item => item.date >= TODAY_VALUE
    );
  } else if (state.mode === "date" && state.date) {
    filtered = filtered.filter(
      item => item.date === state.date
    );
  }

  filtered.sort((a, b) => {
    const byDate = a.date.localeCompare(b.date);

    if (byDate !== 0) return byDate;

    return a.subject.localeCompare(b.subject, "it-IT");
  });

  els.count.textContent =
    `${filtered.length} ${filtered.length === 1 ? "compito" : "compiti"}`;

  updateMeta();

  if (filtered.length === 0) {
    els.list.innerHTML = "";
    els.empty.hidden = false;
    return;
  }

  els.empty.hidden = true;

  const groups = groupByDate(filtered);

  const html = [...groups.entries()]
    .map(([date, items]) => `
      <section class="day-block">
        <div class="day-head">
          <div class="day-label">${relativeLabel(date)}</div>
          <h2>${formatLongDate(date)}</h2>
          <div class="day-subline">
            ${items.length} ${items.length === 1 ? "compito" : "compiti"}
          </div>
        </div>

        <div class="card-stack">
          ${renderCards(items)}
        </div>
      </section>
    `)
    .join("");

  els.list.innerHTML = html;
}


els.subject.addEventListener("change", event => {
  state.subject = event.target.value;
  render();
});


els.reset.addEventListener("click", () => {
  state.subject = "";
  state.mode = "future";
  state.date = null;
  els.subject.value = "";

  buildDateChips();
  render();
});


buildSubjectOptions();
buildDateChips();
render();
