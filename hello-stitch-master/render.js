const render = (columns) => {
  const root = document.getElementById("container");
  const showCollapsible = columns.length > 1;

  function renderGroupedBookmarks(bookmarks) {
    // Group bookmarks by full path or ""
    const groups = {};
    bookmarks.forEach((bm) => {
      const groupKey = bm.path && bm.path.length ? bm.path.join(" / ") : "";
      if (!groups[groupKey]) groups[groupKey] = [];
      groups[groupKey].push(bm);
    });

    // Render bookmarks with no group (no path or empty path) first
    let html = "";
    if (groups[""]) {
      html += groups[""].map(renderBookmark).join("");
      delete groups[""];
    }

    // Render each group with a collapsible subfolder title
    Object.keys(groups).forEach((group) => {
      const groupColor = getFolderColor(group);
      html += `
        <li class="bookmark-item subfolder-group">
          <details open>
            <summary
              class="folder-name"
              title="${group}" 
              style="margin-top:1em; margin-bottom:0.5em; color:${groupColor}; border-left: 4px solid ${groupColor}; padding-left: 0.5em;">
              ${group.split(" / ").pop()}
            </summary>
            <ul>
              ${groups[group].map(renderBookmark).join("")}
            </ul>
          </details>
        </li>
      `;
    });

    return html;
  }

  function renderBookmark(bookmark) {
    // Separator
    if (bookmark.isSeparator) {
      return '<li class="separator bookmark-item">&nbsp;</li>';
    }

    // Regular bookmark
    const title = bookmark.title;
    const path = bookmark.path ? bookmark.path.join(" / ") : "";
    return `<li class="bookmark-item" data-path="${path}">
      <a href="${bookmark.url}" ${
      title.endsWith("…") ? `title="${bookmark.title}"` : ""
    }>
        <img src="${
          bookmark.faviconUrl
        }" alt="" class="favicon" data-fallback="${getFaviconFallback(
      bookmark.url
    )}">
        ${title}
      </a>
      <div class="url-container">
        <span class="url" title="${bookmark.url}">${getShortUrl(
      bookmark.url
    )}</span>
        <button class="copy-url-btn" data-url="${
          bookmark.url
        }" title="Copy URL">📋</button>
      </div>
    </li>`;
  }

  function renderColumn(column) {
    const listItems = renderGroupedBookmarks(column.children);
    const color = getFolderColor(column.title);

    if (showCollapsible) {
      return `<div class="column dynamic-column" style="border-top: 4px solid ${color};">
        <details open>
          <summary class="column-summary" style="color:${color};">${getSingleColoredTitle(
        column.title
      )}</summary>
          <ul>${listItems}</ul>
        </details>
      </div>`;
    } else {
      // Single column, no collapsible
      return `<div class="column dynamic-column" style="border-top: 4px solid ${color};">
        <h2 class="folder-name" style="color:${color};">${getSingleColoredTitle(
        column.title
      )}</h2>
        <ul>${listItems}</ul>
      </div>`;
    }
  }

  root.innerHTML = columns
    .filter((column) => column.children.length)
    .map(renderColumn)
    .join("");
  updateContainerClass();

  // After rendering columns
  setTimeout(() => {
    document.querySelectorAll("img.favicon").forEach((img) => {
      img.onerror = function () {
        const fallback = img.getAttribute("data-fallback");
        if (img.src !== fallback) img.src = fallback;
      };
    });
  }, 0);
};

