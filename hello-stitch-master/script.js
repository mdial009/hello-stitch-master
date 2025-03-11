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
});

const visit = (column, node, path = []) => {
    if (node.children) {
        const subFolder = {
            title: node.title,
            children: [],
            path: [...path, node.title], // Set the path for subfolders
            hasChildren: true, // Indicate that this folder has children
        };

        node.children.forEach((x) => visit(subFolder, x, subFolder.path));

        column.children.push(subFolder);
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

    column.children.push({
        title: node.title,
        url: node.url,
        path: path,
        isSeparator,
    });
};

document.addEventListener("DOMContentLoaded", () => {
    document.body.style.background = options.BACKGROUND;
    document.getElementById("welcome").style.color = options.TITLE_COLOR;
    updateTimestamp(); // Call the function to update the timestamp
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
                `Hello, friend. On ${browser.name} you can make this your home page by setting the following URL in your home page preferences:`
            );
            console.log(window.location.href);
        }
    });
}