const data =
  Array.isArray(window.HOMEWORK_DATA)
    ? window.HOMEWORK_DATA
    : [];


const els = {
  list: document.querySelector("#homework-list"),
  empty: document.querySelector("#empty-state"),

  subject: document.querySelector("#subject-filter"),
  range: document.querySelector("#range-filter"),
  date: document.querySelector("#date-filter"),
  dateWrap: document.querySelector("#date-wrap"),

  count: document.querySelector("#result-count"),
  updated: document.querySelector("#updated-at"),

  clear: document.querySelector("#clear-filters"),
  theme: document.querySelector("#theme-toggle")
};


function parseDate(value) {
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


function toDateInputValue(date) {
  const year = date.getFullYear();

  const month =
    String(date.getMonth() + 1)
      .padStart(2, "0");

  const day =
    String(date.getDate())
      .padStart(2, "0");

  return `${year}-${month}-${day}`;
}


function formatDate(value) {

  const date = parseDate(value);

  return new Intl.DateTimeFormat(
    "zh-CN",
    {
      month: "long",
      day: "numeric",
      weekday: "short"
    }
  ).format(date);

}


function relativeDateLabel(value) {

  const date = parseDate(value);
  const today = startOfToday();

  const difference =
    Math.round(
      (date - today) / 86400000
    );

  if (difference === 0) {
    return "今天";
  }

  if (difference === 1) {
    return "明天";
  }

  if (difference === 2) {
    return "后天";
  }

  return "作业";
}


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


const subjects =
  [
    ...new Set(
      data.map(item => item.subject)
    )
  ].sort(
    (a, b) =>
      a.localeCompare(b, "zh-CN")
  );


subjects.forEach(subject => {

  const option =
    document.createElement("option");

  option.value = subject;
  option.textContent = subject;

  els.subject.appendChild(option);

});


els.date.value =
  toDateInputValue(
    startOfToday()
  );


function groupByDate(items) {

  return items.reduce(
    (map, item) => {

      if (!map.has(item.date)) {
        map.set(
          item.date,
          []
        );
      }

      map
        .get(item.date)
        .push(item);

      return map;

    },
    new Map()
  );

}


function render() {

  const subject =
    els.subject.value;

  const range =
    els.range.value;

  const selectedDate =
    els.date.value;

  const today =
    startOfToday();


  els.dateWrap.hidden =
    range !== "date";


  const filtered =
    data

      .filter(item => {

        if (!subject) {
          return true;
        }

        return (
          item.subject === subject
        );

      })

      .filter(item => {

        const itemDate =
          parseDate(item.date);


        if (range === "future") {

          return (
            itemDate >= today
          );

        }


        if (range === "date") {

          return (
            item.date ===
            selectedDate
          );

        }


        return true;

      })

      .sort(
        (a, b) => {

          const dateSort =
            a.date.localeCompare(
              b.date
            );

          if (dateSort !== 0) {
            return dateSort;
          }

          return (
            a.subject.localeCompare(
              b.subject,
              "zh-CN"
            )
          );

        }
      );


  els.list.innerHTML = "";


  els.empty.hidden =
    filtered.length !== 0;


  els.count.textContent =
    `${filtered.length} 项作业`;


  const groups =
    groupByDate(filtered);


  for (
    const [date, items]
    of groups
  ) {

    const section =
      document.createElement(
        "section"
      );

    section.className =
      "day-section";


    const heading =
      document.createElement(
        "div"
      );

    heading.className =
      "day-heading";


    const relative =
      relativeDateLabel(date);


    heading.innerHTML = `
      <div>
        <span class="day-relative">
          ${relative}
        </span>

        <h2>
          ${formatDate(date)}
        </h2>
      </div>

      <span class="day-count">
        ${items.length}
      </span>
    `;


    const cards =
      document.createElement(
        "div"
      );

    cards.className =
      "cards";


    items.forEach(item => {

      const card =
        document.createElement(
          "article"
        );

      card.className =
        "homework-card";


      card.innerHTML = `
        <div class="card-topline">
          <span class="subject-tag">
            ${escapeHtml(item.subject)}
          </span>
        </div>

        <h3>
          ${escapeHtml(item.title)}
        </h3>

        <p>${escapeHtml(item.details)}</p>
      `;


      cards.appendChild(card);

    });


    section.append(
      heading,
      cards
    );


    els.list.appendChild(
      section
    );

  }

}


function setTheme(theme) {

  document.documentElement
    .dataset
    .theme = theme;


  localStorage.setItem(
    "u22-theme",
    theme
  );


  if (theme === "dark") {

    els.theme.textContent =
      "☀︎";

    els.theme.setAttribute(
      "aria-label",
      "切换到浅色"
    );

  } else {

    els.theme.textContent =
      "☾";

    els.theme.setAttribute(
      "aria-label",
      "切换到深色"
    );

  }

}


const savedTheme =
  localStorage.getItem(
    "u22-theme"
  );


const systemDark =
  window.matchMedia(
    "(prefers-color-scheme: dark)"
  ).matches;


setTheme(
  savedTheme ||
  (
    systemDark
      ? "dark"
      : "light"
  )
);


els.theme.addEventListener(
  "click",
  () => {

    const current =
      document
        .documentElement
        .dataset
        .theme;

    setTheme(
      current === "dark"
        ? "light"
        : "dark"
    );

  }
);


els.subject.addEventListener(
  "change",
  render
);


els.range.addEventListener(
  "change",
  render
);


els.date.addEventListener(
  "change",
  render
);


els.clear.addEventListener(
  "click",
  () => {

    els.subject.value = "";
    els.range.value = "future";

    els.date.value =
      toDateInputValue(
        startOfToday()
      );

    render();

  }
);


const allDates =
  data
    .map(item => item.date)
    .sort();


const furthestDate =
  allDates.at(-1);


if (furthestDate) {

  els.updated.textContent =
    `最远至 ${furthestDate}`;

} else {

  els.updated.textContent =
    "暂无数据";

}


render();
