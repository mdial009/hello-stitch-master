const render = (columns) => {
  const root = document.getElementById("container");
  if (!root) {
    console.warn("render: #container not found in DOM.");
    return;
  }
  const showCollapsible = columns.length > 1;

  function renderGroupedBookmarks(bookmarks) {
    const groups = {};
    bookmarks.forEach((bm) => {
      const groupKey = bm.path && bm.path.length ? bm.path.join(" / ") : "";
      if (!groups[groupKey]) groups[groupKey] = [];
      groups[groupKey].push(bm);
    });

    let html = "";
    if (groups[""]) {
      html += groups[""].map(renderBookmark).join("");
      delete groups[""];
    }

    Object.keys(groups).forEach((group) => {
      const groupColor = getFolderColor(group);
      const count = groups[group].length;
      html += `
        <li class="bookmark-item subfolder-group">
          <details open>
            <summary class="folder-name" title="${group}" 
              style="margin-top:1em; margin-bottom:0.5em; color:${groupColor}; border-left: 4px solid ${groupColor}; padding-left: 0.5em;">
              ${group.split(" / ").pop()} - ${count}
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
    if (bookmark.isSeparator) {
      return '<li class="separator bookmark-item">&nbsp;</li>';
    }
    const title = bookmark.title;
    const path = bookmark.path ? bookmark.path.join(" / ") : "";
    let isNew = false;
    if (bookmark.dateAdded) {
      const now = Date.now();
      const oneMonth = 30 * 24 * 60 * 60 * 1000;
      isNew = now - bookmark.dateAdded < oneMonth;
    }
    // Favicon fallback logic: Google, then FaviconFinder, then your icon
    const hostname = bookmark.url ? new URL(bookmark.url).hostname : "";
    const googleFavicon = `https://www.google.com/s2/favicons?domain=${encodeURIComponent(
      hostname
    )}`;
    const faviconFinder = `http://www.faviconfinder.com/favicon/${encodeURIComponent(
      hostname
    )}`;
    const fallbackIcon = getFaviconFallback(bookmark.url);

    return `<li class="bookmark-item" data-path="${path}">
      <a href="${bookmark.url}" ${
      title.endsWith("…") ? `title="${bookmark.title}"` : ""
    }>
        <img src="${googleFavicon}" 
             alt="" 
             class="favicon"
             data-faviconfinder="${faviconFinder}"
             data-fallback="${fallbackIcon}">
        ${title}
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

  function renderColumn(column) {
    const visibleChildren = column.children.filter((bm) => !bm.isSeparator);
    if (visibleChildren.length === 0) return "";
    const listItems = renderGroupedBookmarks(visibleChildren);
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
      return `<div class="column dynamic-column" style="border-top: 4px solid ${color};">
        <h2 class="folder-name" style="color:${color};">${getSingleColoredTitle(
        column.title
      )}</h2>
        <ul>${listItems}</ul>
      </div>`;
    }
  }

  root.innerHTML = columns.map(renderColumn).filter(Boolean).join("");
  updateContainerClass();

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

    document.querySelectorAll(".edit-bookmark-btn").forEach((btn) => {
      btn.onclick = function (e) {
        e.preventDefault();
        const oldUrl = btn.getAttribute("data-url");
        const oldTitle = btn.getAttribute("data-title");
        const oldPath =
          btn.closest(".bookmark-item").getAttribute("data-path") || "";
        const bookmarkId = btn.getAttribute("data-id");

        const modal = document.getElementById("edit-modal");
        const form = document.getElementById("edit-form");
        document.getElementById("edit-title").value = oldTitle;
        document.getElementById("edit-url").value = oldUrl;

        chrome.bookmarks.getTree((tree) => {
          const folders = getAllFolders(tree);
          const folderSelect = document.getElementById("edit-folder");
          folderSelect.innerHTML = "";
          folders.forEach((folder) => {
            const option = document.createElement("option");
            option.value = folder.id;
            option.textContent = folder.path;
            folderSelect.appendChild(option);
          });
          chrome.bookmarks.search({ url: oldUrl }, (results) => {
            if (results && results[0]) {
              folderSelect.value = results[0].parentId;
            }
          });
        });

        modal.style.display = "flex";
        modal.classList.add("active");

        document.getElementById("edit-cancel").onclick = () => {
          modal.style.display = "none";
          modal.classList.remove("active");
        };

        form.onsubmit = async (ev) => {
          ev.preventDefault();
          const newTitle = document.getElementById("edit-title").value;
          const newUrl = document.getElementById("edit-url").value;
          const newParentId = document.getElementById("edit-folder").value;

          if (window.chrome && chrome.bookmarks) {
            chrome.bookmarks.search({ url: oldUrl }, async (results) => {
              for (const bm of results) {
                chrome.bookmarks.move(bm.id, { parentId: newParentId }, () => {
                  chrome.bookmarks.update(
                    bm.id,
                    { title: newTitle, url: newUrl },
                    () => {
                      modal.style.display = "none";
                      modal.classList.remove("active");
                      refreshBookmarks();
                    }
                  );
                });
              }
            });
          } else if (window.browser && browser.bookmarks) {
            const results = await browser.bookmarks.search({ url: oldUrl });
            for (const bm of results) {
              await browser.bookmarks.move(bm.id, { parentId: newParentId });
              await browser.bookmarks.update(bm.id, {
                title: newTitle,
                url: newUrl,
              });
            }
            modal.style.display = "none";
            modal.classList.remove("active");
            refreshBookmarks();
          } else {
            alert("Bookmark editing is not supported in this environment.");
          }
        };
      };
    });

    updateTotalBookmarkCount();
  }, 0);
};

// --- Utility functions (unchanged) ---
function renderCurrent() {
  render(currentColumns);
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
  return "icons/web/icons8-stitch-color-16.png";
}
function getStitchColoredTitle(title) {
  if (!title) return "";
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
  let hash = 0;
  for (let i = 0; i < name.length; i++)
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return folderColors[Math.abs(hash) % folderColors.length];
}
function getSingleColoredTitle(title) {
  const color = getFolderColor(title);
  return `<span style="color:${color}; font-weight:bold;">${title}</span>`;
}
function updateTotalBookmarkCount() {
  const total = document.querySelectorAll(
    ".bookmark-item:not(.subfolder-group):not(.separator)"
  ).length;
  const span = document.getElementById("total-bookmark-count");
  if (span) span.textContent = `Total Bookmarks: ${total}`;
}
function updateContainerClass() {
  const container = document.getElementById("container");
  if (!container) return;
  const visibleColumns = Array.from(
    container.querySelectorAll(".dynamic-column, .column")
  ).filter((col) => col.style.display !== "none");
  container.classList.remove("single-folder", "two-folders");
  if (visibleColumns.length === 1) container.classList.add("single-folder");
  else if (visibleColumns.length === 2) container.classList.add("two-folders");
}
function getAllFolders(tree) {
  const folders = [];
  function visit(node, path = []) {
    if (node.children && node.title) {
      const folderPath = path.concat(node.title).join(" / ");
      if (folderPath) folders.push({ id: node.id, path: folderPath });
      node.children.forEach((child) => visit(child, path.concat(node.title)));
    } else if (node.children) {
      node.children.forEach((child) => visit(child, path));
    }
  }
  visit(tree[0], []);
  return folders;
}
