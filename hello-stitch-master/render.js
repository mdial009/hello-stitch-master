const render = (columns) => {
    const colors = [
        "#ea51b2",
        "#00f769",
        "#ebff87",
        "#62d6e8",
        "#b45bcf",
        "#a1efe4",
        "#e9e9f4",
    ];
    const root = document.getElementById("container");

    let colourIndex = 0;

    const renderColumn = (column) => {
        const listItems = column.children
            .map((bookmark) => {
                if (bookmark.children && bookmark.children.length) {
                    return `<li class="bookmark-item">
                        <div class="subfolder">
                            <h3 class="folder-title" style="color: ${colors[colourIndex]}" onclick="renderSubfolder('${bookmark.title}')">
                                ${bookmark.title}
                            </h3>
                        </div>
                    </li>`;
                }

                const title = bookmark.path
                    ? bookmark.path.slice(1).concat(bookmark.title).join("/") // join as path
                    : bookmark.title;

                if (bookmark.isSeparator) {
                    return '<li class="separator bookmark-item">&nbsp;</li>';
                }

                return `<li class="bookmark-item">
                        <a href="${bookmark.url}" ${
                    title.endsWith("…") ? `title="${bookmark.title}"` : ""
                }>
                            <img src="${bookmark.faviconUrl}" alt="" class="favicon"> ${title}
                        </a>
                        <div class="url">${bookmark.url}</div>
                    </li>`;
            })
            .join("");

        colourIndex = colourIndex >= colors.length - 1 ? 0 : colourIndex + 1;
        return `<div class="column">
                <h2 class="folder-name" style="color: ${colors[colourIndex]}">
                    ${column.title}
                </h2>
                <ul>${listItems}</ul>
            </div>`;
    };

    root.innerHTML = columns
        .filter((column) => column.children.length)
        .map(renderColumn)
        .join("");

    /*document.getElementById("welcome").innerHTML = options.TITLE;*/
};

const renderSubfolder = (title) => {
    const subfolder = findSubfolder(columns, title);
    if (subfolder) {
        render([subfolder]);
    }
};

const findSubfolder = (columns, title) => {
    for (const column of columns) {
        for (const child of column.children) {
            if (child.title === title) {
                return child;
            }
            if (child.children && child.children.length) {
                const result = findSubfolder([child], title);
                if (result) {
                    return result;
                }
            }
        }
    }
    return null;
};

// Toggle dropdown visibility
function toggleDropdown(element) {
    const dropdown = element.nextElementSibling;
    const arrow = element.querySelector('.arrow');
    if (dropdown.style.display === "none" || dropdown.style.display === "") {
        dropdown.style.display = "block";
        arrow.innerHTML = "&#9650;"; // Up arrow
    } else {
        dropdown.style.display = "none";
        arrow.innerHTML = "&#9660;"; // Down arrow
    }
}

// Filter bookmarks based on search input
function filterBookmarks() {
    const input = document.getElementById('search-input').value.toLowerCase();
    console.log(`Filtering bookmarks with input: ${input}`);
    const bookmarks = document.querySelectorAll('.bookmark-item');
    bookmarks.forEach(bookmark => {
        const title = bookmark.querySelector('a') ? bookmark.querySelector('a').textContent.toLowerCase() : '';
        console.log(`Checking bookmark: ${title}`);
        if (title.includes(input)) {
            bookmark.style.display = '';
        } else {
            bookmark.style.display = 'none';
        }
    });
}

// Filter bookmarks based on category
function filterBy(category) {
    const bookmarks = document.querySelectorAll('.bookmark-item');
    bookmarks.forEach(bookmark => {
        const title = bookmark.querySelector('a') ? bookmark.querySelector('a').textContent.toLowerCase() : '';
        if (title.includes(category.toLowerCase())) {
            bookmark.style.display = '';
        } else {
            bookmark.style.display = 'none';
        }
    });
}

// Filter bookmarks based on most visited
function filterMostVisited() {
    if (window.browser && browser.history) {
        browser.history.search({ text: '', maxResults: 100 }).then((results) => {
            const mostVisitedUrls = results.map(result => result.url);
            const bookmarks = document.querySelectorAll('.bookmark-item');
            bookmarks.forEach(bookmark => {
                const url = bookmark.querySelector('a') ? bookmark.querySelector('a').href : '';
                if (mostVisitedUrls.includes(url)) {
                    bookmark.style.display = '';
                } else {
                    bookmark.style.display = 'none';
                }
            });
        });
    } else if (window.chrome && chrome.history) {
        chrome.history.search({ text: '', maxResults: 100 }, (results) => {
            const mostVisitedUrls = results.map(result => result.url);
            const bookmarks = document.querySelectorAll('.bookmark-item');
            bookmarks.forEach(bookmark => {
                const url = bookmark.querySelector('a') ? bookmark.querySelector('a').href : '';
                if (mostVisitedUrls.includes(url)) {
                    bookmark.style.display = '';
                } else {
                    bookmark.style.display = 'none';
                }
            });
        });
    } else {
        console.error('History API is not available.');
    }
}

// Reset filters
function resetFilters() {
    const bookmarks = document.querySelectorAll('.bookmark-item');
    bookmarks.forEach(bookmark => {
        bookmark.style.display = '';
    });
    document.getElementById('search-input').value = ''; // Clear search input
}


