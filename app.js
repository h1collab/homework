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

const SUBJECT_CARRY_WEIGHT =
  window.SUBJECT_CARRY_WEIGHT || {};

const SUBJECT_CARRY_NOTE =
  window.SUBJECT_CARRY_NOTE || {};

const BAG_ESTIMATE_META =
  window.BAG_ESTIMATE_META || {
    baseKg: 0.9
  };


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

  // "upcoming" = tutti i compiti da oggi in poi.
  // "date" = solo il giorno scelto.
  dateMode: "upcoming",

  weekOffset: 0,

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

  bag:
    document.querySelector("#bag-area"),

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
      (
        state.dateMode === "upcoming" &&
        iso === TODAY_ISO
      ) ||
      (
        state.dateMode === "date" &&
        state.selectedDate === iso
      )
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
        state.selectedDate = iso;
        state.dateMode = "date";

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

    state.selectedDate =
      toIsoDate(
        getWeekStart()
      );

    state.dateMode =
      "date";

    buildDateStrip();
    render();
  }
);


els.dateNext.addEventListener(
  "click",
  () => {
    state.weekOffset += 1;

    state.selectedDate =
      toIsoDate(
        getWeekStart()
      );

    state.dateMode =
      "date";

    buildDateStrip();
    render();
  }
);