// Filter bookmarks based on search input
function filterBookmarks() {
  const input = document.getElementById("search-input").value.toLowerCase();

  // 1. Filter bookmarks (not subfolder groups)
  const bookmarks = document.querySelectorAll(
    ".bookmark-item:not(.subfolder-group)"
  );
  bookmarks.forEach((bookmark) => {
    const link = bookmark.querySelector("a");
    const title = link ? link.textContent.toLowerCase() : "";
    const match = title.includes(input);
    bookmark.style.display = match ? "" : "none";
  });

  // 2. Show/hide subfolder groups based on their children
  document.querySelectorAll(".subfolder-group").forEach((group) => {
    const visibleBookmarks = group.querySelectorAll(
      ".bookmark-item:not(.subfolder-group)"
    );
    const anyVisible = Array.from(visibleBookmarks).some(
      (item) => item.style.display !== "none"
    );
    group.style.display = anyVisible ? "" : "none";
    // Open details if any child is visible, close if none
    const details = group.querySelector("details");
    if (details) details.open = anyVisible;
  });

  hideEmptySections();
}

// Filter bookmarks based on category
function filterBy(category) {
  const cat = category.toLowerCase();
  const bookmarks = document.querySelectorAll(
    ".bookmark-item:not(.subfolder-group)"
  );
  bookmarks.forEach((bookmark) => {
    const path = (bookmark.getAttribute("data-path") || "").toLowerCase();
    // Show if any segment of the path matches the category
    const pathSegments = path.split(" / ").map((s) => s.trim());
    const inFolder = pathSegments.includes(cat);
    bookmark.style.display = inFolder ? "" : "none";
  });

  // Show/hide subfolder groups based on their children
  document.querySelectorAll(".subfolder-group").forEach((group) => {
    const visibleBookmarks = group.querySelectorAll(
      ".bookmark-item:not(.subfolder-group)"
    );
    const anyVisible = Array.from(visibleBookmarks).some(
      (item) => item.style.display !== "none"
    );
    group.style.display = anyVisible ? "" : "none";
    const details = group.querySelector("details");
    if (details) details.open = anyVisible;
  });

  hideEmptySections();
}

// Normalize URL
function normalizeUrl(url) {
  try {
    const u = new URL(url);
    return u.origin + u.pathname.replace(/\/$/, "");
  } catch (e) {
    return url;
  }
}

// Filter bookmarks based on most visited
function filterMostVisited() {
  const historyAPI =
    typeof browser !== "undefined" ? browser.history : chrome.history;

  if (historyAPI) {
    historyAPI.search({ text: "", maxResults: 100 }, (results) => {
      console.log("History results:", results);
      // Normalize history URLs
      const mostVisitedUrls = results.map((result) => normalizeUrl(result.url));
      console.log("Most visited (history):", mostVisitedUrls);
      const bookmarks = document.querySelectorAll(
        ".bookmark-item:not(.subfolder-group)"
      );
      let hasMostVisited = false;

      bookmarks.forEach((bookmark) => {
        const link = bookmark.querySelector("a");
        const url = link ? normalizeUrl(link.href) : "";
        console.log("Bookmark URL:", url);
        if (mostVisitedUrls.includes(url)) {
          bookmark.style.display = "";
          hasMostVisited = true;
        } else {
          bookmark.style.display = "none";
        }
      });

      // Show/hide subfolder groups based on their children
      document.querySelectorAll(".subfolder-group").forEach((group) => {
        const visibleBookmarks = group.querySelectorAll(
          ".bookmark-item:not(.subfolder-group)"
        );
        const anyVisible = Array.from(visibleBookmarks).some(
          (item) => item.style.display !== "none"
        );
        group.style.display = anyVisible ? "" : "none";
        const details = group.querySelector("details");
        if (details) details.open = anyVisible;
      });

      hideEmptySections();

      if (!hasMostVisited) {
        resetFilters();
      }
    });
  } else {
    console.error("History API is not available.");
  }
}

// Hide empty sections
function hideEmptySections() {
  const columns = document.querySelectorAll(".column");
  columns.forEach((column) => {
    const bookmarks = column.querySelectorAll(".bookmark-item");
    const hasVisibleBookmarks = Array.from(bookmarks).some(
      (bookmark) => bookmark.style.display !== "none"
    );
    column.style.display = hasVisibleBookmarks ? "" : "none";
  });
  updateContainerClass();
}

