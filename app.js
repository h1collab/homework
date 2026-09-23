const HOMEWORK =
  Array.isArray(window.HOMEWORK_DATA)
    ? window.HOMEWORK_DATA.slice()
    : [];

const NOTICES =
  Array.isArray(window.NOTICE_DATA)
    ? window.NOTICE_DATA.slice()
    : [];

const TIMETABLE =
  window.TIMETABLE_DATA || {};

const ALL_SUBJECTS =
  Array.isArray(window.ALL_SUBJECTS)
    ? window.ALL_SUBJECTS.slice()
    : [];


function pad(value) {
  return String(value).padStart(2, "0");
}


function toIsoDate(date) {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
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


function escapeHtml(value = "") {
  return String(value).replace(
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


function normalizeSubject(value = "") {
  const clean =
    String(value).trim();

  if (/^men[uù]$/i.test(clean)) {
    return "Musica";
  }

  return clean;
}


const TODAY =
  startOfToday();

const TODAY_ISO =
  toIsoDate(TODAY);


const state = {
  subject: "",
  selectedDate: TODAY_ISO,

  /*
   * false:
   * mostra tutti i compiti da oggi in poi.
   *
   * true:
   * mostra solo il giorno selezionato.
   */
  dateFilterActive: false,

  weekOffset: 0,

  carryDate: TODAY_ISO,
  carryOpen: false
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

  schedule:
    document.querySelector("#schedule-area"),

  notices:
    document.querySelector("#notice-area"),

  list:
    document.querySelector("#homework-list"),

  empty:
    document.querySelector("#empty-state"),

  count:
    document.querySelector("#result-count"),

  updated:
    document.querySelector("#updated-label")
};


/* =========================================================
   DATE FORMAT
   ========================================================= */

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


function formatCarryDate(value) {
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

  const difference =
    Math.round(
      (date - TODAY) / 86400000
    );

  if (difference === 0) {
    return "OGGI";
  }

  if (difference === 1) {
    return "DOMANI";
  }

  if (difference === 2) {
    return "DOPODOMANI";
  }

  return "GIORNO";
}


/* =========================================================
   MATERIA - TUTTE LE MATERIE
   ========================================================= */

function getSubjects() {
  const homeworkSubjects =
    HOMEWORK
      .map(item =>
        normalizeSubject(
          item.subject
        )
      )
      .filter(Boolean);

  const timetableSubjects =
    Object
      .values(TIMETABLE)
      .flatMap(day =>
        Array.isArray(day.lessons)
          ? day.lessons
          : []
      )
      .map(normalizeSubject)
      .filter(Boolean);

  return [
    ...new Set([
      ...ALL_SUBJECTS,
      ...homeworkSubjects,
      ...timetableSubjects
    ])
  ].sort(
    (a, b) =>
      a.localeCompare(
        b,
        "it-IT"
      )
  );
}


function buildSubjectMenu() {
  const values = [
    "",
    ...getSubjects()
  ];

  els.subjectMenu.innerHTML = "";

  values.forEach(value => {
    const button =
      document.createElement("button");

    button.type = "button";
    button.className =
      "select-option";

    if (state.subject === value) {
      button.classList.add(
        "is-selected"
      );
    }

    const label =
      value ||
      "Tutte le materie";

    button.innerHTML = `
      <span>
        ${escapeHtml(label)}
      </span>

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

    els.subjectMenu
      .appendChild(button);
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


els.subjectTrigger
  .addEventListener(
    "click",
    () => {
      if (els.subjectMenu.hidden) {
        openSubjectMenu();
      } else {
        closeSubjectMenu();
      }
    }
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


/* =========================================================
   CALENDARIO COMPITI
   ========================================================= */

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
    let index = 0;
    index < 7;
    index += 1
  ) {
    const date =
      addDays(start, index);

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
          state.dateFilterActive &&
          state.selectedDate === iso
        ) {
          state.dateFilterActive = false;
          state.selectedDate = TODAY_ISO;
        } else {
          state.selectedDate = iso;
          state.dateFilterActive = true;
        }

        buildDateStrip();
        render();
      }
    );

    els.dateStrip
      .appendChild(button);
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


/* =========================================================
   COSA PORTARE
   ========================================================= */

function schoolDayMove(
  value,
  direction
) {
  let date =
    parseIsoDate(value);

  do {
    date =
      addDays(
        date,
        direction
      );
  }
  while (
    date.getDay() === 0 ||
    date.getDay() === 6
  );

  return toIsoDate(date);
}


function uniqueLessons(lessons) {
  return [
    ...new Set(
      lessons
        .map(normalizeSubject)
        .filter(Boolean)
        .filter(
          lesson =>
            lesson !==
            "Prolungamento"
        )
    )
  ];
}


function renderSchedule() {
  if (!els.schedule) {
    return;
  }

  const selectedDate =
    parseIsoDate(
      state.carryDate
    );

  const weekday =
    selectedDate.getDay();

  const timetableDay =
    TIMETABLE[weekday];

  const isToday =
    state.carryDate ===
    TODAY_ISO;

  const dayName =
    timetableDay
      ? timetableDay.day
      : new Intl.DateTimeFormat(
          "it-IT",
          { weekday: "long" }
        ).format(selectedDate);


  let collapsedSummary = "";

  if (timetableDay) {
    const unique =
      uniqueLessons(
        timetableDay.lessons
      );

    collapsedSummary = `
      <div class="carry-preview">
        ${unique
          .slice(0, 4)
          .map(
            subject => `
              <span>
                ${escapeHtml(subject)}
              </span>
            `
          )
          .join("")}

        ${
          unique.length > 4
            ? `<span>+${unique.length - 4}</span>`
            : ""
        }
      </div>
    `;
  }


  let details = "";

  if (state.carryOpen) {
    if (!timetableDay) {
      details = `
        <div class="carry-details">
          <div class="carry-empty">
            Nessuna lezione prevista.
          </div>
        </div>
      `;
    } else {
      const unique =
        uniqueLessons(
          timetableDay.lessons
        );

      details = `
        <div class="carry-details">

          <div class="carry-subjects">
            ${unique.map(
              subject => `
                <span class="carry-pill">
                  ${escapeHtml(subject)}
                </span>
              `
            ).join("")}
          </div>

          <div class="carry-lessons">
            ${timetableDay.lessons
              .map(
                (lesson, index) => `
                  <div class="carry-lesson-row">

                    <span class="carry-hour">
                      ${index + 1}ª
                    </span>

                    <span class="carry-lesson-name">
                      ${escapeHtml(
                        normalizeSubject(
                          lesson
                        )
                      )}
                    </span>

                  </div>
                `
              )
              .join("")}
          </div>

        </div>
      `;
    }
  }


  els.schedule.innerHTML = `
    <section
      class="carry-card"
      id="carry-card"
    >

      <div class="carry-main-row">

        <button
          type="button"
          class="carry-arrow"
          id="carry-prev"
          aria-label="Giorno precedente"
        >
          <svg viewBox="0 0 20 20">
            <path
              d="M12 5 7 10l5 5"
              fill="none"
              stroke="currentColor"
              stroke-width="1.6"
              stroke-linecap="round"
              stroke-linejoin="round"
            />
          </svg>
        </button>


        <button
          type="button"
          class="carry-center"
          id="carry-toggle"
          aria-expanded="${state.carryOpen}"
        >

          <div class="carry-kicker">
            COSA PORTARE
          </div>

          <div class="carry-title-row">

            <h2>
              ${
                isToday
                  ? "Oggi"
                  : escapeHtml(dayName)
              }
            </h2>

            <svg
              class="carry-chevron ${
                state.carryOpen
                  ? "is-open"
                  : ""
              }"
              viewBox="0 0 20 20"
            >
              <path
                d="M5 7.5 10 12.5 15 7.5"
                fill="none"
                stroke="currentColor"
                stroke-width="1.6"
                stroke-linecap="round"
                stroke-linejoin="round"
              />
            </svg>

          </div>

          <div class="carry-date">
            ${escapeHtml(
              formatCarryDate(
                state.carryDate
              )
            )}
          </div>

          ${
            !state.carryOpen
              ? collapsedSummary
              : ""
          }

        </button>


        <button
          type="button"
          class="carry-arrow"
          id="carry-next"
          aria-label="Giorno successivo"
        >
          <svg viewBox="0 0 20 20">
            <path
              d="m8 5 5 5-5 5"
              fill="none"
              stroke="currentColor"
              stroke-width="1.6"
              stroke-linecap="round"
              stroke-linejoin="round"
            />
          </svg>
        </button>

      </div>


      ${
        !isToday
          ? `
            <button
              id="carry-today"
              class="carry-today"
              type="button"
            >
              Torna a oggi
            </button>
          `
          : ""
      }


      ${details}

    </section>
  `;


  const prev =
    document.querySelector(
      "#carry-prev"
    );

  const next =
    document.querySelector(
      "#carry-next"
    );

  const toggle =
    document.querySelector(
      "#carry-toggle"
    );

  const today =
    document.querySelector(
      "#carry-today"
    );

  const card =
    document.querySelector(
      "#carry-card"
    );


  prev?.addEventListener(
    "click",
    event => {
      event.stopPropagation();

      state.carryDate =
        schoolDayMove(
          state.carryDate,
          -1
        );

      renderSchedule();
    }
  );


  next?.addEventListener(
    "click",
    event => {
      event.stopPropagation();

      state.carryDate =
        schoolDayMove(
          state.carryDate,
          1
        );

      renderSchedule();
    }
  );


  toggle?.addEventListener(
    "click",
    () => {
      state.carryOpen =
        !state.carryOpen;

      renderSchedule();
    }
  );


  today?.addEventListener(
    "click",
    () => {
      state.carryDate =
        TODAY_ISO;

      renderSchedule();
    }
  );


  if (card) {
    let touchStartX = 0;
    let touchStartY = 0;

    card.addEventListener(
      "touchstart",
      event => {
        const touch =
          event.changedTouches[0];

        touchStartX =
          touch.clientX;

        touchStartY =
          touch.clientY;
      },
      {
        passive: true
      }
    );


    card.addEventListener(
      "touchend",
      event => {
        const touch =
          event.changedTouches[0];

        const deltaX =
          touch.clientX -
          touchStartX;

        const deltaY =
          touch.clientY -
          touchStartY;

        if (
          Math.abs(deltaX) < 55 ||
          Math.abs(deltaX) <
          Math.abs(deltaY)
        ) {
          return;
        }

        if (deltaX < 0) {
          state.carryDate =
            schoolDayMove(
              state.carryDate,
              1
            );
        } else {
          state.carryDate =
            schoolDayMove(
              state.carryDate,
              -1
            );
        }

        renderSchedule();
      },
      {
        passive: true
      }
    );
  }
}


/* =========================================================
   AVVISI
   ========================================================= */

function renderNotices() {
  const notices =
    NOTICES.filter(
      notice =>
        notice.date ===
        state.selectedDate
    );

  if (notices.length === 0) {
    els.notices.innerHTML = "";
    els.notices.hidden = true;
    return;
  }

  els.notices.hidden = false;

  els.notices.innerHTML =
    notices
      .map(notice => {
        const urgent =
          notice.type ===
          "urgent";

        return `
          <article class="
            notice-card
            ${
              urgent
                ? "notice-urgent"
                : "notice-warning"
            }
          ">

            <div class="notice-icon">
              !
            </div>

            <div class="notice-content">

              <h3 class="notice-title">
                ${escapeHtml(
                  notice.title
                )}
              </h3>

              <p class="notice-text">
                ${escapeHtml(
                  notice.text
                )}
              </p>

            </div>

          </article>
        `;
      })
      .join("");
}


/* =========================================================
   COMPITI
   ========================================================= */

function getFilteredHomework() {
  return HOMEWORK
    .filter(item => {
      const subject =
        normalizeSubject(
          item.subject
        );

      if (!state.subject) {
        return true;
      }

      return (
        subject ===
        state.subject
      );
    })

    .filter(item => {

      if (state.dateFilterActive) {
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
      (a, b) =>
        normalizeSubject(
          a.subject
        ).localeCompare(
          normalizeSubject(
            b.subject
          ),
          "it-IT"
        )
    );
}


function render() {
  renderSchedule();
  renderNotices();

  const filtered =
    getFilteredHomework();

  els.count.textContent =
    `${filtered.length} ${
      filtered.length === 1
        ? "compito"
        : "compiti"
    }`;

  els.viewCaption.textContent =
    state.dateFilterActive
      ? formatLongDate(
          state.selectedDate
        )
      : "Da oggi in poi";

  els.updated.textContent =
    state.dateFilterActive
      ? formatLongDate(
          state.selectedDate
        )
      : "Da oggi in poi";

  if (filtered.length === 0) {
    els.list.innerHTML = "";
    els.empty.hidden = false;
    return;
  }

  els.empty.hidden = true;

  els.list.innerHTML = `
    <section class="day-block">

      <div class="day-side">

        <div class="day-badge">
          ${relativeLabel(
            state.selectedDate
          )}
        </div>

        <h2>
          ${formatLongDate(
            state.selectedDate
          )}
        </h2>

      </div>


      <div class="cards">

        ${filtered.map(
          item => `
            <article class="homework-card">

              <span class="subject-pill">
                ${escapeHtml(
                  normalizeSubject(
                    item.subject
                  )
                )}
              </span>

              <h3>
                ${escapeHtml(
                  item.title
                )}
              </h3>

              <p>
                ${escapeHtml(
                  item.details
                )}
              </p>

            </article>
          `
        ).join("")}

      </div>

    </section>
  `;
}


/* =========================================================
   RESET
   ========================================================= */

els.reset.addEventListener(
  "click",
  () => {
    state.subject = "";
    state.selectedDate =
      TODAY_ISO;
    state.dateFilterActive = false;
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
