let columns = [];
let currentColumns = columns;

function normalizeUrl(url) {
  try {
    return url.replace(/^https?:\/\//, "").replace(/\/$/, "");
  } catch (e) {
    return url;
  }
}

chrome.bookmarks.getTree((items) => {
  const bookmarksBar = items[0].children.find((x) =>
    options.ROOT_FOLDER.test(x.title)
  );
  if (!bookmarksBar) {
    console.error(`Was expecting a folder called '${options.ROOT_FOLDER}'`);
    return;
  }
  const rootBookmarks = bookmarksBar.children.filter((node) => !node.children);
  const rootFolders = bookmarksBar.children.filter((node) => !!node.children);

  const rootColumn = { title: "/", children: [] };
  rootBookmarks.forEach((node) => addBookmark(rootColumn, node));
  columns.push(rootColumn);

  rootFolders.forEach((node) => {
    const column = { title: node.title, children: [] };
    visit(column, node);
    columns.push(column);
  });

  currentColumns = columns;
  render(currentColumns);
  generateFilterButtons(rootFolders);
  filterJobsOrMostVisited();
  updateCloseAllVisibility();
});

function refreshBookmarks() {
  columns.length = 0;
  chrome.bookmarks.getTree((items) => {
    const bookmarksBar = items[0].children.find((x) =>
      options.ROOT_FOLDER.test(x.title)
    );
    if (!bookmarksBar) return;
    const rootBookmarks = bookmarksBar.children.filter(
      (node) => !node.children
    );
    const rootFolders = bookmarksBar.children.filter((node) => !!node.children);

    const rootColumn = { title: "/", children: [] };
    rootBookmarks.forEach((node) => addBookmark(rootColumn, node));
    columns.push(rootColumn);

    rootFolders.forEach((node) => {
      const column = { title: node.title, children: [] };
      visit(column, node);
      columns.push(column);
    });

    currentColumns = columns;
    render(currentColumns);
    generateFilterButtons(rootFolders);
    updateCloseAllVisibility();
  });
}

const visit = (column, node, path = []) => {
  if (node.children) {
    node.children.forEach((x) => visit(column, x, [...path, node.title]));
    return;
  }
  addBookmark(column, node, path);
};

const addBookmark = (column, node, path = []) => {
  if (!node.url || node.url.startsWith("javascript:")) return;
  const isSeparator =
    options.SEPARATORS.includes(node.title) || node.type === "separator";
  column.children.push({
    title: node.title,
    url: node.url,
    path: path,
    isSeparator,
    dateAdded: node.dateAdded,
    id: node.id,
  });
};

function renderBookmark(bookmark) {
  let isNew = false;
  if (bookmark.dateAdded) {
    const now = Date.now();
    const oneMonth = 30 * 24 * 60 * 60 * 1000;
    isNew = now - bookmark.dateAdded < oneMonth;
  }

  return `<li class="bookmark-item" data-path="${
    bookmark.path ? bookmark.path.join(" / ") : ""
  }">
    <a href="${bookmark.url}" ${
    bookmark.title.endsWith("…") ? `title="${bookmark.title}"` : ""
  }>
      <img src="${
        bookmark.faviconUrl
      }" alt="" class="favicon" data-fallback="${getFaviconFallback(
    bookmark.url
  )}">
      ${bookmark.title}
      ${isNew ? '<span class="new-badge">NEW</span>' : ""}
    </a>
    <div class="url-container">
      <span class="url" title="${bookmark.url}">${getShortUrl(
    bookmark.url
  )}</span>
      <button class="copy-url-btn" data-url="${
        bookmark.url
      }" title="Copy URL">📋</button>
      <button class="delete-bookmark-btn" data-url="${
        bookmark.url
      }" title="Delete Bookmark">🗑️</button>
      <button class="edit-bookmark-btn" data-url="${
        bookmark.url
      }" data-title="${bookmark.title}" data-id="${
    bookmark.id
  }" title="Edit Bookmark">✏️</button>
    </div>
  </li>`;
}

function debounce(func, delay) {
  let timeout;
  return (...args) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), delay);
  };
}

const debouncedFilterBookmarks = debounce(filterBookmarks, 300);

