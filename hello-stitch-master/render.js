// Render functions for displaying bookmarks
function render(columns) {
  const container = document.getElementById("container");
  if (!container) return;
  
  container.innerHTML = "";

  if (!columns || columns.length === 0) {
    container.innerHTML = "<p>No bookmarks found</p>";
    return;
  }

  // Flatten columns: create separate columns for each subfolder
  const flattenedColumns = [];
  
  columns.forEach(function(col) {
    // Group children by their subfolder path
    const subfolderGroups = {};
    const rootBookmarks = [];
    
    col.children.forEach(function(bm) {
      const pathKey = (bm.path && bm.path.length > 0) ? bm.path.join(" / ") : "";
      if (pathKey !== "") {
        if (!subfolderGroups[pathKey]) {
          subfolderGroups[pathKey] = [];
        }
        subfolderGroups[pathKey].push(bm);
      } else {
        rootBookmarks.push(bm);
      }
    });

    // Add the main column with root bookmarks (if any)
    if (rootBookmarks.length > 0) {
      flattenedColumns.push({
        title: col.title,
        children: rootBookmarks,
        isSubfolder: false,
        folderId: col.folderId || rootBookmarks[0]?.parentId
      });
    }

    // Add each subfolder as its own column
    Object.keys(subfolderGroups).forEach(function(pathKey) {
      // Extract just the folder name (last part of the path) for display
      const pathParts = pathKey.split(" / ");
      const folderName = pathParts[pathParts.length - 1];
      
      flattenedColumns.push({
        title: pathKey,
        displayTitle: folderName,
        children: subfolderGroups[pathKey],
        isSubfolder: true,
        parentTitle: col.title,
        folderId: subfolderGroups[pathKey][0]?.parentId
      });
    });
  });

  // Render each flattened column
  flattenedColumns.forEach(function(col) {
    const columnDiv = document.createElement("div");
    columnDiv.className = "dynamic-column";
    columnDiv.setAttribute("data-column-title", col.title);
    if (col.folderId) columnDiv.setAttribute("data-folder-id", col.folderId);

    const summary = document.createElement("div");
    summary.className = "column-summary";
    const displayTitle = col.displayTitle || col.title;
    summary.setAttribute("data-tooltip", "Path: " + col.title);
    
    const titleSpan = document.createElement("span");
    titleSpan.textContent = displayTitle;
    
    const folderIcon = document.createElement("span");
    folderIcon.className = "folder-icon";
    const iconInfo = getFolderIcon(col.title);
    folderIcon.textContent = iconInfo.icon;
    folderIcon.style.color = iconInfo.color;
    summary.appendChild(titleSpan);
    summary.insertBefore(folderIcon, titleSpan);
    
    const collapseBtn = document.createElement("button");
    collapseBtn.className = "collapse-toggle";
    collapseBtn.setAttribute("data-tooltip", "Collapse/Expand");
    collapseBtn.innerHTML = "▼";
    collapseBtn.addEventListener("click", function(e) {
      e.stopPropagation();
      columnDiv.classList.toggle("collapsed");
      this.classList.toggle("collapsed");
      const ul = columnDiv.querySelector("ul");
      if (ul) {
        ul.style.display = columnDiv.classList.contains("collapsed") ? "none" : "";
      }
      saveColumnState();
    });
    summary.appendChild(collapseBtn);
    
    summary.addEventListener("click", function(e) {
      if (e.target === collapseBtn) return;
      collapseBtn.click();
    });
    
    columnDiv.appendChild(summary);

    const ul = document.createElement("ul");
    ul.className = "bookmark-list";
    
    if (col.children && col.children.length > 0) {
      col.children.forEach(function(bm) {
      const li = document.createElement("li");
      li.className = "bookmark-item";
      li.setAttribute("data-url", bm.url);
      if (bm.id) li.setAttribute("data-bookmark-id", bm.id);
      if (bm.parentId) li.setAttribute("data-bookmark-parent-id", bm.parentId);
      if (Number.isInteger(bm.index)) li.setAttribute("data-bookmark-index", bm.index);
      if (bm.isDuplicate) li.classList.add("duplicate");
      if (typeof isBrokenLink === "function" && isBrokenLink(bm.url)) li.classList.add("broken");

        // Create favicon image
        const favicon = document.createElement("img");
        favicon.className = "favicon";
        const faviconUrl = bm.faviconUrl || getFaviconUrl(bm.url);
        if (faviconUrl) favicon.src = faviconUrl;
        else favicon.style.display = "none";
        favicon.alt = "";
        favicon.onerror = function() {
          this.style.display = "none";
        };
        
        const link = document.createElement("a");
        link.href = bm.url;
        link.className = "bookmark-link";
        link.setAttribute("data-url", bm.url);
        link.textContent = bm.title;
        if (typeof isBrokenLink === "function" && isBrokenLink(bm.url)) {
          const indicator = document.createElement("span");
          indicator.className = "broken-indicator";
          indicator.setAttribute("data-tooltip", "Link may be broken or inaccessible");
          link.insertBefore(indicator, link.firstChild);
        }
        
        // Age badge
        if (bm.dateAdded) {
          const age = getBookmarkAge(bm.dateAdded);
          if (age) {
            const badge = document.createElement("span");
            badge.className = "bookmark-age-badge " + age.className;
            badge.textContent = age.label;
            badge.title = "Added " + age.title;
            link.appendChild(badge);
          }
        }
        link.draggable = localStorage.getItem("bookmarkSortPreference") === "manual";
        link.setAttribute("data-source", "render");
        
        // Drag event handlers for bookmark items
        link.addEventListener("dragstart", function(e) {
          e.stopPropagation();
          const url = this.getAttribute("data-url");
          const bookmarkId = this.closest("li.bookmark-item")?.getAttribute("data-bookmark-id");
          const bm = this.closest("li.bookmark-item");
          if (url && bm) {
            // Store the bookmark URL and element for drag operations
            e.dataTransfer.setData("text/plain", url);
            if (bookmarkId) e.dataTransfer.setData("application/x-hello-stitch-bookmark-id", bookmarkId);
            e.dataTransfer.effectAllowed = "move";
            // Add dragging class for visual feedback
            this.classList.add("dragging");
            bm.classList.add("dragging");
            // Show drag preview
            const dragPreview = document.createElement("div");
            dragPreview.className = "drag-preview";
            dragPreview.textContent = this.textContent;
            document.body.appendChild(dragPreview);
            window.dragPreview = dragPreview;
          }
        });
        
        link.addEventListener("dragend", function(e) {
          e.stopPropagation();
          this.classList.remove("dragging");
          const bm = this.closest("li.bookmark-item");
          if (bm) bm.classList.remove("dragging");
          if (window.dragPreview) {
            window.dragPreview.remove();
            window.dragPreview = null;
          }
          // Remove any visual indicators
          document.querySelectorAll(".drag-over").forEach(el => {
            el.classList.remove("drag-over");
          });
        });
        
        link.insertBefore(favicon, link.firstChild);
        
        li.appendChild(link);

        const urlDiv = document.createElement("div");
        urlDiv.className = "url";
        urlDiv.textContent = cleanUrlForDisplay(bm.url);
        li.appendChild(urlDiv);

        // AI Tags display
        const bmTags = window.tagsByUrl && window.tagsByUrl[bm.url];
        if (bmTags && bmTags.length > 0) {
          const tagsContainer = document.createElement("div");
          tagsContainer.className = "bookmark-tags";
          
          bmTags.forEach(function(tag) {
            const tagSpan = document.createElement("span");
            tagSpan.className = "bookmark-tag";
            tagSpan.textContent = tag;
            tagSpan.setAttribute("data-tag", tag);
            tagSpan.style.cursor = "pointer";
            tagSpan.title = "Click to filter by: " + tag;
            tagSpan.addEventListener("click", function(e) {
              e.preventDefault();
              e.stopPropagation();
              if (typeof filterByTag === "function") {
                filterByTag(tag);
              }
            });
            tagsContainer.appendChild(tagSpan);
          });
          
          li.appendChild(tagsContainer);
        }

        // Action buttons container
        const actionsDiv = document.createElement("div");
        actionsDiv.style.display = "flex";
        actionsDiv.style.gap = "0.5em";
        actionsDiv.style.marginTop = "0.3em";

        // Pin button - Add click handler directly
        const pinBtn = document.createElement("button");
        pinBtn.className = "pin-btn";
        pinBtn.setAttribute("data-url", bm.url);
        pinBtn.setAttribute("data-tooltip", "Pin bookmark to top");
        pinBtn.textContent = "☆";
        pinBtn.addEventListener("click", function(e) {
          e.preventDefault();
          e.stopPropagation();
          const url = this.getAttribute("data-url");
          if (url && typeof togglePin === "function") {
            togglePin(url);
          }
        });
        actionsDiv.appendChild(pinBtn);

        // Copy URL button - Add click handler directly
        const copyBtn = document.createElement("button");
        copyBtn.className = "copy-url-btn";
        copyBtn.setAttribute("data-url", bm.url);
        copyBtn.setAttribute("data-tooltip", "Copy URL to clipboard");
        copyBtn.textContent = "📋";
        copyBtn.addEventListener("click", function(e) {
          e.preventDefault();
          e.stopPropagation();
          const url = this.getAttribute("data-url");
          if (url && navigator.clipboard) {
            navigator.clipboard.writeText(url).then(() => {
              const old = this.textContent;
              this.textContent = "✓";
              setTimeout(() => { this.textContent = old || "📋"; }, 1000);
            });
          }
        });
        actionsDiv.appendChild(copyBtn);

        // Edit button
        const editBtn = document.createElement("button");
        editBtn.className = "edit-bookmark-btn";
        editBtn.setAttribute("data-bookmark-id", bm.id || "");
        editBtn.setAttribute("data-url", bm.url);
        editBtn.setAttribute("data-title", bm.title);
        editBtn.setAttribute("data-tooltip", "Edit bookmark");
        editBtn.textContent = "✎";
        actionsDiv.appendChild(editBtn);

        // Delete button
        const deleteBtn = document.createElement("button");
        deleteBtn.className = "delete-bookmark-btn";
        deleteBtn.setAttribute("data-bookmark-id", bm.id || "");
        deleteBtn.setAttribute("data-url", bm.url);
        deleteBtn.setAttribute("data-tooltip", "Delete bookmark");
        deleteBtn.textContent = "✕";
        actionsDiv.appendChild(deleteBtn);

        // Notes button
        const notesBtn = document.createElement("button");
        notesBtn.className = "notes-btn";
        notesBtn.setAttribute("data-url", bm.url);
        notesBtn.setAttribute("data-tooltip", "Add note");
        notesBtn.textContent = "📝";
        notesBtn.addEventListener("click", function(e) {
          e.preventDefault();
          e.stopPropagation();
          const url = this.getAttribute("data-url");
          if (url && typeof openNotesModal === "function") {
            openNotesModal(url);
          }
        });
        actionsDiv.appendChild(notesBtn);

        // Checkbox for multi-select - handled by both render.js and script.js for reliability
        const checkboxWrapper = document.createElement("div");
        checkboxWrapper.className = "bookmark-select-wrapper";
        const checkbox = document.createElement("input");
        checkbox.type = "checkbox";
        checkbox.className = "bookmark-checkbox";
        checkbox.setAttribute("data-url", bm.url);
        checkbox.setAttribute("data-bookmark-id", bm.id || "");
        checkbox.setAttribute("data-title", bm.title);
        checkbox.setAttribute("data-tooltip", "Select for bulk actions");
        const selectionKey = bm.id ? String(bm.id) : bm.url;
        checkbox.checked = window.selectedBookmarks.has(selectionKey);
        if (checkbox.checked) li.classList.add("selected");
        
        // Add change event listener directly to checkbox for reliable multi-select
        checkbox.addEventListener("change", function(e) {
          const url = this.getAttribute("data-url");
          if (!url) return;
          
          // Access selectedBookmarks from window object (defined in script.js)
          const bookmarksSet = window.selectedBookmarks;
          const key = this.getAttribute("data-bookmark-id") || url;
          
          if (this.checked) {
            bookmarksSet.add(key);
            this.closest(".bookmark-item").classList.add("selected");
          } else {
            bookmarksSet.delete(key);
            this.closest(".bookmark-item").classList.remove("selected");
          }
          if (typeof window.updateMultiSelectBar === "function") {
            window.updateMultiSelectBar();
          }
        });
        
        checkboxWrapper.appendChild(checkbox);
        actionsDiv.insertBefore(checkboxWrapper, actionsDiv.firstChild);

        li.appendChild(actionsDiv);

        // Note hover preview
        const bmNotes = window.bookmarkNotes && window.bookmarkNotes[bm.url];
        if (bmNotes && bmNotes.trim()) {
          const notePreview = document.createElement("div");
          notePreview.className = "bookmark-note-preview";
          notePreview.textContent = bmNotes;
          li.appendChild(notePreview);
        }

        li.addEventListener("contextmenu", function(e) {
          e.preventDefault();
          e.stopPropagation();
          const url = this.querySelector(".bookmark-link") && this.querySelector(".bookmark-link").getAttribute("data-url");
          if (!url) return;
          const menu = document.getElementById("context-menu");
          if (!menu) return;
          menu._currentUrl = url;
          const x = Math.min(e.clientX, window.innerWidth - 240);
          const y = Math.min(e.clientY, window.innerHeight - 280);
          menu.style.left = x + "px";
          menu.style.top = y + "px";
          menu.classList.add("visible");
        });

        ul.appendChild(li);
      });
    }

    columnDiv.appendChild(ul);
    
    // Restore collapsed state from localStorage
    if (typeof loadColumnState === "function") {
      const state = loadColumnState();
      const saved = state.find(function(s) { return s.title === col.title; });
      if (saved && saved.collapsed) {
        columnDiv.classList.add("collapsed");
        collapseBtn.classList.add("collapsed");
        ul.style.display = "none";
      }
    }
    
    const resizeHandle = document.createElement("div");
    resizeHandle.className = "column-resize-handle";
    columnDiv.appendChild(resizeHandle);
    
    container.appendChild(columnDiv);
  });

  // Update container class based on number of columns
  updateContainerClass();
  setupDragAndDrop();
}

