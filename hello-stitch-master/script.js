const columns = [];

chrome.bookmarks.getTree((items) => {
    const bookmarksBar = items[0].children.find((x) =>
        options.ROOT_FOLDER.test(x.title)
    );

    if (!bookmarksBar) {
        console.error(`Was expecting a folder called '${options.ROOT_FOLDER}'`);
        return;
    }

    const rootBookmarks = bookmarksBar.children.filter(
        (node) => !node.children
    );

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
    filterMostVisited(); // Apply the "Most Visited" filter by default
});

const visit = (column, node, path = []) => {
    if (node.children) {
        node.children.forEach((x) => visit(column, x, [...path, node.title]));
        return;
    }

    addBookmark(column, node, path);
};

const addBookmark = (column, node, path = []) => {
    if (!node.url || node.url.startsWith("javascript:")) {
        // ignore bookmarklets
        return;
    }

    const isSeparator =
        options.SEPARATORS.includes(node.title) || node.type === "separator";

    const faviconUrl = `https://www.google.com/s2/favicons?domain=${new URL(node.url).hostname}`;

    column.children.push({
        title: node.title,
        url: node.url,
        path: path,
        isSeparator,
        faviconUrl,
    });
};

document.addEventListener("DOMContentLoaded", () => {
    document.body.style.background = options.BACKGROUND;
    updateTimestamp(); // Call the function to update the timestamp

    // Add event listener for search input
    document.getElementById('search-input').addEventListener('input', filterBookmarks);

    // Clear the search input field when the page reloads
    document.getElementById('search-input').value = '';

    // Add event listeners for filter buttons
    document.getElementById('filter-most-visited').addEventListener('click', filterMostVisited);

    // Generate the "Hello, Stitch" text with each letter in the Stitch theme
    const welcomeElement = document.getElementById("welcome");
    const titleText = options.TITLE;
    const colors = options.STITCH_THEME;
    titleText.split("").forEach((letter, index) => {
        const span = document.createElement("span");
        span.className = "stitch-theme";
        span.style.color = colors[index % colors.length];
        span.style.marginRight = "-2px"; // Adjust the margin to make letters closer
        span.textContent = letter;
        welcomeElement.appendChild(span);
    });
});

// Update the timestamp with the current date and time
function updateTimestamp() {
    const now = new Date();
    const formattedDate = now.toLocaleDateString();
    const hours = now.getHours();
    const minutes = now.getMinutes().toString().padStart(2, '0');
    const seconds = now.getSeconds().toString().padStart(2, '0');
    const ampm = hours >= 12 ? 'PM' : 'AM';
    const formattedHours = (hours % 12 || 12).toString().padStart(2, '0');
    const day = now.toLocaleDateString('en-US', { weekday: 'long' });

    document.getElementById('date').textContent = formattedDate;
    document.getElementById('hours').textContent = formattedHours;
    document.getElementById('minutes').textContent = minutes;
    document.getElementById('seconds').textContent = seconds;
    document.getElementById('ampm').textContent = ampm;
    document.getElementById('day').textContent = day;
}

// Optionally, update the timestamp every second
setInterval(updateTimestamp, 1000);

// Notify Firefox users to set their home page
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
    if (typeof browser !== 'undefined' && browser.history) {
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
    } else if (typeof chrome !== 'undefined' && chrome.history) {
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

// Generate filter buttons based on subfolders
function generateFilterButtons(folders) {
    const filterButtonsContainer = document.querySelector('.filter-buttons');
    const subfolders = [];

    const findSubfolders = (folder) => {
        if (folder.children) {
            folder.children.forEach(child => {
                if (child.children) {
                    subfolders.push(child);
                    findSubfolders(child);
                }
            });
        }
    };

    folders.forEach(folder => findSubfolders(folder));

    subfolders.sort((a, b) => a.title.localeCompare(b.title));

    subfolders.forEach(subfolder => {
        const button = document.createElement('button');
        button.className = 'filter-button';
        button.textContent = subfolder.title;
        button.addEventListener('click', () => filterBy(subfolder.title.toLowerCase()));
        filterButtonsContainer.appendChild(button);
    });

    // Add static filter button for "Recent"
    const recentButton = document.createElement('button');
    recentButton.className = 'filter-button';
    recentButton.textContent = 'Recent';
    recentButton.addEventListener('click', () => filterBy('recent'));
    filterButtonsContainer.appendChild(recentButton);

    // Add static filter button for "Reset" at the end
    const resetButton = document.createElement('button');
    resetButton.className = 'filter-button';
    resetButton.textContent = 'Reset';
    resetButton.addEventListener('click', resetFilters);
    filterButtonsContainer.appendChild(resetButton);
}

// Reset filters
function resetFilters() {
    const bookmarks = document.querySelectorAll('.bookmark-item');
    bookmarks.forEach(bookmark => {
        bookmark.style.display = '';
    });
    document.getElementById('search-input').value = ''; // Clear search input
}