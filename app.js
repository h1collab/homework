const HOMEWORK =
  Array.isArray(window.HOMEWORK_DATA)
    ? window.HOMEWORK_DATA.slice()
    : [];


const state = {
  subject: "",
  selectedDate: null,
  weekOffset: 0
};


const els = {
  subjectSelect:
    document.querySelector("#subject-select"),

  subjectTrigger:
    document.querySelector("#subject-trigger"),

  subjectValue:
    document.querySelector("#subject-value"),

  subjectMenu:
    document.querySelector("#subject-menu"),

  dateStrip:
    document.querySelector("#date-strip"),

  monthTitle:
    document.querySelector("#month-title"),

  datePrev:
    document.querySelector("#date-prev"),

  dateNext:
    document.querySelector("#date-next"),

  reset:
    document.querySelector("#reset-filters"),

  viewCaption:
    document.querySelector("#view-caption"),

  list:
    document.querySelector("#homework-list"),

  empty:
    document.querySelector("#empty-state"),

  count:
    document.querySelector("#result-count"),

  updated:
    document.querySelector("#updated-label")
};


function pad(value) {
  return String(value).padStart(2, "0");
}


function toIsoDate(date) {
  return [
    date.getFullYear(),
    pad(date.getMonth() + 1),
    pad(date.getDate())
  ].join("-");
}


function parseIsoDate(value) {
  const [year, month, day] =
    value.split("-").map(Number);

  return new Date(
    year,
    month - 1,
    day
  );
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
  const result = new Date(date);

  result.setDate(
    result.getDate() + amount
  );

  return result;
}


const TODAY = startOfToday();
const TODAY_ISO = toIsoDate(TODAY);


function escapeHtml(value = "") {
  return String(value)
    .replace(
      /[&<>'"]/g,
      char => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        "'": "&#39;",
        '"': "&quot;"
      })[char]
    );
}


function formatMonth(date) {
  return new Intl.DateTimeFormat(
    "it-IT",
    {
      month: "long",
      year: "numeric"
    }
  ).format(date);
}


function formatWeekday(date) {
  return new Intl.DateTimeFormat(
    "it-IT",
    {
      weekday: "short"
    }
  )
    .format(date)
    .replace(".", "")
    .toUpperCase();
}


function formatLongDate(value) {
  return new Intl.DateTimeFormat(
    "it-IT",
    {
      weekday: "long",
      day: "numeric",
      month: "long"
    }
  ).format(
    parseIsoDate(value)
  );
}


function relativeLabel(value) {
  const date =
    parseIsoDate(value);

  const diff =
    Math.round(
      (date - TODAY) / 86400000
    );

  if (diff === 0) {
    return "OGGI";
  }

  if (diff === 1) {
    return "DOMANI";
  }

  if (diff === 2) {
    return "DOPO DOMANI";
  }

  return "GIORNO";
}


function getSubjects() {
  return [
    ...new Set(
      HOMEWORK
        .map(item => item.subject)
        .filter(Boolean)
    )
  ].sort(
    (a, b) =>
      a.localeCompare(
        b,
        "it-IT"
      )
  );
}


function buildSubjectMenu() {

  const subjects =
    getSubjects();

  const values = [
    "",
    ...subjects
  ];

  els.subjectMenu.innerHTML = "";


  values.forEach(value => {

    const button =
      document.createElement(
        "button"
      );

    button.type = "button";

    button.className =
      "select-option";


    const selected =
      state.subject === value;


    if (selected) {
      button.classList.add(
        "is-selected"
      );
    }


    const label =
      value ||
      "Tutte le materie";


    button.innerHTML = `
      <span>${escapeHtml(label)}</span>

      <svg
        class="option-check"
        viewBox="0 0 20 20"
        aria-hidden="true"
      >
        <path
          d="m5 10 3 3 7-7"
          fill="none"
          stroke="currentColor"
          stroke-width="1.7"
          stroke-linecap="round"
          stroke-linejoin="round"
        />
      </svg>
    `;


    button.addEventListener(
      "click",
      () => {

        state.subject = value;

        els.subjectValue
          .textContent = label;

        closeSubjectMenu();

        buildSubjectMenu();

        render();

      }
    );


    els.subjectMenu.appendChild(
      button
    );

  });

}


function openSubjectMenu() {
  els.subjectMenu.hidden = false;

  els.subjectTrigger
    .classList
    .add("is-open");

  els.subjectTrigger
    .setAttribute(
      "aria-expanded",
      "true"
    );
}


function closeSubjectMenu() {
  els.subjectMenu.hidden = true;

  els.subjectTrigger
    .classList
    .remove("is-open");

  els.subjectTrigger
    .setAttribute(
      "aria-expanded",
      "false"
    );
}