// Reset filters
function resetFilters() {
  // Show all bookmarks
  document.querySelectorAll(".bookmark-item").forEach((bookmark) => {
    bookmark.style.display = "";
  });

  // Show all subfolder groups and open their details
  document.querySelectorAll(".subfolder-group").forEach((group) => {
    group.style.display = "";
    const details = group.querySelector("details");
    if (details) details.open = true;
  });

  // Show all columns and open their details if collapsible
  document.querySelectorAll(".dynamic-column").forEach((column) => {
    column.style.display = "";
    const details = column.querySelector("details");
    if (details) details.open = true;
  });

  // Clear search input
  const searchInput = document.getElementById("search-input");
  if (searchInput) searchInput.value = "";

  hideEmptySections();
}

// Show loading indicator
function showLoading() {
  const loadingElement = document.createElement("div");
  loadingElement.id = "loading";
  loadingElement.textContent = "Loading...";
  document.body.appendChild(loadingElement);
}

// Hide loading indicator
function hideLoading() {
  const loadingElement = document.getElementById("loading");
  if (loadingElement) {
    loadingElement.remove();
  }
}

// Debounce function
function debounce(func, delay) {
  let timeout;
  return (...args) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), delay);
  };
}

function getShortUrl(url) {
  try {
    const u = new URL(url);
    return u.hostname + u.pathname.replace(/\/$/, "");
  } catch (e) {
    return url;
  }
}

function getFaviconFallback(url) {
  try {
    const u = new URL(url);
    return `${u.origin}/favicon.ico`;
  } catch (e) {
    return "icons/web/icons8-stitch-color-16.png";
  }
}

function getStitchColoredTitle(title) {
  if (!title) return "";
  // Capitalize the first letter of each word, lowercase the rest
  const formatted = title
    .toLowerCase()
    .replace(/\b\w/g, (char) => char.toUpperCase());
  return formatted
    .split("")
    .map(
      (letter, i) => `<span class="stitch-theme color${i % 8}">${letter}</span>`
    )
    .join("");
}

function getMultiColoredPathTitle(pathString) {
  if (!pathString) return "";
  return pathString
    .split(" / ")
    .map((segment) => {
      const color = getFolderColor(segment);
      return `<span style="color:${color}; font-weight:bold;">${segment}</span>`;
    })
    .join(' <span style="color:#888;">/</span> ');
}

const folderColors = [
  "#6ac5e0",
  "#4f959d",
  "#ff9900",
  "#ff69b4",
  "#ffd700",
  "#32cd32",
  "#00ced1",
  "#8a2be2",
  "#ff4500",
  "#10a37f",
  "#e67e22",
  "#e74c3c",
  "#1abc9c",
  "#2ecc71",
  "#3498db",
  "#9b59b6",
  "#34495e",
  "#16a085",
  "#27ae60",
  "#2980b9",
  "#8e44ad",
  "#2c3e50",
  "#f39c12",
  "#d35400",
  "#c0392b",
  "#7f8c8d",
  "#bada55",
  "#39add1",
  "#f26c4f",
  "#a87ca0",
  "#bdc3c7",
];

function getFolderColor(name) {
  // Simple hash to pick a color based on folder name
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return folderColors[Math.abs(hash) % folderColors.length];
}

function getSingleColoredTitle(title) {
  const color = getFolderColor(title);
  return `<span style="color:${color}; font-weight:bold;">${title}</span>`;
}

const debouncedFilterBookmarks = debounce(filterBookmarks, 300);

document.addEventListener("DOMContentLoaded", () => {
  const searchInput = document.getElementById("search-input");
  if (searchInput) {
    searchInput.addEventListener("input", debouncedFilterBookmarks);
    searchInput.value = "";
  }

  const filterMostVisitedButton = document.getElementById(
    "filter-most-visited"
  );
  if (filterMostVisitedButton) {
    filterMostVisitedButton.addEventListener("click", filterMostVisited);
  }
});