document.addEventListener("DOMContentLoaded", () => {
  const welcomeElement = document.getElementById("welcome");
  if (welcomeElement) {
    const titleText = "Hello, Stitch";
    welcomeElement.innerHTML = titleText
      .split("")
      .map(
        (letter, i) =>
          `<span class="stitch-theme color${i % 8}">${letter}</span>`
      )
      .join("");
  }

  document.body.style.background = options.BACKGROUND;
  updateTimestamp();

  const searchInput = document.getElementById("search-input");
  if (searchInput) {
    searchInput.addEventListener("input", debouncedFilterBookmarks);
    searchInput.value = "";
  }

  // Button links
  const chatgptButton = document.getElementById("chatgpt-button");
  const redditButton = document.getElementById("reddit-button");
  const twitchButton = document.getElementById("twitch-button");

  if (chatgptButton)
    chatgptButton.addEventListener("click", () =>
      window.open("https://chat.openai.com/", "_blank")
    );
  if (redditButton)
    redditButton.addEventListener("click", () =>
      window.open("https://www.reddit.com/", "_blank")
    );
  if (twitchButton)
    twitchButton.addEventListener("click", () =>
      window.open("https://www.twitch.tv/", "_blank")
    );

  const youtubeButton = document.getElementById("youtube-button");
  if (youtubeButton) {
    youtubeButton.addEventListener("click", function () {
      const query = document.getElementById("search-input").value.trim();
      if (query) {
        window.open(
          `https://www.youtube.com/results?search_query=${encodeURIComponent(
            query
          )}`,
          "_blank"
        );
      } else {
        window.open("https://www.youtube.com", "_blank");
      }
    });
  }

  // Copy URL button
  document.body.addEventListener("click", function (e) {
    if (e.target.classList.contains("copy-url-btn")) {
      const url = e.target.getAttribute("data-url");
      navigator.clipboard.writeText(url).then(() => {
        e.target.textContent = "✔";
        setTimeout(() => {
          e.target.textContent = "📋";
        }, 1000);
      });
    }
  });

  // "Close All" collapsibles
  const closeAllBtn = document.getElementById("close-all-filters");
  if (closeAllBtn) {
    closeAllBtn.addEventListener("click", () => {
      document
        .querySelectorAll(".filter-buttons details[open]")
        .forEach((details) => {
          details.open = false;
        });
    });
  }

  // Go to Top button logic
  const goToTopBtn = document.getElementById("go-to-top");
  const container = document.getElementById("container");

  function updateGoToTopVisibility() {
    const windowScrolled = window.scrollY > 50;
    const containerScrolled = container && container.scrollTop > 50;
    if (windowScrolled || containerScrolled) {
      goToTopBtn.style.display = "block";
    } else {
      goToTopBtn.style.display = "none";
    }
  }

  window.addEventListener("scroll", updateGoToTopVisibility);
  if (container) {
    container.addEventListener("scroll", updateGoToTopVisibility);
  }

  goToTopBtn.addEventListener("click", () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
    if (container) {
      container.scrollTo({ top: 0, behavior: "smooth" });
    }
  });

  setTimeout(() => {
    document.querySelectorAll("img.favicon").forEach((img) => {
      img.onerror = function () {
        const faviconFinder = img.getAttribute("data-faviconfinder");
        const fallback = img.getAttribute("data-fallback");
        if (img.src !== faviconFinder && faviconFinder) {
          img.src = faviconFinder;
        } else if (img.src !== fallback && fallback) {
          img.src = fallback;
        }
      };
    });
  }, 0);
});

function updateTimestamp() {
  const now = new Date();
  const formattedDate = now.toLocaleDateString();
  const hours = now.getHours();
  const minutes = now.getMinutes().toString().padStart(2, "0");
  const seconds = now.getSeconds().toString().padStart(2, "0");
  const ampm = hours >= 12 ? "PM" : "AM";
  const formattedHours = (hours % 12 || 12).toString().padStart(2, "0");
  const day = now.toLocaleDateString("en-US", { weekday: "long" });

  document.getElementById("date").textContent = formattedDate;
  document.getElementById("hours").textContent = formattedHours;
  document.getElementById("minutes").textContent = minutes;
  document.getElementById("seconds").textContent = seconds;
  document.getElementById("ampm").textContent = ampm;
  document.getElementById("day").textContent = day;
}

setInterval(updateTimestamp, 1000);

if (window.browser) {
  window.browser.runtime.getBrowserInfo().then((browser) => {
    if (browser.name === "Firefox") {
      console.log(
        `Hello, Stitch. On ${browser.name} you can make this your home page by setting the following URL in your home page preferences:`
      );
      console.log(window.location.href);
    }
  });
}

