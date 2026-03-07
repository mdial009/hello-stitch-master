const columns = [];
let currentColumns = columns;
const selectedBookmarks = new Set();
window.selectedBookmarks = selectedBookmarks; // Expose for render.js access
let bookmarkVisitCounts = {};
const SORT_PREFERENCE_KEY = "bookmarkSortPreference";
const PINS_KEY = "pinnedBookmarks";
const TAGS_KEY = "bookmarkTags";
const pinnedSet = new Set(JSON.parse(localStorage.getItem(PINS_KEY) || "[]"));
let isShowingPins = false;
const tagsByUrl = JSON.parse(localStorage.getItem(TAGS_KEY) || "{}");
window.tagsByUrl = tagsByUrl;

function saveTags() {
  localStorage.setItem(TAGS_KEY, JSON.stringify(tagsByUrl));
}

function autoTagBookmark(bm) {
  try {
    const titleWords = (bm.title || "").toLowerCase().split(/\W+/);
    const urlWords = normalizeUrl(bm.url).toLowerCase().split(/\W+/);
    const candidates = [...titleWords, ...urlWords].filter(Boolean);
    const unique = Array.from(new Set(candidates));
    tagsByUrl[bm.url] = unique.slice(0, 2);
  } catch (e) {}
}

function autoTagAll() {
  columns.forEach((col) => {
    col.children.forEach((bm) => {
      if (!tagsByUrl[bm.url]) autoTagBookmark(bm);
    });
  });
  saveTags();
}

function updateDuplicates() {
  const counts = {};
  columns.forEach((col) =>
    col.children.forEach((bm) => {
      const norm = normalizeUrl(bm.url);
      counts[norm] = (counts[norm] || 0) + 1;
    })
  );
  columns.forEach((col) =>
    col.children.forEach((bm) => {
      bm.isDuplicate = counts[normalizeUrl(bm.url)] > 1;
    })
  );
}

chrome.bookmarks.getTree((items) => {
  // Hide loading indicator and show main content
  const loadingIndicator = document.getElementById("loading-indicator");
  if (loadingIndicator) {
    loadingIndicator.classList.add("hidden");
  }
  
  // Show main content after bookmarks are loaded
  const header = document.getElementById("header");
  const searchContainer = document.getElementById("search-container");
  const container = document.getElementById("container");
  const goToTop = document.getElementById("go-to-top");
  
  if (header) header.classList.add("loaded");
  if (searchContainer) searchContainer.classList.add("loaded");
  if (container) container.classList.add("loaded");
  if (goToTop) goToTop.classList.add("loaded");
  
  // Get the bookmarks bar directly - no longer requires "Stitch" folder
  const bookmarksBar = items[0];
  
  if (!bookmarksBar || !bookmarksBar.children) {
    console.error("No bookmarks found");
    return;
  }
  
  const rootBookmarks = bookmarksBar.children.filter((node) => !node.children);
  const rootFolders = bookmarksBar.children.filter((node) => !!node.children);

  // Create root column for bookmarks at the top level
  const rootColumn = { title: "/", id: bookmarksBar.id, children: [] };
  rootBookmarks.forEach((node) => addBookmark(rootColumn, node));
  if (rootColumn.children.length > 0) {
    columns.push(rootColumn);
  }

  // Process each folder as a column
  rootFolders.forEach((node) => {
    const column = { title: node.title, id: node.id, children: [] };
    visit(column, node);
    columns.push(column);
  });

  // If no columns were created, try to get bookmarks from other folders
  if (columns.length === 0) {
    const allFolders = items[0].children.filter((n) => !!n.children);
    allFolders.forEach((node) => {
      const column = { title: node.title, id: node.id, children: [] };
      visit(column, node);
      if (column.children.length > 0) {
        columns.push(column);
      }
    });
  }

  currentColumns = columns;
  updateVisitCounts();
  updateDuplicates();
  autoTagAll();
  renderCurrent();
  generateFilterButtons(rootFolders);
  updateSortButton();
  autoApplyWorkMode();
  updateCloseAllVisibility();
  updateWorkModeButton();
});