function toggleSubjectMenu() {
  if (els.subjectMenu.hidden) {
    openSubjectMenu();
  } else {
    closeSubjectMenu();
  }
}


els.subjectTrigger
  .addEventListener(
    "click",
    toggleSubjectMenu
  );


document.addEventListener(
  "click",
  event => {

    if (
      !els.subjectSelect
        .contains(event.target)
    ) {
      closeSubjectMenu();
    }

  }
);


function getWeekStart() {

  return addDays(
    TODAY,
    state.weekOffset * 7
  );

}


function buildDateStrip() {

  const start =
    getWeekStart();


  els.monthTitle.textContent =
    formatMonth(start);


  els.dateStrip.innerHTML = "";


  for (
    let i = 0;
    i < 7;
    i += 1
  ) {

    const date =
      addDays(start, i);

    const iso =
      toIsoDate(date);


    const button =
      document.createElement(
        "button"
      );

    button.type = "button";

    button.className =
      "date-item";


    if (iso === TODAY_ISO) {
      button.classList.add(
        "is-today"
      );
    }


    if (
      state.selectedDate === iso
    ) {
      button.classList.add(
        "is-selected"
      );
    }


    button.innerHTML = `
      <span class="date-weekday">
        ${formatWeekday(date)}
      </span>

      <span class="date-number">
        ${date.getDate()}
      </span>
    `;


    button.addEventListener(
      "click",
      () => {

        if (
          state.selectedDate === iso
        ) {

          state.selectedDate = null;

        } else {

          state.selectedDate = iso;

        }


        buildDateStrip();

        render();

      }
    );


    els.dateStrip.appendChild(
      button
    );

  }

}


els.datePrev.addEventListener(
  "click",
  () => {

    state.weekOffset -= 1;

    buildDateStrip();

  }
);


els.dateNext.addEventListener(
  "click",
  () => {

    state.weekOffset += 1;

    buildDateStrip();

  }
);


function getFilteredHomework() {

  return HOMEWORK
    .filter(item => {

      if (!state.subject) {
        return true;
      }

      return (
        item.subject ===
        state.subject
      );

    })

    .filter(item => {

      if (state.selectedDate) {

        return (
          item.date ===
          state.selectedDate
        );

      }

      return (
        item.date >=
        TODAY_ISO
      );

    })

    .sort(
      (a, b) => {

        const dateCompare =
          a.date.localeCompare(
            b.date
          );

        if (dateCompare !== 0) {
          return dateCompare;
        }

        return (
          a.subject.localeCompare(
            b.subject,
            "it-IT"
          )
        );

      }
    );

}


function groupByDate(items) {

  const map =
    new Map();


  items.forEach(item => {

    if (!map.has(item.date)) {
      map.set(
        item.date,
        []
      );
    }


    map
      .get(item.date)
      .push(item);

  });


  return map;

}


function render() {

  const filtered =
    getFilteredHomework();


  els.count.textContent =
    `${filtered.length} ${
      filtered.length === 1
        ? "compito"
        : "compiti"
    }`;


  if (state.selectedDate) {

    els.viewCaption.textContent =
      formatLongDate(
        state.selectedDate
      );

  } else {

    els.viewCaption.textContent =
      "Da oggi in poi";

  }


  if (HOMEWORK.length === 0) {

    els.updated.textContent =
      "Nessun compito pubblicato";

  } else {

    const dates =
      HOMEWORK
        .map(item => item.date)
        .sort();

    els.updated.textContent =
      `Ultimo aggiornamento: ${
        dates[dates.length - 1]
      }`;

  }


  if (filtered.length === 0) {

    els.list.innerHTML = "";

    els.empty.hidden = false;

    return;

  }


  els.empty.hidden = true;


  const groups =
    groupByDate(filtered);


  els.list.innerHTML =
    [...groups.entries()]
      .map(
        ([date, items]) => `

          <section class="day-block">

            <div class="day-side">

              <div class="day-badge">
                ${relativeLabel(date)}
              </div>

              <h2>
                ${formatLongDate(date)}
              </h2>

            </div>


            <div class="cards">

              ${items.map(
                item => `

                  <article class="homework-card">

                    <span class="subject-pill">
                      ${escapeHtml(item.subject)}
                    </span>

                    <h3>
                      ${escapeHtml(item.title)}
                    </h3>

                    <p>
                      ${escapeHtml(item.details)}
                    </p>

                  </article>

                `
              ).join("")}

            </div>

          </section>

        `
      )
      .join("");

}


els.reset.addEventListener(
  "click",
  () => {

    state.subject = "";
    state.selectedDate = null;
    state.weekOffset = 0;

    els.subjectValue.textContent =
      "Tutte le materie";

    buildSubjectMenu();
    buildDateStrip();
    render();

  }
);


buildSubjectMenu();
buildDateStrip();
render();