function filterBookmarks() {
  const input = document.getElementById("search-input").value.toLowerCase();

  // Always filter from the full columns data
  const filteredColumns = columns
    .map((col) => ({
      ...col,
      children: col.children.filter((bm) => {
        const title = bm.title ? bm.title.toLowerCase() : "";
        return title.includes(input);
      }),
    }))
    .filter((col) => col.children.length > 0);

  currentColumns = filteredColumns;
  render(currentColumns);
}

function filterBy(category) {
  const cat = category.toLowerCase();

  // Always filter from the full columns data
  const filteredColumns = columns
    .map((col) => ({
      ...col,
      children: col.children.filter((bm) => {
        const path = (bm.path || []).map((s) => s.toLowerCase());
        return path.includes(cat);
      }),
    }))
    .filter((col) => col.children.length > 0);

  currentColumns = filteredColumns;
  render(currentColumns);
}

function filterMostVisited() {
  const historyAPI =
    typeof browser !== "undefined" ? browser.history : chrome.history;

  if (historyAPI) {
    historyAPI.search({ text: "", maxResults: 100 }, (results) => {
      const mostVisitedUrls = results.map((result) => normalizeUrl(result.url));
      currentColumns = columns
        .map((col) => ({
          ...col,
          children: col.children.filter((bm) =>
            mostVisitedUrls.includes(normalizeUrl(bm.url))
          ),
        }))
        .filter((col) => col.children.length > 0);

      render(currentColumns);
    });
  } else {
    resetFilters();
  }

  // Remove the jobs-hours-active class
  document.body.classList.remove("jobs-hours-active");
}

function isESTJobsTime() {
  // Get current time in EST/EDT (New York time)
  const now = new Date();
  const estNow = new Date(
    now.toLocaleString("en-US", { timeZone: "America/New_York" })
  );
  const hours = estNow.getHours();
  return hours >= 8 && hours < 16; // 8am <= hour < 4pm
}

// List of US federal holidays (month is 0-based, day is 1-based)
function getUSHolidays(year) {
  // Fixed-date holidays
  const holidays = [
    new Date(year, 0, 1), // New Year's Day
    new Date(year, 6, 4), // Independence Day
    new Date(year, 10, 11), // Veterans Day
    new Date(year, 11, 25), // Christmas Day
  ];

  // Helper for "nth weekday of month"
  function nthWeekdayOfMonth(n, weekday, month) {
    const first = new Date(year, month, 1);
    let day = 1 + ((7 + weekday - first.getDay()) % 7) + (n - 1) * 7;
    return new Date(year, month, day);
  }
  // Helper for "last weekday of month"
  function lastWeekdayOfMonth(weekday, month) {
    const last = new Date(year, month + 1, 0);
    let day = last.getDate() - ((7 + last.getDay() - weekday) % 7);
    return new Date(year, month, day);
  }

  // Variable-date holidays
  holidays.push(nthWeekdayOfMonth(3, 1, 0)); // MLK Day: 3rd Monday in Jan
  holidays.push(nthWeekdayOfMonth(3, 1, 1)); // Presidents Day: 3rd Monday in Feb
  holidays.push(lastWeekdayOfMonth(1, 4)); // Memorial Day: last Monday in May
  holidays.push(nthWeekdayOfMonth(1, 1, 8)); // Labor Day: 1st Monday in Sep
  holidays.push(nthWeekdayOfMonth(2, 1, 9)); // Columbus Day: 2nd Monday in Oct
  holidays.push(nthWeekdayOfMonth(4, 4, 10)); // Thanksgiving: 4th Thursday in Nov

  // If a fixed-date holiday falls on a weekend, observed on closest weekday
  return holidays.map((date) => {
    if (date.getDay() === 0) {
      // Sunday
      date.setDate(date.getDate() + 1);
    } else if (date.getDay() === 6) {
      // Saturday
      date.setDate(date.getDate() - 1);
    }
    return date;
  });
}

function isUSHoliday(date) {
  const year = date.getFullYear();
  const holidays = getUSHolidays(year);
  return holidays.some(
    (holiday) =>
      holiday.getFullYear() === date.getFullYear() &&
      holiday.getMonth() === date.getMonth() &&
      holiday.getDate() === date.getDate()
  );
}