function updateContainerClass() {
  const container = document.getElementById("container");
  if (!container) return;
  
  const visibleColumns = Array.from(
    container.querySelectorAll(".dynamic-column")
  ).filter(function(col) { return col.offsetParent !== null; });

  container.classList.remove("single-folder", "two-folders", "justify-center");
  if (visibleColumns.length === 1) {
    container.classList.add("single-folder");
  } else if (visibleColumns.length === 2) {
    container.classList.add("two-folders");
  }
}

function performBookmarkMove(columns, draggedBookmark, targetItem) {
  const result = { columns: columns, moved: false };
  
  // Find the source column and index
  let srcColIndex = -1, srcCol = null, srcIdx = -1;
  columns.forEach((col, colIndex) => {
    col.children.forEach((bm, idx) => {
      const matchesSource = draggedBookmark.id
        ? String(bm.id) === String(draggedBookmark.id)
        : bm.url === draggedBookmark.url;
      if (matchesSource) {
        srcColIndex = colIndex;
        srcCol = col;
        srcIdx = idx;
      }
    });
  });
  
  if (!srcCol || srcIdx === -1) return result;
  
  // Find the target column and index
  let dstColIndex = -1, dstCol = null, dstIdx = -1;
  const targetBookmarkId = targetItem.getAttribute("data-bookmark-id");
  columns.forEach((col, colIndex) => {
    col.children.forEach((bm, idx) => {
      const matchesTarget = targetBookmarkId
        ? String(bm.id) === targetBookmarkId
        : bm.url === targetItem.getAttribute("data-url");
      if (matchesTarget) {
        dstColIndex = colIndex;
        dstCol = col;
        dstIdx = idx;
      }
    });
  });
  
  if (!dstCol || dstIdx === -1) return result;
  if (srcCol === dstCol && srcIdx === dstIdx) return result;
  
  // Perform the move
  const [movedBookmark] = srcCol.children.splice(srcIdx, 1);
  if (srcCol === dstCol && srcIdx < dstIdx) dstIdx--; // Adjust if dropping before moved item
  dstCol.children.splice(dstIdx, 0, movedBookmark);
  
  result.moved = true;
  return result;
}

