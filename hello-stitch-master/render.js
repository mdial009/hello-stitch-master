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
        isSubfolder: false
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
        parentTitle: col.title
      });
    });
  });

  // Render each flattened column
  flattenedColumns.forEach(function(col) {
    const columnDiv = document.createElement("div");
    columnDiv.className = "dynamic-column";

    const summary = document.createElement("div");
    summary.className = "column-summary";
    const displayTitle = col.displayTitle || col.title;
    summary.setAttribute("data-tooltip", "Path: " + col.title);
    summary.textContent = displayTitle;
    
    summary.style.cursor = "pointer";
    summary.addEventListener("click", function() {
      this.classList.toggle("collapsed");
      const ul = this.nextElementSibling;
      if (ul && ul.tagName === "UL") {
        ul.style.display = ul.style.display === "none" ? "" : "none";
      }
    });
    
    columnDiv.appendChild(summary);

    const ul = document.createElement("ul");
    
    if (col.children && col.children.length > 0) {
      col.children.forEach(function(bm) {
        const li = document.createElement("li");
        li.className = "bookmark-item";
        if (bm.isDuplicate) li.classList.add("duplicate");

        // Create favicon image
        const favicon = document.createElement("img");
        favicon.className = "favicon";
        favicon.src = bm.faviconUrl || getFaviconUrl(bm.url);
        favicon.alt = "";
        favicon.onerror = function() {
          this.style.display = "none";
        };
        
        const link = document.createElement("a");
        link.href = bm.url;
        link.className = "bookmark-link";
        link.setAttribute("data-url", bm.url);
        link.textContent = bm.title;
        
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
        editBtn.setAttribute("data-url", bm.url);
        editBtn.setAttribute("data-title", bm.title);
        editBtn.setAttribute("data-tooltip", "Edit bookmark");
        editBtn.textContent = "✎";
        actionsDiv.appendChild(editBtn);

        // Delete button
        const deleteBtn = document.createElement("button");
        deleteBtn.className = "delete-bookmark-btn";
        deleteBtn.setAttribute("data-url", bm.url);
        deleteBtn.setAttribute("data-tooltip", "Delete bookmark");
        deleteBtn.textContent = "✕";
        actionsDiv.appendChild(deleteBtn);

        // Checkbox for multi-select - handled by both render.js and script.js for reliability
        const checkboxWrapper = document.createElement("div");
        checkboxWrapper.className = "bookmark-select-wrapper";
        const checkbox = document.createElement("input");
        checkbox.type = "checkbox";
        checkbox.className = "bookmark-checkbox";
        checkbox.setAttribute("data-url", bm.url);
        checkbox.setAttribute("data-title", bm.title);
        checkbox.setAttribute("data-tooltip", "Select for bulk actions");
        
        // Add change event listener directly to checkbox for reliable multi-select
        checkbox.addEventListener("change", function(e) {
          const url = this.getAttribute("data-url");
          if (!url) return;
          
          // Access selectedBookmarks from window object (defined in script.js)
          const bookmarksSet = window.selectedBookmarks;
          
          if (this.checked) {
            bookmarksSet.add(url);
            this.closest(".bookmark-item").classList.add("selected");
          } else {
            bookmarksSet.delete(url);
            this.closest(".bookmark-item").classList.remove("selected");
          }
          if (typeof window.updateMultiSelectBar === "function") {
            window.updateMultiSelectBar();
          }
        });
        
        checkboxWrapper.appendChild(checkbox);
        actionsDiv.insertBefore(checkboxWrapper, actionsDiv.firstChild);

        li.appendChild(actionsDiv);
        ul.appendChild(li);
      });
    }

    columnDiv.appendChild(ul);
    container.appendChild(columnDiv);
  });

  // Update container class based on number of columns
  updateContainerClass();
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

// Expose Render globally
window.render = render;