function isUSWorkdayEST() {
  // Get current date in EST
  const now = new Date();
  const estNow = new Date(
    now.toLocaleString("en-US", { timeZone: "America/New_York" })
  );
  const day = estNow.getDay(); // 0=Sun, 1=Mon, ..., 6=Sat
  if (day === 0 || day === 6) return false; // Weekend
  if (isUSHoliday(estNow)) return false; // US holiday
  return true;
}

function isESTJobsTimeAndWorkday() {
  // Get current time in EST/EDT (New York time)
  const now = new Date();
  const estNow = new Date(
    now.toLocaleString("en-US", { timeZone: "America/New_York" })
  );
  const hours = estNow.getHours();
  return hours >= 8 && hours < 16 && isUSWorkdayEST(); // 8am–4pm, workday
}

function filterJobsOnly() {
  // Find all columns/folders with "jobs" in the title
  const jobsColumns = columns.filter((col) =>
    col.title.toLowerCase().includes("jobs")
  );

  let newColumns = [];

  jobsColumns.forEach((jobsCol) => {
    // Map: subfolder path (after "Jobs") => bookmarks
    const subfolderMap = {};

    jobsCol.children.forEach((bm) => {
      // Find the index of "Jobs" in the path
      const jobsIndex = (bm.path || []).findIndex((p) =>
        p.toLowerCase().includes("jobs")
      );
      // Get the subfolder path after "Jobs"
      let subfolderPath = "";
      if (jobsIndex !== -1 && bm.path && bm.path.length > jobsIndex + 1) {
        subfolderPath = bm.path.slice(jobsIndex + 1).join(" / ");
      }
      // If no subfolder, group under "Jobs"
      const key = subfolderPath || jobsCol.title;
      if (!subfolderMap[key]) subfolderMap[key] = [];
      subfolderMap[key].push(bm);
    });

    // Each unique subfolder path becomes its own column
    Object.entries(subfolderMap).forEach(([subfolder, bookmarks]) => {
      newColumns.push({
        title: subfolder,
        children: bookmarks,
      });
    });
  });

  currentColumns = newColumns;
  render(currentColumns);

  // Add the jobs-hours-active class
  document.body.classList.add("jobs-hours-active");
}

function filterJobsOrMostVisited() {
  if (isESTJobsTimeAndWorkday()) {
    filterJobsOnly();
  } else {
    filterMostVisited();
  }
}

function hideEmptySections() {
  const columns = document.querySelectorAll(".dynamic-column, .column");
  columns.forEach((column) => {
    const visibleBookmarks = Array.from(
      column.querySelectorAll(".bookmark-item:not(.separator)")
    ).filter((bookmark) => bookmark.style.display !== "none");

    const hasVisibleBookmarks = visibleBookmarks.length > 0;
    column.style.display = hasVisibleBookmarks ? "" : "none";

    const title =
      column.querySelector(".folder-name, .column-summary")?.textContent ||
      "(no title)";
    console.log(
      `Column "${title}" is ${hasVisibleBookmarks ? "visible" : "hidden"}`
    );
    console.log(
      `Column: ${title} | Visible bookmarks:`,
      visibleBookmarks.map((item) => {
        const link = item.querySelector("a");
        return link
          ? link.textContent.trim() + " (" + link.href + ")"
          : "(no link)";
      })
    );
  });
  updateContainerClass();
}