/* =========================================================
   COSA PORTARE - STESSA DATA DEI COMPITI
   ========================================================= */

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
      state.selectedDate
    );

  const weekday =
    selectedDate.getDay();

  const timetableDay =
    TIMETABLE[weekday];

  const isToday =
    state.selectedDate ===
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
          .slice(0, 5)
          .map(
            subject => `
              <span>
                ${escapeHtml(subject)}
              </span>
            `
          )
          .join("")}

        ${
          unique.length > 5
            ? `<span>+${unique.length - 5}</span>`
            : ""
        }
      </div>
    `;
  } else {
    collapsedSummary = `
      <div class="carry-preview">
        <span>
          Nessuna lezione prevista
        </span>
      </div>
    `;
  }


  let details = "";

  if (state.carryOpen) {
    if (!timetableDay) {
      details = `
        <div class="carry-details">
          <div class="carry-empty">
            Nessuna lezione prevista per questa data.
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
      class="carry-card carry-card-unified"
      id="carry-card"
    >

      <button
        type="button"
        class="carry-center carry-center-unified"
        id="carry-toggle"
        aria-expanded="${state.carryOpen}"
      >

        <div class="carry-kicker">
          COSA PORTARE · DATA SELEZIONATA
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
            aria-hidden="true"
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
              state.selectedDate
            )
          )}
        </div>

        ${
          !state.carryOpen
            ? collapsedSummary
            : ""
        }

      </button>

      ${details}

    </section>
  `;


  const toggle =
    document.querySelector(
      "#carry-toggle"
    );

  toggle?.addEventListener(
    "click",
    () => {
      state.carryOpen =
        !state.carryOpen;

      renderSchedule();
    }
  );
}


/* =========================================================
   ZAINO
   ========================================================= */

function bagLevel(weight) {
  if (weight <= 4) {
    return {
      key: "light",
      label: "Leggero"
    };
  }

  if (weight <= 4.8) {
    return {
      key: "medium",
      label: "Medio"
    };
  }

  return {
    key: "heavy",
    label: "Pesante"
  };
}


function bagWeightForDate(value) {
  const date =
    parseIsoDate(value);

  const day =
    date.getDay();

  const timetableDay =
    TIMETABLE[day];

  if (!timetableDay) {
    return {
      kg: 0,
      subjects: []
    };
  }

  const subjects =
    [...new Set(
      timetableDay.lessons
        .map(normalizeSubject)
        .filter(Boolean)
        .filter(
          subject =>
            subject !== "Prolungamento"
        )
    )];

  const kg =
    subjects.reduce(
      (total, subject) =>
        total +
        (
          SUBJECT_CARRY_WEIGHT[
            subject
          ] || 0
        ),
      BAG_ESTIMATE_META.baseKg || 0.9
    );

  return {
    kg,
    subjects
  };
}


function renderBagSummary(
  animate = true
) {
  if (!els.bag) {
    return;
  }

  const data =
    bagWeightForDate(
      state.selectedDate
    );

  if (!data.subjects.length) {
    els.bag.innerHTML = "";
    els.bag.hidden = true;
    return;
  }

  els.bag.hidden = false;

  const level =
    bagLevel(data.kg);

  const fillPercent =
    Math.max(
      14,
      Math.min(
        94,
        Math.round(
          (data.kg / 6) * 100
        )
      )
    );

  const innerTop = 31;
  const innerBottom = 96;
  const innerHeight =
    innerBottom - innerTop;

  const fillHeight =
    Math.max(
      8,
      innerHeight *
      (fillPercent / 100)
    );

  const fillY =
    innerBottom -
    fillHeight;

  const hasCarryNote =
    data.subjects.some(
      subject =>
        SUBJECT_CARRY_NOTE[
          subject
        ]
    );

  const animationClass =
    animate
      ? "is-filling"
      : "";

  els.bag.innerHTML = `
    <a
      class="bag-card bag-${level.key} ${animationClass}"
      href="./book/"
      style="--bag-meter:${fillPercent}%"
      aria-label="Apri libri e stima dello zaino"
    >

      <div
        class="bag-scale"
        aria-hidden="true"
      >
        <div class="bag-scale-caption">
          0
        </div>

        <div class="bag-scale-track">
          <span class="bag-scale-tick"></span>
          <span class="bag-scale-tick"></span>
          <span class="bag-scale-tick"></span>
          <span class="bag-scale-tick"></span>
          <span class="bag-scale-tick"></span>
          <span class="bag-scale-tick"></span>
          <span class="bag-scale-tick"></span>

          <span class="bag-scale-progress"></span>
          <span class="bag-scale-marker"></span>
        </div>

        <div class="bag-scale-caption">
          6 kg
        </div>
      </div>


      <div class="bag-visual">

        <svg
          class="bag-svg"
          viewBox="0 0 110 126"
          role="img"
          aria-label="Indicatore grafico del peso dello zaino"
        >
          <defs>
            <clipPath id="bag-body-clip">
              <path
                d="M31 35
                   C31 26 38 19 47 19
                   H63
                   C72 19 79 26 79 35
                   V38
                   H82
                   C91 38 98 45 98 54
                   V101
                   C98 111 90 119 80 119
                   H30
                   C20 119 12 111 12 101
                   V54
                   C12 45 19 38 28 38
                   H31
                   Z"
              />
            </clipPath>
          </defs>

          <path
            class="bag-empty"
            d="M31 35
               C31 26 38 19 47 19
               H63
               C72 19 79 26 79 35
               V38
               H82
               C91 38 98 45 98 54
               V101
               C98 111 90 119 80 119
               H30
               C20 119 12 111 12 101
               V54
               C12 45 19 38 28 38
               H31
               Z"
          />

          <rect
            class="bag-fill"
            x="12"
            y="${fillY.toFixed(2)}"
            width="86"
            height="${fillHeight.toFixed(2)}"
            clip-path="url(#bag-body-clip)"
          />

          <path
            class="bag-outline"
            d="M31 35
               C31 26 38 19 47 19
               H63
               C72 19 79 26 79 35
               V38
               H82
               C91 38 98 45 98 54
               V101
               C98 111 90 119 80 119
               H30
               C20 119 12 111 12 101
               V54
               C12 45 19 38 28 38
               H31
               Z"
          />

          <path
            class="bag-outline bag-handle"
            d="M42 38
               V32
               C42 28 45 25 49 25
               H61
               C65 25 68 28 68 32
               V38"
          />

          <path
            class="bag-outline bag-pocket-line"
            d="M31 72
               H79
               V92
               C79 97 75 101 70 101
               H40
               C35 101 31 97 31 92
               Z"
          />

          <path
            class="bag-outline bag-pocket-line"
            d="M47 72
               V67
               C47 64 49 62 52 62
               H58
               C61 62 63 64 63 67
               V72"
          />
        </svg>

      </div>


      <div class="bag-content">

        <div class="bag-kicker">
          ZAINO · STIMA
        </div>

        <div class="bag-title-row">

          <h2>
            ${data.kg.toFixed(1)} kg
          </h2>

          <span class="bag-level">
            ${level.label}
          </span>

        </div>

        <p>
          ${data.subjects.join(" · ")}
        </p>

        ${
          hasCarryNote
            ? `
              <div class="bag-hint">
                Calcolato sul materiale da portare,
                non sul set completo.
              </div>
            `
            : ""
        }

      </div>


      <div class="bag-link-arrow">
        <svg
          viewBox="0 0 20 20"
          aria-hidden="true"
        >
          <path
            d="M5 10h9M11 6l4 4-4 4"
            fill="none"
            stroke="currentColor"
            stroke-width="1.5"
            stroke-linecap="round"
            stroke-linejoin="round"
          />
        </svg>
      </div>

    </a>
  `;
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
        const completed =
          notice.completed === true ||
          notice.date < TODAY_ISO;

        const urgent =
          notice.type === "urgent";

        const noticeClass =
          completed
            ? "notice-past"
            : (
                urgent
                  ? "notice-urgent"
                  : "notice-warning"
              );

        return `
          <article class="notice-card ${noticeClass}">

            <div class="notice-icon">
              ${completed ? "✓" : "!"}
            </div>

            <div class="notice-content">

              <div class="notice-heading">

                <h3 class="notice-title">
                  ${escapeHtml(
                    notice.title
                  )}
                </h3>

                ${
                  completed
                    ? `
                      <span class="notice-status">
                        Concluso
                      </span>
                    `
                    : ""
                }

              </div>

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
      if (state.dateMode === "date") {
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

        return normalizeSubject(
          a.subject
        ).localeCompare(
          normalizeSubject(
            b.subject
          ),
          "it-IT"
        );
      }
    );
}


