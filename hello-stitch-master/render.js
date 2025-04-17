const render = (columns) => {
  const root = document.getElementById("container");

  const renderColumn = (column) => {
    const renderBookmark = (bookmark) => {
      if (bookmark.children && bookmark.children.length) {
        // Render subfolder as collapsible
        return `
          <li class="bookmark-item">
            <details>
              <summary class="folder-title" style="color: #4f959d; cursor:pointer;">
                <span>${bookmark.title}</span>
              </summary>
              <ul>
                ${bookmark.children.map(renderBookmark).join("")}
              </ul>
            </details>
          </li>
        `;
      }

      const title = bookmark.path
        ? bookmark.path.slice(1).concat(bookmark.title).join("/")
        : bookmark.title;

      if (bookmark.isSeparator) {
        return '<li class="separator bookmark-item">&nbsp;</li>';
      }

      return `<li class="bookmark-item">
        <a href="${bookmark.url}" ${
        title.endsWith("…") ? `title="${bookmark.title}"` : ""
      }>
          <img src="${bookmark.faviconUrl}" alt="" class="favicon"
            onerror="this.onerror=null;this.src='${getFaviconFallback(
              bookmark.url
            )}';"
          > ${title}
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
    };

    const listItems = column.children.map(renderBookmark).join("");

    return `<div class="column dynamic-column">
      <h2 class="folder-name">${column.title}</h2>
      <ul>${listItems}</ul>
    </div>`;
  };

  // Render the columns
  root.innerHTML = columns
    .filter((column) => column.children.length)
    .map(renderColumn)
    .join("");
  updateContainerClass();
};

// Filter bookmarks based on search input
function filterBookmarks() {
  const input = document.getElementById("search-input").value.toLowerCase();
  const bookmarks = document.querySelectorAll(".bookmark-item");
  bookmarks.forEach((bookmark) => {
    const title = bookmark.querySelector("a")
      ? bookmark.querySelector("a").textContent.toLowerCase()
      : "";
    bookmark.style.display = title.includes(input) ? "" : "none";
  });
  hideEmptySections();
}

// Filter bookmarks based on category
function filterBy(category) {
  const bookmarks = document.querySelectorAll(".bookmark-item");
  bookmarks.forEach((bookmark) => {
    const title = bookmark.querySelector("a")
      ? bookmark.querySelector("a").textContent.toLowerCase()
      : "";
    bookmark.style.display = title.includes(category.toLowerCase())
      ? ""
      : "none";
  });
  hideEmptySections();
}

// Filter bookmarks based on most visited
function filterMostVisited() {
  const historyAPI =
    typeof browser !== "undefined" ? browser.history : chrome.history;

  if (historyAPI) {
    historyAPI.search({ text: "", maxResults: 100 }, (results) => {
      const mostVisitedUrls = results.map((result) => result.url);
      const bookmarks = document.querySelectorAll(".bookmark-item");
      let hasMostVisited = false;

      bookmarks.forEach((bookmark) => {
        const url = bookmark.querySelector("a")
          ? bookmark.querySelector("a").href
          : "";
        if (mostVisitedUrls.includes(url)) {
          bookmark.style.display = "";
          hasMostVisited = true;
        } else {
          bookmark.style.display = "none";
        }
      });

      if (!hasMostVisited) {
        resetFilters();
      } else {
        hideEmptySections();
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
  const bookmarks = document.querySelectorAll(".bookmark-item");
  bookmarks.forEach((bookmark) => {
    bookmark.style.display = "";
  });
  document.getElementById("search-input").value = "";
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
