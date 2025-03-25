const columns = [];

// Expanded mock data for testing with Live Server
const mockBookmarks = [
  {
    title: "Bookmarks Bar",
    children: [
      {
        title: "Google",
        url: "https://www.google.com",
      },
      {
        title: "GitHub",
        url: "https://www.github.com",
      },
      {
        title: "Stack Overflow",
        url: "https://stackoverflow.com",
      },
      {
        title: "MDN Web Docs",
        url: "https://developer.mozilla.org",
      },
      {
        title: "Folder 1",
        children: [
          {
            title: "Sub Google",
            url: "https://www.google.com",
          },
          {
            title: "Sub GitHub",
            url: "https://www.github.com",
          },
          ...Array.from({ length: 98 }, (_, i) => ({
            title: `Sub Bookmark ${i + 1}`,
            url: `https://example.com/sub/${i + 1}`,
          })),
        ],
      },
      {
        title: "Folder 2",
        children: [
          {
            title: "Sub Stack Overflow",
            url: "https://stackoverflow.com",
          },
          {
            title: "Sub MDN Web Docs",
            url: "https://developer.mozilla.org",
          },
          ...Array.from({ length: 98 }, (_, i) => ({
            title: `Sub Bookmark ${i + 1}`,
            url: `https://example.com/sub/${i + 1}`,
          })),
        ],
      },
      ...Array.from({ length: 90 }, (_, i) => ({
        title: `Bookmark ${i + 1}`,
        url: `https://example.com/${i + 1}`,
      })),
    ],
  },
  {
    title: "Other Bookmarks",
    children: [
      {
        title: "YouTube",
        url: "https://www.youtube.com",
      },
      {
        title: "Reddit",
        url: "https://www.reddit.com",
      },
      {
        title: "Folder 3",
        children: [
          {
            title: "Sub YouTube",
            url: "https://www.youtube.com",
          },
          {
            title: "Sub Reddit",
            url: "https://www.reddit.com",
          },
          ...Array.from({ length: 98 }, (_, i) => ({
            title: `Sub Bookmark ${i + 1}`,
            url: `https://example.com/sub/${i + 1}`,
          })),
        ],
      },
      ...Array.from({ length: 90 }, (_, i) => ({
        title: `Other Bookmark ${i + 1}`,
        url: `https://example.com/other/${i + 1}`,
      })),
    ],
  },
];

const processBookmarks = (items) => {
  console.log("Bookmarks Tree:", items); // Debug log

  const bookmarksBar = items.find((x) => options.ROOT_FOLDER.test(x.title));

  if (!bookmarksBar) {
    console.error(`Was expecting a folder called '${options.ROOT_FOLDER}'`);
    return; // Exit if the root folder is not found
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

  console.log("Columns:", columns); // Debug log
  render(columns);
};

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

  column.children.push({
    title: node.title,
    url: node.url,
    path: path,
    isSeparator,
  });
};

const updateTimestamp = () => {
  const now = new Date();
  const hours = now.getHours().toString().padStart(2, "0");
  const minutes = now.getMinutes().toString().padStart(2, "0");
  const seconds = now.getSeconds().toString().padStart(2, "0");
  const month = (now.getMonth() + 1).toString().padStart(2, "0");
  const day = now.getDate().toString().padStart(2, "0");
  const year = now.getFullYear();
  const ampm = hours >= 12 ? "PM" : "AM";
  const formattedHours = (hours % 12 || 12).toString().padStart(2, "0");
  const date = `${month}/${day}/${year}`;
  const time = `${formattedHours}:${minutes}:${seconds} ${ampm}`;
  document.getElementById("hours").innerText = formattedHours;
  document.getElementById("minutes").innerText = minutes;
  document.getElementById("seconds").innerText = seconds;
  document.getElementById("ampm").innerText = ampm;
  document.getElementById("date").innerText = date;
};

document.addEventListener("DOMContentLoaded", () => {
  document.body.style.background = options.BACKGROUND;
  document.getElementById("welcome").style.color = options.TITLE_COLOR;
  document.getElementById("welcome").innerText = options.TITLE;
  console.log("DOMContentLoaded event fired"); // Debug log

  // Use mock data for testing with Live Server
  processBookmarks(mockBookmarks);

  // Update the timestamp
  updateTimestamp();
  setInterval(updateTimestamp, 1000); // Update the timestamp every second
});

// notify firefox users to set their home page
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
