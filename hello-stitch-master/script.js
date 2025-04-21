const columns = [];

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

  const rootColumn = {
    title: "/",
    children: [],
  };

  rootBookmarks.forEach((node) => addBookmark(rootColumn, node));
  columns.push(rootColumn);

  rootFolders.forEach((node) => {
    const column = {
      title: node.title,
      children: [],
    };
    visit(column, node);
    columns.push(column);
  });

  render(columns);
  generateFilterButtons(rootFolders);
  filterMostVisited();
  updateCloseAllVisibility();
});

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
  const faviconUrl = `https://www.google.com/s2/favicons?domain=${
    new URL(node.url).hostname
  }`;
  column.children.push({
    title: node.title,
    url: node.url,
    path: path,
    isSeparator,
    faviconUrl,
  });
};

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
    // Show if either the window or the main container is scrolled down a bit
    const windowScrolled = window.scrollY > 50;
    const containerScrolled = container && container.scrollTop > 50;
    if (windowScrolled || containerScrolled) {
      goToTopBtn.style.display = "block";
    } else {
      goToTopBtn.style.display = "none";
    }
  }

  // Listen for scroll on both window and container
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

function filterMostVisited() {
  if (typeof browser !== "undefined" && browser.history) {
    browser.history.search({ text: "", maxResults: 100 }).then((results) => {
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
  } else if (typeof chrome !== "undefined" && chrome.history) {
    chrome.history.search({ text: "", maxResults: 100 }, (results) => {
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

  filterButtonsContainer.appendChild(mostVisitedButton);
  filterButtonsContainer.appendChild(resetButton);
  filterButtonsContainer.appendChild(closeAllBtn);

  // Update visibility after rendering
  updateCloseAllVisibility();
}

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
    setTimeout(updateCloseAllVisibility, 10); // Wait for open/close to apply
  }
});