function refreshBookmarks() {
  columns.length = 0;
  chrome.bookmarks.getTree((items) => {
    // Get the bookmarks bar directly - no longer requires "Stitch" folder
    const bookmarksBar = items[0];
    
    if (!bookmarksBar || !bookmarksBar.children) {
      console.error("No bookmarks found");
      return;
    }
    
    const rootBookmarks = bookmarksBar.children.filter((node) => !node.children);
    const rootFolders = bookmarksBar.children.filter((node) => !!node.children);

    // Create root column for bookmarks at the top level
    const rootColumn = { title: "/", id: bookmarksBar.id, children: [] };
    rootBookmarks.forEach((node) => addBookmark(rootColumn, node));
    if (rootColumn.children.length > 0) {
      columns.push(rootColumn);
    }

    // Process each folder as a column
    rootFolders.forEach((node) => {
      const column = { title: node.title, id: node.id, children: [] };
      visit(column, node);
      columns.push(column);
    });

    // If no columns were created, try to get bookmarks from other folders
    if (columns.length === 0) {
      const allFolders = items[0].children.filter((n) => !!n.children);
      allFolders.forEach((node) => {
        const column = { title: node.title, id: node.id, children: [] };
        visit(column, node);
        if (column.children.length > 0) {
          columns.push(column);
        }
      });
    }

    currentColumns = columns;
    updateVisitCounts();
    updateDuplicates();
    autoTagAll();
    renderCurrent();
    generateFilterButtons(rootFolders);
    updateSortButton();
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
  const isSeparator = options.SEPARATORS.includes(node.title) || node.type === "separator";
  column.children.push({
    title: node.title,
    url: node.url,
    path: path,
    isSeparator,
    dateAdded: node.dateAdded,
    id: node.id,
  });
};

function updateVisitCounts() {
  const historyAPI = typeof browser !== "undefined" ? browser.history : chrome.history;
  if (!historyAPI) return;

  const doSearch = () => {
    try {
      historyAPI.search({ text: "", maxResults: 10000 }, (results) => {
        bookmarkVisitCounts = {};
        results.forEach((item) => {
          const normalizedUrl = normalizeUrl(item.url);
          bookmarkVisitCounts[normalizedUrl] = (bookmarkVisitCounts[normalizedUrl] || 0) + item.visitCount;
        });
      });
    } catch (e) {}
  };

  if (typeof requestIdleCallback === 'function') {
    requestIdleCallback(doSearch, { timeout: 2000 });
  } else {
    setTimeout(doSearch, 500);
  }
}

function moveBookmark(srcUrl, dstUrl) {
  if (!srcUrl || !dstUrl) return;
  let srcCol, dstCol, srcIdx = -1, dstIdx = -1;
  columns.forEach((col) => {
    col.children.forEach((bm, i) => {
      if (bm.url === srcUrl) { srcCol = col; srcIdx = i; }
      if (bm.url === dstUrl) { dstCol = col; dstIdx = i; }
    });
  });
  if (!srcCol || !dstCol || srcIdx < 0 || dstIdx < 0) return;
  const [bm] = srcCol.children.splice(srcIdx, 1);
  if (srcCol === dstCol && srcIdx < dstIdx) dstIdx--;
  dstCol.children.splice(dstIdx, 0, bm);
  renderCurrent();
}
window.moveBookmark = moveBookmark;

function exportBookmarksToFile() {
  try {
    const data = JSON.stringify(currentColumns || columns);
    const blob = new Blob([data], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "bookmarks-export.json";
    a.click();
    URL.revokeObjectURL(url);
  } catch (e) {
    console.error("Export failed", e);
    alert("Failed to export bookmarks.");
  }
}

function importFromJson(json) {
  try {
    const imported = JSON.parse(json);
    if (!Array.isArray(imported)) throw new Error("Invalid format");
    columns.length = 0;
    imported.forEach((col) => columns.push(col));
    currentColumns = columns;
    renderCurrent();
  } catch (e) {
    console.error("Import error", e);
    alert("Import failed: invalid JSON");
  }
}

function handleImportClick() {
  const paste = prompt("Paste exported JSON here, or Cancel to choose a file.");
  if (paste) {
    importFromJson(paste);
    return;
  }
  const fileInput = document.getElementById("import-file");
  if (fileInput) fileInput.click();
}

function handleImportFileChange(e) {
  const file = e.target.files && e.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = () => {
    importFromJson(reader.result);
    e.target.value = null;
  };
  reader.readAsText(file);
}

function sortBookmarks(bookmarksArray, sortBy) {
  const nonSeparators = bookmarksArray.filter((b) => !b.isSeparator);
  const separators = bookmarksArray.filter((b) => b.isSeparator);
  let sorted = [...nonSeparators];

  if (sortBy === "frequency") {
    sorted.sort((a, b) => {
      const countA = bookmarkVisitCounts[normalizeUrl(a.url)] || 0;
      const countB = bookmarkVisitCounts[normalizeUrl(b.url)] || 0;
      return countB - countA;
    });
  } else if (sortBy === "date") {
    sorted.sort((a, b) => (b.dateAdded || 0) - (a.dateAdded || 0));
  } else if (sortBy === "alphabetical") {
    sorted.sort((a, b) => a.title.localeCompare(b.title));
  }

  const pinned = [], unpinned = [];
  sorted.forEach((b) => (pinnedSet.has(b.url) ? pinned.push(b) : unpinned.push(b)));
  sorted = [...pinned, ...unpinned];

  return separators.length > 0 ? [...sorted, ...separators] : sorted;
}

function applySorting(columnsToSort, sortBy) {
  return columnsToSort.map((col) => ({
    ...col,
    children: sortBookmarks(col.children, sortBy),
  }));
}

const debouncedFilterBookmarks = debounce(filterBookmarks, 300);

function clearMultiSelect() {
  selectedBookmarks.clear();
  document.querySelectorAll(".bookmark-checkbox").forEach((checkbox) => { checkbox.checked = false; });
  document.querySelectorAll(".bookmark-item.selected").forEach((item) => { item.classList.remove("selected"); });
  updateMultiSelectBar();
}

function openTabsSafely(urls) {
  if (window.chrome && chrome.tabs) {
    urls.forEach((url) => chrome.tabs.create({ url }));
  } else if (window.browser && browser.tabs) {
    urls.forEach((url) => browser.tabs.create({ url }));
  } else {
    urls.forEach((url) => window.open(url, "_blank"));
  }
}

function updateMultiSelectBar() {
  const bar = document.getElementById("multi-open-bar");
  const openBtn = document.getElementById("multi-open-button");
  if (!bar) return;
  
  if (selectedBookmarks.size > 0) {
    bar.classList.add("active");
    bar.style.display = "flex";
    openBtn.textContent = "Open (" + selectedBookmarks.size + ")";
  } else {
    bar.classList.remove("active");
    bar.style.display = "none";
  }
}
window.updateMultiSelectBar = updateMultiSelectBar;

function setupMultiSelectListeners() {
  document.body.addEventListener("click", (e) => {
    if (e.target.classList.contains("bookmark-checkbox")) {
      const url = e.target.getAttribute("data-url");
      if (e.target.checked) {
        selectedBookmarks.add(url);
        e.target.closest(".bookmark-item").classList.add("selected");
      } else {
        selectedBookmarks.delete(url);
        e.target.closest(".bookmark-item").classList.remove("selected");
      }
      updateMultiSelectBar();
    } else if (e.target.classList.contains("pin-btn")) {
      e.preventDefault();
      togglePin(e.target.getAttribute("data-url"));
    } else if (e.target.classList.contains("copy-url-btn")) {
      const url = e.target.getAttribute("data-url");
      if (navigator.clipboard && url) {
        navigator.clipboard.writeText(url).then(() => {
          const old = e.target.textContent;
          e.target.textContent = "✓";
          setTimeout(() => { e.target.textContent = old || "📋"; }, 1000);
        });
      }
    }
  });
}

// EDITABLE TITLE + THEME FUNCTIONALITY
document.addEventListener("DOMContentLoaded", function() {
  const welcomeElement = document.getElementById("welcome");
  const CUSTOM_TITLE_KEY = "customTitle";
  const DEFAULT_TITLE = "Hello, Stitch";
  const THEME_KEY = "selectedTheme";

  function renderTitle(titleText) {
    if (!welcomeElement) return;
    welcomeElement.innerHTML = titleText
      .split("")
      .map(function(letter, i) { return "<span class=\"stitch-theme color" + (i % 8) + "\">" + letter + "</span>"; })
      .join("");
  }

  function loadCustomTitle() {
    return localStorage.getItem(CUSTOM_TITLE_KEY) || DEFAULT_TITLE;
  }

  if (welcomeElement) {
    renderTitle(loadCustomTitle());
  }

  if (welcomeElement) {
    welcomeElement.addEventListener("click", function() {
      if (welcomeElement.querySelector(".title-edit-input")) return;

      const currentTitle = loadCustomTitle();
      welcomeElement.classList.add("editing");

      const input = document.createElement("input");
      input.type = "text";
      input.className = "title-edit-input";
      input.value = currentTitle;

      welcomeElement.innerHTML = "";
      welcomeElement.appendChild(input);
      input.focus();
      input.select();

      function saveTitle() {
        const newTitle = input.value.trim() || DEFAULT_TITLE;
        localStorage.setItem(CUSTOM_TITLE_KEY, newTitle);
        welcomeElement.classList.remove("editing");
        renderTitle(newTitle);
      }

      input.addEventListener("keydown", function(e) {
        if (e.key === "Enter") saveTitle();
        else if (e.key === "Escape") {
          welcomeElement.classList.remove("editing");
          renderTitle(currentTitle);
        }
      });

      input.addEventListener("blur", saveTitle);
    });
  }

  // Theme dropdown functionality
  function applyTheme(themeName) {
    document.body.className = "";
    if (themeName && themeName !== "default") {
      document.body.classList.add("theme-" + themeName);
    }
    localStorage.setItem(THEME_KEY, themeName || "default");
  }

  // Load saved theme
  const savedTheme = localStorage.getItem(THEME_KEY) || "default";
  applyTheme(savedTheme);

  // Theme dropdown change handler
  const themeSelect = document.getElementById("theme-select");
  if (themeSelect) {
    themeSelect.value = savedTheme;
    themeSelect.addEventListener("change", function() {
      applyTheme(this.value);
    });
  }

  document.body.style.background = options.BACKGROUND;
  updateTimestamp();

  const searchInput = document.getElementById("search-input");
  if (searchInput) {
    searchInput.addEventListener("input", debouncedFilterBookmarks);
    searchInput.value = "";
  }

  setupMultiSelectListeners();

  const openBtn = document.getElementById("multi-open-button");
  const closeBtn = document.getElementById("multi-close-button");
  if (openBtn) {
    openBtn.addEventListener("click", function() {
      const urls = Array.from(selectedBookmarks);
      if (urls.length) openTabsSafely(urls);
    });
  }
  if (closeBtn) {
    closeBtn.addEventListener("click", clearMultiSelect);
  }

  const quickLinks = [
    { id: "chatgpt-button", url: "https://chat.openai.com/" },
    { id: "grok-button", url: "https://grok.com/" },
    { id: "reddit-button", url: "https://www.reddit.com/" },
    { id: "twitch-button", url: "https://www.twitch.tv/" },
  ];
  quickLinks.forEach(function(link) {
    const btn = document.getElementById(link.id);
    if (btn) btn.addEventListener("click", function() { window.location.href = link.url; });
  });

  const exportBtn = document.getElementById("export-button");
  if (exportBtn) exportBtn.addEventListener("click", exportBookmarksToFile);
  
  const importBtn = document.getElementById("import-button");
  if (importBtn) importBtn.addEventListener("click", handleImportClick);
  
  const importFileInput = document.getElementById("import-file");
  if (importFileInput) importFileInput.addEventListener("change", handleImportFileChange);

  document.addEventListener("keydown", function(e) {
    if (e.target.tagName === "INPUT" || e.target.isContentEditable) return;
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "a") {
      document.querySelectorAll(".bookmark-checkbox").forEach(function(cb) { if (!cb.checked) cb.click(); });
      e.preventDefault();
    } else if (e.key === "o" && selectedBookmarks.size) {
      openTabsSafely(Array.from(selectedBookmarks));
    } else if (e.key === "c") {
      clearMultiSelect();
    }
  });

  const youtubeButton = document.getElementById("youtube-button");
  if (youtubeButton) {
    youtubeButton.addEventListener("click", function() {
      const query = document.getElementById("search-input").value.trim();
      if (query) {
        window.location.href = "https://www.youtube.com/results?search_query=" + encodeURIComponent(query);
      } else {
        window.location.href = "https://www.youtube.com";
      }
    });
  }

  const goToTopBtn = document.getElementById("go-to-top");
  const container = document.getElementById("container");

  function updateGoToTopVisibility() {
    const windowScrolled = window.scrollY > 50;
    const containerScrolled = container && container.scrollTop > 50;
    goToTopBtn.style.display = (windowScrolled || containerScrolled) ? "block" : "none";
  }

  window.addEventListener("scroll", updateGoToTopVisibility);
  if (container) container.addEventListener("scroll", updateGoToTopVisibility);

  goToTopBtn.addEventListener("click", function() {
    window.scrollTo({ top: 0, behavior: "smooth" });
    if (container) container.scrollTo({ top: 0, behavior: "smooth" });
  });

  setTimeout(function() {
    document.querySelectorAll("img.favicon").forEach(function(img) {
      img.onerror = function() {
        const faviconFinder = img.getAttribute("data-faviconfinder");
        const fallback = img.getAttribute("data-fallback");
        if (img.src !== faviconFinder && faviconFinder) img.src = faviconFinder;
        else if (img.src !== fallback && fallback) img.src = fallback;
      };
    });
  }, 0);

  document.body.addEventListener("click", function(e) {
    if (e.target.classList.contains("bookmark-link")) {
      e.preventDefault();
      window.location.href = e.target.getAttribute("data-url");
    }
  });

  autoApplyWorkMode();
  updateWorkModeButton();
});

function updateTimestamp() {
  const now = new Date();
  document.getElementById("date").textContent = now.toLocaleDateString();
  const hours = now.getHours();
  document.getElementById("hours").textContent = (hours % 12 || 12).toString().padStart(2, "0");
  document.getElementById("minutes").textContent = now.getMinutes().toString().padStart(2, "0");
  document.getElementById("seconds").textContent = now.getSeconds().toString().padStart(2, "0");
  document.getElementById("ampm").textContent = hours >= 12 ? "PM" : "AM";
  document.getElementById("day").textContent = now.toLocaleDateString("en-US", { weekday: "long" });
}

setInterval(updateTimestamp, 1000);

function filterBookmarks() {
  isShowingPins = false;
  const input = document.getElementById("search-input").value.trim().toLowerCase();
  const normalizedInput = input.normalize("NFD").replace(/[\u0300-\u036f]/g, "");

  const filteredColumns = columns
    .map(function(col) {
      return {
        ...col,
        children: col.children.filter(function(bm) {
          const title = bm.title ? bm.title.toLowerCase() : "";
          const normalizedTitle = title.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
          return normalizedTitle.includes(normalizedInput);
        }),
      };
    })
    .filter(function(col) { return col.children.length > 0; });

  currentColumns = filteredColumns;
  clearMultiSelect();
  renderCurrent();
}

function filterBy(category) {
  isShowingPins = false;
  const cat = category.toLowerCase();
  const filteredColumns = columns
    .map(function(col) {
      return {
        ...col,
        children: col.children.filter(function(bm) {
          return (bm.path || []).map(function(s) { return s.toLowerCase(); }).indexOf(cat) !== -1;
        }),
      };
    })
    .filter(function(col) { return col.children.length > 0; });

  currentColumns = filteredColumns;
  clearMultiSelect();
  renderCurrent();
}

function filterMostVisited() {
  isShowingPins = false;
  const historyAPI = typeof browser !== "undefined" ? browser.history : chrome.history;
  if (historyAPI) {
    historyAPI.search({ text: "", maxResults: 100 }, function(results) {
      const mostVisitedUrls = results.map(function(result) { return normalizeUrl(result.url); });
      currentColumns = columns
        .map(function(col) {
          return {
            ...col,
            children: col.children.filter(function(bm) {
              return mostVisitedUrls.indexOf(normalizeUrl(bm.url)) !== -1;
            }),
          };
        })
        .filter(function(col) { return col.children.length > 0; });
      clearMultiSelect();
      renderCurrent();
    });
  } else {
    resetFilters();
  }
  document.body.classList.remove("jobs-hours-active");
}

function filterPinned() {
  isShowingPins = true;
  currentColumns = columns
    .map(function(col) {
      return {
        ...col,
        children: col.children.filter(function(bm) { return pinnedSet.has(bm.url); }),
      };
    })
    .filter(function(col) { return col.children.length > 0; });
  clearMultiSelect();
  renderCurrent();
}

function filterJobsOnly() {
  isShowingPins = false;
  const jobsColumns = columns.filter(function(col) { return col.title.toLowerCase().indexOf("jobs") !== -1; });
  let newColumns = [];

  jobsColumns.forEach(function(jobsCol) {
    const subfolderMap = {};
    jobsCol.children.forEach(function(bm) {
      const jobsIndex = (bm.path || []).findIndex(function(p) { return p.toLowerCase().indexOf("jobs") !== -1; });
      let subfolderPath = "";
      if (jobsIndex !== -1 && bm.path && bm.path.length > jobsIndex + 1) {
        subfolderPath = bm.path.slice(jobsIndex + 1).join(" / ");
      }
      const key = subfolderPath || jobsCol.title;
      if (!subfolderMap[key]) subfolderMap[key] = [];
      subfolderMap[key].push(bm);
    });
    Object.entries(subfolderMap).forEach(function(entry) {
      newColumns.push({ title: entry[0], children: entry[1] });
    });
  });

  currentColumns = newColumns;
  clearMultiSelect();
  renderCurrent();
  document.body.classList.add("jobs-hours-active");
}

function filterJobsOrMostVisited() {
  isShowingPins = false;
  if (isESTJobsTimeAndWorkday()) filterJobsOnly();
  else filterMostVisited();
}

function generateFilterButtons(folders) {
  const filterButtonsContainer = document.querySelector(".filter-buttons");
  filterButtonsContainer.innerHTML = "";

  function makeBtn(config) {
    const btn = document.createElement("button");
    btn.className = "filter-button" + (config.extraClasses && config.extraClasses.length ? " " + config.extraClasses.join(" ") : "");
    if (config.id) btn.id = config.id;
    if (config.title) btn.title = config.title;
    btn.textContent = config.text;
    if (config.clickHandler) btn.addEventListener("click", config.clickHandler);
    return btn;
  }

  function renderFolder(folder) {
    if (folder.children && folder.children.length) {
      const details = document.createElement("details");
      const summary = document.createElement("summary");
      summary.textContent = folder.title;
      summary.className = "filter-folder-summary";
      details.appendChild(summary);

      folder.children.filter(function(child) { return child.children && child.children.length; }).forEach(function(child) {
        details.appendChild(renderFolder(child));
      });

      const button = makeBtn({
        text: "Show \"" + folder.title + "\"",
        clickHandler: function() { filterBy(folder.title.toLowerCase()); updateCloseAllVisibility(); }
      });
      details.appendChild(button);
      return details;
    }
    return null;
  }

  folders.forEach(function(folder) {
    const rendered = renderFolder(folder);
    if (rendered) filterButtonsContainer.appendChild(rendered);
  });

  const resetButton = makeBtn({ text: "Reset", clickHandler: function() { resetFilters(); updateCloseAllVisibility(); } });
  const closeAllBtn = makeBtn({ id: "close-all-btn", text: "Close All", title: "Collapse all folders", extraClasses: ["close-all-btn"], clickHandler: function() { document.querySelectorAll(".filter-buttons details[open]").forEach(function(d) { d.open = false; }); updateCloseAllVisibility(); } });
  const mostVisitedButton = makeBtn({ id: "filter-most-visited", text: "Most Visited", clickHandler: function() { filterMostVisited(); updateCloseAllVisibility(); } });
  const pinnedButton = makeBtn({ id: "filter-pinned", text: "Pinned", title: "Show only pinned bookmarks", clickHandler: function() { filterPinned(); updateCloseAllVisibility(); } });
  const clearPinsButton = makeBtn({ id: "clear-pins", text: "Clear Pins", title: "Remove all pins", clickHandler: function() { clearAllPins(); updateCloseAllVisibility(); } });
  const jobsHoursButton = makeBtn({ id: "filter-jobs-hours", text: "Jobs Hours", clickHandler: function() { filterJobsOrMostVisited(); updateCloseAllVisibility(); } });
  const workModeButton = makeBtn({ id: "filter-work-mode", text: "Work Mode: OFF", clickHandler: toggleWorkMode });
  const configureWorkModeButton = makeBtn({ id: "configure-work-mode", text: "Configure Work Mode", clickHandler: function() { if (typeof showWorkModeModal === "function") showWorkModeModal(columns); } });
  const sortByFrequencyBtn = makeBtn({ id: "sort-frequency", text: "Sort: Frequency", title: "Sort by most visited", clickHandler: function() { setSortPreference("frequency"); } });
  const sortByDateBtn = makeBtn({ id: "sort-date", text: "Sort: Date Added", title: "Sort by newest first", clickHandler: function() { setSortPreference("date"); } });
  const sortAlphabeticalBtn = makeBtn({ id: "sort-alphabetical", text: "Sort: A-Z", title: "Sort alphabetically", clickHandler: function() { setSortPreference("alphabetical"); } });

  [workModeButton, configureWorkModeButton, jobsHoursButton, mostVisitedButton, sortByFrequencyBtn, sortByDateBtn, sortAlphabeticalBtn, resetButton, clearPinsButton, closeAllBtn].forEach(function(btn) { filterButtonsContainer.appendChild(btn); });

  updateCloseAllVisibility();
  updateClearPinsVisibility();
}

function resetFilters() {
  isShowingPins = false;
  currentColumns = columns;
  clearMultiSelect();
  renderCurrent();
  const searchInput = document.getElementById("search-input");
  if (searchInput) searchInput.value = "";
  document.querySelectorAll(".filter-buttons details[open]").forEach(function(d) { d.open = false; });
  document.body.classList.remove("jobs-hours-active");
}

function updateCloseAllVisibility() {
  const closeAllBtn = document.getElementById("close-all-btn");
  if (!closeAllBtn) return;
  closeAllBtn.style.display = document.querySelector(".filter-buttons details[open]") ? "inline-block" : "none";
}

function updateClearPinsVisibility() {
  const clearPinsBtn = document.getElementById("clear-pins");
  if (!clearPinsBtn) return;
  clearPinsBtn.style.display = pinnedSet.size > 0 ? "inline-block" : "none";
}

document.addEventListener("click", function(e) {
  if (e.target.tagName === "SUMMARY" && e.target.closest(".filter-buttons details")) {
    setTimeout(updateCloseAllVisibility, 10);
  }
});

document.addEventListener("click", function(e) {
  const btn = e.target.closest(".delete-bookmark-btn");
  if (!btn) return;
  e.preventDefault();
  const url = btn.getAttribute("data-url");
  if (confirm("Are you sure you want to delete this bookmark?")) {
    if (window.chrome && chrome.bookmarks) {
      chrome.bookmarks.search({ url: url }, function(results) {
        let pending = results.length;
        if (pending === 0) refreshBookmarks();
        results.forEach(function(bm) {
          chrome.bookmarks.remove(bm.id, function() {
            if (--pending === 0) refreshBookmarks();
          });
        });
      });
    }
  }
});

function renderCurrent() {
  const sortBy = localStorage.getItem(SORT_PREFERENCE_KEY) || "frequency";
  const sortedColumns = applySorting(currentColumns, sortBy);
  render(sortedColumns);
  updatePinIcons();
  if (typeof setupVirtualization === "function") setupVirtualization();
}

function updatePinIcons() {
  document.querySelectorAll(".pin-btn").forEach(function(btn) {
    const url = btn.getAttribute("data-url");
    const item = btn.closest(".bookmark-item");
    if (pinnedSet.has(url)) {
      btn.textContent = "★";
      btn.classList.add("pinned");
      if (item) item.classList.add("pinned");
    } else {
      btn.textContent = "☆";
      btn.classList.remove("pinned");
      if (item) item.classList.remove("pinned");
    }
  });
}

function setupVirtualization() {
  const container = document.getElementById("container");
  if (!container || !("IntersectionObserver" in window)) return;
  const observer = new IntersectionObserver(function(entries) {
    entries.forEach(function(entry) {
      const item = entry.target;
      const preview = item.querySelector(".bookmark-preview-container");
      if (!preview) return;
      const iframe = item.querySelector("iframe[data-src]");
      if (entry.isIntersecting) {
        preview.style.display = "";
        if (iframe && !iframe.src) {
          const setSrc = function() { try { iframe.src = iframe.getAttribute("data-src") || ""; } catch (e) {} };
          if (typeof requestIdleCallback === "function") requestIdleCallback(setSrc, { timeout: 1000 });
          else setTimeout(setSrc, 200);
        }
      } else {
        preview.style.display = "none";
      }
    });
  }, { root: container, rootMargin: "200px" });
  document.querySelectorAll(".bookmark-item").forEach(function(item) { observer.observe(item); });
}

function setSortPreference(sortBy) {
  localStorage.setItem(SORT_PREFERENCE_KEY, sortBy);
  updateSortButton();
  renderCurrent();
}

function savePinned() {
  localStorage.setItem(PINS_KEY, JSON.stringify([...pinnedSet]));
}

function togglePin(url) {
  if (pinnedSet.has(url)) pinnedSet.delete(url);
  else pinnedSet.add(url);
  savePinned();
  renderCurrent();
  if (isShowingPins) filterPinned();
  updateClearPinsVisibility();
}

function clearAllPins() {
  pinnedSet.clear();
  savePinned();
  renderCurrent();
  updateClearPinsVisibility();
}

const WORK_MODE_KEY = "workModeFolders";

function applyWorkModeFilter() {
  isShowingPins = false;
  const selected = JSON.parse(localStorage.getItem(WORK_MODE_KEY) || "[]");
  if (!selected.length) {
    currentColumns = columns;
    clearMultiSelect();
    renderCurrent();
    document.body.classList.remove("jobs-hours-active");
    return;
  }

  const newColumns = selected.map(function(selPath) {
    let bookmarks = [];
    columns.forEach(function(col) {
      if (col.title === selPath) bookmarks = bookmarks.concat(col.children);
      else bookmarks = bookmarks.concat(col.children.filter(function(bm) { return (bm.path || []).join(" / ") === selPath; }));
    });
    return { title: selPath, children: bookmarks };
  });

  currentColumns = newColumns;
  clearMultiSelect();
  renderCurrent();
  document.body.classList.add("jobs-hours-active");
}

function autoApplyWorkMode() {
  const workModeFolders = JSON.parse(localStorage.getItem(WORK_MODE_KEY) || "[]");
  const workModeEnabled = JSON.parse(localStorage.getItem("workModeEnabled") || "false");
  if (workModeEnabled && workModeFolders.length) {
    applyWorkModeFilter();
  } else if (isESTJobsTimeAndWorkday()) {
    filterJobsOnly();
  } else {
    currentColumns = columns;
    renderCurrent();
    document.body.classList.remove("jobs-hours-active");
  }
}

function updateWorkModeButton() {
  const btn = document.getElementById("filter-work-mode");
  const enabled = JSON.parse(localStorage.getItem("workModeEnabled") || "false");
  if (btn) btn.textContent = enabled ? "Work Mode: ON" : "Work Mode: OFF";
}

function updateSortButton() {
  const sortBy = localStorage.getItem(SORT_PREFERENCE_KEY) || "frequency";
  const frequencyBtn = document.getElementById("sort-frequency");
  const dateBtn = document.getElementById("sort-date");
  const alphabeticalBtn = document.getElementById("sort-alphabetical");

  [frequencyBtn, dateBtn, alphabeticalBtn].forEach(function(btn) {
    if (btn) {
      btn.classList.remove("active-sort");
      btn.style.opacity = "0.7";
    }
  });

  const activeBtn = sortBy === "frequency" ? frequencyBtn : sortBy === "date" ? dateBtn : alphabeticalBtn;
  if (activeBtn) {
    activeBtn.classList.add("active-sort");
    activeBtn.style.opacity = "1";
  }
}

function toggleWorkMode() {
  const enabled = JSON.parse(localStorage.getItem("workModeEnabled") || "false");
  localStorage.setItem("workModeEnabled", !enabled);
  updateWorkModeButton();
  autoApplyWorkMode();
}