function render() {
  renderSchedule();
  renderBagSummary(true);
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
    state.dateMode === "date"
      ? formatLongDate(
          state.selectedDate
        )
      : "Da oggi in poi";

  els.updated.textContent =
    state.dateMode === "date"
      ? (
          state.selectedDate === TODAY_ISO
            ? "Oggi"
            : formatLongDate(
                state.selectedDate
              )
        )
      : "Prossimi compiti";

  if (filtered.length === 0) {
    els.list.innerHTML = "";
    els.empty.hidden = false;
    return;
  }

  els.empty.hidden = true;

  const groups =
    new Map();

  filtered.forEach(item => {
    if (!groups.has(item.date)) {
      groups.set(
        item.date,
        []
      );
    }

    groups
      .get(item.date)
      .push(item);
  });

  els.list.innerHTML =
    [...groups.entries()]
      .map(([date, items]) => `
        <section class="homework-day">

          <header class="homework-day-header">

            <div class="homework-day-title">

              <div class="homework-day-kicker">
                ${relativeLabel(date)}
              </div>

              <h2>
                ${formatLongDate(date)}
              </h2>

            </div>

            <span class="homework-day-count">
              <strong>${items.length}</strong>
              ${items.length === 1 ? "compito" : "compiti"}
            </span>

          </header>

          <div class="homework-items">

            ${items.map(
              (item, index) => {
                const subject =
                  normalizeSubject(
                    item.subject
                  );

                return `
                  <article
                    class="homework-item"
                    style="--homework-delay:${index * 55}ms"
                  >

                    <div
                      class="homework-item-accent"
                      aria-hidden="true"
                    ></div>

                    <div class="homework-item-content">

                      <div class="homework-item-meta">

                        <span class="homework-subject">
                          ${escapeHtml(subject)}
                        </span>

                        <span class="homework-item-label">
                          COMPITO
                        </span>

                      </div>

                      <div class="homework-item-heading">

                        <h3>
                          ${escapeHtml(
                            item.title
                          )}
                        </h3>

                        <span
                          class="homework-item-index"
                          aria-hidden="true"
                        >
                          ${String(index + 1).padStart(2, "0")}
                        </span>

                      </div>

                      <p>
                        ${escapeHtml(
                          item.details
                        )}
                      </p>

                      ${
                        item.href
                          ? `
                            <a
                              class="homework-action"
                              href="${escapeHtml(item.href)}"
                            >
                              <span>
                                ${escapeHtml(
                                  item.actionLabel ||
                                  "Apri"
                                )}
                              </span>

                              <svg
                                viewBox="0 0 20 20"
                                aria-hidden="true"
                              >
                                <path
                                  d="M5 10h9M11 6l4 4-4 4"
                                  fill="none"
                                  stroke="currentColor"
                                  stroke-width="1.5"
                                  stroke-linecap="round"
                                  stroke-linejoin="round"
                                />
                              </svg>
                            </a>
                          `
                          : ""
                      }

                    </div>

                  </article>
                `;
              }
            ).join("")}

          </div>

        </section>
      `)
      .join("");
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
    state.dateMode = "upcoming";
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