function generateFilterButtons(folders) {
  const filterButtonsContainer = document.querySelector(".filter-buttons");
  filterButtonsContainer.innerHTML = "";

  function renderFolder(folder) {
    if (folder.children && folder.children.length) {
      const details = document.createElement("details");
      const summary = document.createElement("summary");
      summary.textContent = folder.title;
      summary.className = "filter-folder-summary";
      details.appendChild(summary);

      folder.children
        .filter((child) => child.children && child.children.length)
        .forEach((child) => {
          details.appendChild(renderFolder(child));
        });

      const button = document.createElement("button");
      button.className = "filter-button";
      button.textContent = `Show "${folder.title}"`;
      button.addEventListener("click", () => {
        filterBy(folder.title.toLowerCase());
        updateCloseAllVisibility();
      });
      details.appendChild(button);

      return details;
    }
    return null;
  }

  folders.forEach((folder) => {
    const rendered = renderFolder(folder);
    if (rendered) filterButtonsContainer.appendChild(rendered);
  });

  const resetButton = document.createElement("button");
  resetButton.className = "filter-button";
  resetButton.textContent = "Reset";
  resetButton.addEventListener("click", () => {
    resetFilters();
    updateCloseAllVisibility();
  });

  const closeAllBtn = document.createElement("button");
  closeAllBtn.className = "filter-button close-all-btn";
  closeAllBtn.id = "close-all-btn";
  closeAllBtn.textContent = "Close All";
  closeAllBtn.title = "Collapse all folders";
  closeAllBtn.addEventListener("click", () => {
    document
      .querySelectorAll(".filter-buttons details[open]")
      .forEach((details) => {
        details.open = false;
      });
    updateCloseAllVisibility();
  });

  const mostVisitedButton = document.createElement("button");
  mostVisitedButton.className = "filter-button";
  mostVisitedButton.id = "filter-most-visited";
  mostVisitedButton.textContent = "Most Visited";
  mostVisitedButton.addEventListener("click", () => {
    filterMostVisited();
    updateCloseAllVisibility();
  });

  const jobsHoursButton = document.createElement("button");
  jobsHoursButton.className = "filter-button";
  jobsHoursButton.id = "filter-jobs-hours";
  jobsHoursButton.textContent = "Jobs Hours";
  jobsHoursButton.addEventListener("click", () => {
    filterJobsOrMostVisited();
    updateCloseAllVisibility();
  });

  filterButtonsContainer.appendChild(jobsHoursButton);
  filterButtonsContainer.appendChild(mostVisitedButton);
  filterButtonsContainer.appendChild(resetButton);
  filterButtonsContainer.appendChild(closeAllBtn);

  updateCloseAllVisibility();
}

function resetFilters() {
  // Reset to the full, original columns data
  currentColumns = columns;
  render(currentColumns);

  const searchInput = document.getElementById("search-input");
  if (searchInput) searchInput.value = "";

  // Collapse all filter categories (the filter-buttons section)
  document
    .querySelectorAll(".filter-buttons details[open]")
    .forEach((details) => {
      details.open = false;
    });

  hideEmptySections();
  updateCloseAllVisibility();

  document.body.classList.remove("jobs-hours-active");
}

function openInNewTab(url) {
  const newTab = window.open(url, "_blank");
  if (newTab) {
    newTab.focus();
  } else {
    console.error(
      "Failed to open the link. Please check your browser settings."
    );
  }
}

function updateContainerClass() {
  const container = document.getElementById("container");
  const visibleColumns = Array.from(
    container.querySelectorAll(".dynamic-column")
  ).filter((col) => col.offsetParent !== null);

  container.classList.remove("single-folder", "two-folders");
  if (visibleColumns.length === 1) {
    container.classList.add("single-folder");
  } else if (visibleColumns.length === 2) {
    container.classList.add("two-folders");
  }
}

function updateCloseAllVisibility() {
  const closeAllBtn = document.getElementById("close-all-btn");
  if (!closeAllBtn) return;
  const anyOpen = document.querySelector(".filter-buttons details[open]");
  closeAllBtn.style.display = anyOpen ? "inline-block" : "none";
}

document.addEventListener("click", (e) => {
  if (
    e.target.tagName === "SUMMARY" &&
    e.target.closest(".filter-buttons details")
  ) {
    setTimeout(updateCloseAllVisibility, 10);
  }
});

document.addEventListener("click", function (e) {
  const btn = e.target.closest(".delete-bookmark-btn");
  if (!btn) return;

  e.preventDefault();
  const url = btn.getAttribute("data-url");
  if (confirm("Are you sure you want to delete this bookmark?")) {
    if (window.chrome && chrome.bookmarks) {
      chrome.bookmarks.search({ url }, (results) => {
        let pending = results.length;
        if (pending === 0) refreshBookmarks();
        results.forEach((bm) => {
          chrome.bookmarks.remove(bm.id, () => {
            pending--;
            if (pending === 0) refreshBookmarks();
          });
        });
      });
    } else if (window.browser && browser.bookmarks) {
      browser.bookmarks.search({ url }).then((results) => {
        Promise.all(results.map((bm) => browser.bookmarks.remove(bm.id))).then(
          () => {
            refreshBookmarks();
          }
        );
      });
    } else {
      alert("Bookmark deletion is not supported in this environment.");
    }
  }
});

function renderCurrent() {
  render(currentColumns);
}