function performColumnMove(columns, draggedUrl, targetColumn) {
  const result = { columns: columns, moved: false };
  
  // Find the source bookmark (the one being dragged)
  let srcColIndex = -1, srcCol = null, srcIdx = -1;
  columns.forEach((col, colIndex) => {
    col.children.forEach((bm, idx) => {
      if (bm.url === draggedUrl) {
        srcColIndex = colIndex;
        srcCol = col;
        srcIdx = idx;
      }
    });
  });
  
  if (!srcCol || srcIdx === -1) return result;
  
  // Find the target column
  let dstColIndex = -1, dstCol = null;
  columns.forEach((col, colIndex) => {
    if (col.title === targetColumn.getAttribute("data-column-title")) {
      dstColIndex = colIndex;
      dstCol = col;
    }
  });
  
  if (!dstCol) return result;
  
  // Perform the move
  const [movedBookmark] = srcCol.children.splice(srcIdx, 1);
  dstCol.children.push(movedBookmark);
  
  result.moved = true;
  return result;
}

function setupDragAndDrop() {
  const container = document.getElementById("container");
  if (!container || container.dataset.dragDropSetup === "true") return;
  container.dataset.dragDropSetup = "true";

  container.addEventListener("dragover", function(e) {
    e.preventDefault();
    const target = e.target.closest("li.bookmark-item, .dynamic-column");
    if (target) {
      // Highlight potential drop targets
      target.classList.add("drag-over");
    }
  });
  
  container.addEventListener("dragleave", function(e) {
    const target = e.target.closest("li.bookmark-item, .dynamic-column");
    if (target) {
      target.classList.remove("drag-over");
    }
  });
  
  container.addEventListener("drop", function(e) {
    e.preventDefault();
    const target = e.target.closest("li.bookmark-item, .dynamic-column");
    if (!target) return;

    const draggedBookmarkId = e.dataTransfer.getData("application/x-hello-stitch-bookmark-id");
    const draggedUrl = e.dataTransfer.getData("text/plain");
    if (!draggedBookmarkId && !draggedUrl) return;

    document.querySelectorAll(".drag-over").forEach(el => {
      el.classList.remove("drag-over");
    });

    const sourceBookmark = columns.flatMap((column) => column.children)
      .find((bookmark) => draggedBookmarkId
        ? String(bookmark.id) === draggedBookmarkId
        : bookmark.url === draggedUrl);
    if (!sourceBookmark) return;

    let destinationParentId;
    let destinationIndex;
    if (target.classList.contains("bookmark-item")) {
      const targetBookmarkId = target.getAttribute("data-bookmark-id");
      if (targetBookmarkId === draggedBookmarkId) return;
      destinationParentId = target.getAttribute("data-bookmark-parent-id");
      const targetIndex = target.getAttribute("data-bookmark-index");
      if (targetIndex !== null) destinationIndex = Number(targetIndex);
    } else {
      destinationParentId = target.getAttribute("data-folder-id");
    }
    if (!destinationParentId) return;

    if (draggedBookmarkId && typeof window.moveBookmarkInBrowser === "function") {
      window.moveBookmarkInBrowser(
        draggedBookmarkId,
        destinationParentId,
        Number.isInteger(destinationIndex) ? destinationIndex : undefined,
        sourceBookmark.parentId,
        sourceBookmark.index
      );
      return;
    }

    const result = target.classList.contains("bookmark-item")
      ? performBookmarkMove(columns, sourceBookmark, target)
      : performColumnMove(columns, draggedUrl, target);
    if (result.moved) render(result.columns);
  });

  container.addEventListener("dragend", function() {
    document.querySelectorAll(".drag-over").forEach((element) => {
      element.classList.remove("drag-over");
    });
  });
}

function updateHeaderDropdown() {
  const dropdown = document.getElementById("bookmark-filter-dropdown");
  if (!dropdown) return;

  dropdown.innerHTML = "";

  const containerColumns = columns || window.columns;
  if (!containerColumns || containerColumns.length === 0) return;

  containerColumns.forEach(col => {
    if (col.title === "/") return;

    const btn = document.createElement("button");
    btn.className = "filter-button";
    btn.textContent = col.title;
    btn.setAttribute("data-column-title", col.title);
    btn.title = "Filter by " + col.title;
    btn.addEventListener("click", function() {
      filterByCategory(col.title.toLowerCase());
      updateCloseAllVisibility();
    });
    dropdown.appendChild(btn);
  });
}

// Expose drag-and-drop functions globally
window.performBookmarkMove = performBookmarkMove;
window.performColumnMove = performColumnMove;
window.setupDragAndDrop = setupDragAndDrop;
window.updateHeaderDropdown = updateHeaderDropdown;
