// Render functions for displaying bookmarks
function render(columns) {
  const container = document.getElementById("container");
  if (!container) return;
  
  container.innerHTML = "";

  if (!columns || columns.length === 0) {
    container.innerHTML = "<p>No bookmarks found</p>";
    return;
  }

  columns.forEach((col) => {
    const columnDiv = document.createElement("div");
    columnDiv.className = "dynamic-column";

    const summary = document.createElement("div");
    summary.className = "column-summary";
    summary.textContent = col.title;
    columnDiv.appendChild(summary);

    const ul = document.createElement("ul");
    
    if (col.children && col.children.length > 0) {
      // Group bookmarks by their subfolder path
      const subfolderGroups = {};
      col.children.forEach((bm) => {
        const pathKey = (bm.path && bm.path.length > 0) ? bm.path.join(" / ") : "";
        if (!subfolderGroups[pathKey]) {
          subfolderGroups[pathKey] = [];
        }
        subfolderGroups[pathKey].push(bm);
      });

      // Render each subfolder group
      Object.keys(subfolderGroups).forEach((pathKey) => {
        const groupBookmarks = subfolderGroups[pathKey];
        
          // Add subfolder header if there's a path (not empty string for root-level)
        if (pathKey !== "") {
          const subfolderHeader = document.createElement("div");
          subfolderHeader.className = "subfolder-header";
          
          // Display only the current (last) folder name, not the full path
          const pathParts = pathKey.split(" / ");
          subfolderHeader.textContent = pathParts[pathParts.length - 1];
          
          // Calculate depth based on path separator " / "
          const depth = pathKey.split(" / ").length - 1;
          subfolderHeader.setAttribute("data-depth", depth);
          
          // Add click to collapse/expand the subfolder group
          subfolderHeader.style.cursor = "pointer";
          subfolderHeader.addEventListener("click", function() {
            this.classList.toggle("collapsed");
            // Find all sibling elements until the next subfolder header and toggle display
            let sibling = this.nextElementSibling;
            while (sibling) {
              if (sibling.classList && sibling.classList.contains("subfolder-header")) {
                break; // Stop at next header
              }
              if (sibling.style) {
                sibling.style.display = sibling.style.display === 'none' ? '' : 'none';
              }
              sibling = sibling.nextElementSibling;
            }
          });
          
          ul.appendChild(subfolderHeader);
        }

        // Render bookmarks in this group
        groupBookmarks.forEach((bm) => {
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
          
          // Prepend favicon to link
          link.insertBefore(favicon, link.firstChild);
          
          li.appendChild(link);

          const urlDiv = document.createElement("div");
          urlDiv.className = "url";
          // Use cleaned URL for display
          urlDiv.textContent = cleanUrlForDisplay(bm.url);
          li.appendChild(urlDiv);

          // Add action buttons container
          const actionsDiv = document.createElement("div");
          actionsDiv.style.display = "flex";
          actionsDiv.style.gap = "0.5em";
          actionsDiv.style.marginTop = "0.3em";

          // Pin button
          const pinBtn = document.createElement("button");
          pinBtn.className = "pin-btn";
          pinBtn.setAttribute("data-url", bm.url);
          pinBtn.textContent = "☆";
          actionsDiv.appendChild(pinBtn);

          // Copy URL button
          const copyBtn = document.createElement("button");
          copyBtn.className = "copy-url-btn";
          copyBtn.setAttribute("data-url", bm.url);
          copyBtn.textContent = "📋";
          actionsDiv.appendChild(copyBtn);

          // Edit button
          const editBtn = document.createElement("button");
          editBtn.className = "edit-bookmark-btn";
          editBtn.setAttribute("data-url", bm.url);
          editBtn.setAttribute("data-title", bm.title);
          editBtn.textContent = "✎";
          actionsDiv.appendChild(editBtn);

          // Delete button
          const deleteBtn = document.createElement("button");
          deleteBtn.className = "delete-bookmark-btn";
          deleteBtn.setAttribute("data-url", bm.url);
          deleteBtn.textContent = "✕";
          actionsDiv.appendChild(deleteBtn);

          // Checkbox for multi-select
          const checkboxWrapper = document.createElement("div");
          checkboxWrapper.className = "bookmark-select-wrapper";
          const checkbox = document.createElement("input");
          checkbox.type = "checkbox";
          checkbox.className = "bookmark-checkbox";
          checkbox.setAttribute("data-url", bm.url);
          checkbox.setAttribute("data-title", bm.title);
          checkboxWrapper.appendChild(checkbox);
          actionsDiv.insertBefore(checkboxWrapper, actionsDiv.firstChild);

          li.appendChild(actionsDiv);
          ul.appendChild(li);
        });
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
  ).filter((col) => col.offsetParent !== null);

  container.classList.remove("single-folder", "two-folders", "justify-center");
  if (visibleColumns.length === 1) {
    container.classList.add("single-folder");
  } else if (visibleColumns.length === 2) {
    container.classList.add("two-folders");
  }
}

// Expose render globally
window.render = render;
