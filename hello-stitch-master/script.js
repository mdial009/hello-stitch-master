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
  autoApplyWorkMode();
  updateCloseAllVisibility();
  updateWorkModeButton();
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
    updateWorkModeButton();
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

  autoApplyWorkMode();
  updateWorkModeButton();
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

  const workModeButton = document.createElement("button");
  workModeButton.className = "filter-button";
  workModeButton.id = "filter-work-mode";
  workModeButton.textContent = "Work Mode: OFF";
  workModeButton.addEventListener("click", toggleWorkMode);

  const configureWorkModeButton = document.createElement("button");
  configureWorkModeButton.className = "filter-button";
  configureWorkModeButton.id = "configure-work-mode";
  configureWorkModeButton.textContent = "Configure Work Mode";
  configureWorkModeButton.addEventListener("click", openWorkModeModal);

  filterButtonsContainer.appendChild(workModeButton);
  filterButtonsContainer.appendChild(configureWorkModeButton);
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

const WORK_MODE_KEY = "workModeFolders";

// Open modal with all folders as checkboxes
function openWorkModeModal() {
  const modal = document.getElementById("workmode-modal");
  const folderList = document.getElementById("workmode-folder-list");
  folderList.innerHTML = "";

  // Get all folders (top-level and subfolders)
  const allFolders = [];
  columns.forEach((col) => {
    if (col.title !== "/") {
      allFolders.push({ title: col.title, path: col.title });
    }
    col.children.forEach((bm) => {
      if (bm.path && bm.path.length > 0) {
        const subPath = bm.path.join(" / ");
        if (!allFolders.some((f) => f.path === subPath)) {
          allFolders.push({
            title: bm.path[bm.path.length - 1],
            path: subPath,
          });
        }
      }
    });
  });

  // Remove duplicates
  const uniqueFolders = Array.from(new Set(allFolders.map((f) => f.path))).map(
    (path) => allFolders.find((f) => f.path === path)
  );

  // Load saved selection
  const saved = JSON.parse(localStorage.getItem(WORK_MODE_KEY) || "[]");

  // --- Add Select All checkbox ---
  const selectAllLabel = document.createElement("label");
  selectAllLabel.style.display = "flex";
  selectAllLabel.style.alignItems = "center";
  selectAllLabel.style.gap = "0.5em";
  selectAllLabel.style.fontWeight = "bold";
  const selectAllCheckbox = document.createElement("input");
  selectAllCheckbox.type = "checkbox";
  selectAllCheckbox.id = "workmode-select-all";
  selectAllLabel.appendChild(selectAllCheckbox);
  selectAllLabel.appendChild(document.createTextNode("Select All"));
  folderList.appendChild(selectAllLabel);

  // --- Folder checkboxes ---
  uniqueFolders.forEach((folder) => {
    const id = "workmode-folder-" + btoa(folder.path).replace(/=/g, "");
    const label = document.createElement("label");
    label.style.display = "flex";
    label.style.alignItems = "center";
    label.style.gap = "0.5em";
    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.value = folder.path;
    checkbox.id = id;
    if (saved.includes(folder.path)) checkbox.checked = true;
    label.appendChild(checkbox);
    label.appendChild(document.createTextNode(folder.path));
    folderList.appendChild(label);
  });

  // --- Select All logic ---
  const allFolderCheckboxes = () =>
    Array.from(
      folderList.querySelectorAll(
        'input[type="checkbox"]:not(#workmode-select-all)'
      )
    );

  // Set Select All state based on current selection
  function updateSelectAllState() {
    const boxes = allFolderCheckboxes();
    selectAllCheckbox.checked = boxes.every((cb) => cb.checked);
    selectAllCheckbox.indeterminate =
      !selectAllCheckbox.checked && boxes.some((cb) => cb.checked);
  }
  updateSelectAllState();

  // When Select All is toggled, check/uncheck all
  selectAllCheckbox.addEventListener("change", () => {
    allFolderCheckboxes().forEach((cb) => {
      cb.checked = selectAllCheckbox.checked;
    });
  });

  // When any folder checkbox changes, update Select All state
  folderList.addEventListener("change", (e) => {
    if (e.target !== selectAllCheckbox) updateSelectAllState();
  });

  modal.classList.add("active");
  modal.style.display = "flex";

  document.getElementById("workmode-cancel").onclick = () => {
    modal.classList.remove("active");
    modal.style.display = "none";
  };

  document.getElementById("workmode-form").onsubmit = (e) => {
    e.preventDefault();
    const checked = allFolderCheckboxes()
      .filter((cb) => cb.checked)
      .map((cb) => cb.value);
    localStorage.setItem(WORK_MODE_KEY, JSON.stringify(checked));
    modal.classList.remove("active");
    modal.style.display = "none";
    applyWorkModeFilter();
  };
}

// Filter columns to only show selected folders/paths
function applyWorkModeFilter() {
  const selected = JSON.parse(localStorage.getItem(WORK_MODE_KEY) || "[]");
  if (!selected.length) {
    // If nothing selected, show all
    currentColumns = columns;
    render(currentColumns);
    document.body.classList.remove("jobs-hours-active");
    return;
  }

  // Each selected path becomes its own column, containing all bookmarks with that path
  const newColumns = selected.map((selPath) => {
    // Find all bookmarks matching this path
    let bookmarks = [];
    columns.forEach((col) => {
      // If the column itself matches
      if (col.title === selPath) {
        bookmarks = bookmarks.concat(col.children);
      } else {
        // Otherwise, find bookmarks with matching path
        bookmarks = bookmarks.concat(
          col.children.filter((bm) => (bm.path || []).join(" / ") === selPath)
        );
      }
    });
    return {
      title: selPath,
      children: bookmarks,
    };
  });

  currentColumns = newColumns;
  render(currentColumns);
  document.body.classList.add("jobs-hours-active");
}

// Auto-apply Work Mode during work hours (8am–6pm EST, US workdays)
function isWorkModeTime() {
  const now = new Date();
  const estNow = new Date(
    now.toLocaleString("en-US", { timeZone: "America/New_York" })
  );
  const hours = estNow.getHours();
  const day = estNow.getDay();
  if (day === 0 || day === 6) return false; // Weekend
  return hours >= 8 && hours < 18;
}

// Call this after bookmarks are loaded or refreshed:
function autoApplyWorkMode() {
  const workModeFolders = JSON.parse(
    localStorage.getItem(WORK_MODE_KEY) || "[]"
  );
  const workModeEnabled = JSON.parse(
    localStorage.getItem("workModeEnabled") || "false"
  );
  if (workModeEnabled && workModeFolders.length) {
    applyWorkModeFilter();
  } else if (isESTJobsTimeAndWorkday()) {
    filterJobsOnly();
  } else {
    currentColumns = columns;
    render(currentColumns);
    document.body.classList.remove("jobs-hours-active");
  }
}

function updateWorkModeButton() {
  const btn = document.getElementById("filter-work-mode");
  const enabled = JSON.parse(
    localStorage.getItem("workModeEnabled") || "false"
  );
  if (btn) btn.textContent = enabled ? "Work Mode: ON" : "Work Mode: OFF";
}

function toggleWorkMode() {
  const enabled = JSON.parse(
    localStorage.getItem("workModeEnabled") || "false"
  );
  localStorage.setItem("workModeEnabled", !enabled);
  updateWorkModeButton();
  autoApplyWorkMode();
}
