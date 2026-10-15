function callBookmarkApi(runtime, method, ...args) {
  return new Promise((resolve, reject) => {
    method(...args, (result) => {
      const error = runtime && runtime.lastError;
      if (error) reject(new Error(error.message));
      else resolve(result);
    });
  });
}

function findBookmarkRoot(tree, rootFolderPattern, preferredRootId) {
  const root = tree && tree[0];
  if (!root) return null;
  const stack = [...(root.children || [])];
  let fallback = null;
  while (stack.length) {
    const node = stack.shift();
    if (!node.children) continue;
    if (preferredRootId && String(node.id) === String(preferredRootId)) return node;
    if (!fallback && rootFolderPattern.test(node.title)) fallback = node;
    stack.unshift(...node.children);
  }
  return fallback;
}

function analyzeBookmarkImport(imported, tree, rootFolderPattern, preferredRootId) {
  const rootFolder = findBookmarkRoot(tree, rootFolderPattern, preferredRootId);
  if (!rootFolder) throw new Error("The configured bookmarks folder could not be found.");

  const root = JSON.parse(JSON.stringify(rootFolder));
  const stats = { created: 0, updated: 0, unchanged: 0, duplicatesElsewhere: 0 };
  const items = [];
  const globallyExisting = new Set();
  const collectUrls = (node) => {
    for (const child of node.children || []) {
      if (child.url) globallyExisting.add(child.url);
      else collectUrls(child);
    }
  };
  collectUrls(tree[0]);

  function findOrAddFolder(parent, title) {
    parent.children = parent.children || [];
    let folder = parent.children.find((node) => node.children && node.title === title);
    if (!folder) {
      folder = { id: `preview-${stats.created}-${title}`, title, children: [] };
      parent.children.push(folder);
    }
    return folder;
  }

  for (const column of imported) {
    const columnFolder = column.title === "/" ? root : findOrAddFolder(root, column.title);
    for (const bookmark of column.children) {
      const path = bookmark.path[0] === column.title ? bookmark.path.slice(1) : bookmark.path;
      let parent = columnFolder;
      for (const folderName of path) parent = findOrAddFolder(parent, folderName);
      parent.children = parent.children || [];
      const existing = parent.children.find((node) => !node.children && node.url === bookmark.url);
      let action;
      if (existing) {
        if (existing.title !== bookmark.title) {
          existing.title = bookmark.title;
          stats.updated++;
          action = "Update title";
        } else {
          stats.unchanged++;
          action = "Already present";
        }
      } else {
        if (globallyExisting.has(bookmark.url)) {
          stats.duplicatesElsewhere++;
          action = "Add copy (URL exists elsewhere)";
        } else {
          action = "Add new bookmark";
        }
        const created = { title: bookmark.title, url: bookmark.url };
        parent.children.push(created);
        globallyExisting.add(bookmark.url);
        stats.created++;
      }
      items.push({
        title: bookmark.title,
        url: bookmark.url,
        path: [column.title, ...path],
        action,
      });
    }
  }
  return { stats, items };
}

async function importBookmarksToBrowser(imported, bookmarksApi, runtime, rootFolderPattern, preferredRootId) {
  let importedCount = 0;
  const stats = { created: 0, updated: 0, unchanged: 0, duplicatesElsewhere: 0 };
  try {
    const tree = await callBookmarkApi(runtime, bookmarksApi.getTree.bind(bookmarksApi));
    const rootFolder = findBookmarkRoot(tree, rootFolderPattern, preferredRootId);
    if (!rootFolder) {
      throw new Error("The configured bookmarks folder could not be found.");
    }
    const urlsElsewhere = new Set();
    const collectUrls = (node) => {
      for (const child of node.children || []) {
        if (child.url) urlsElsewhere.add(child.url);
        else collectUrls(child);
      }
    };
    if (tree[0]) collectUrls(tree[0]);

    async function ensureFolder(parent, title) {
      parent.children = parent.children || [];
      let folder = parent.children.find((node) => node.children && node.title === title);
      if (!folder) {
        folder = await callBookmarkApi(runtime, bookmarksApi.create.bind(bookmarksApi), {
          parentId: parent.id,
          title,
        });
        folder.children = [];
        parent.children.push(folder);
      }
      return folder;
    }

    for (const column of imported) {
      const columnFolder = column.title === "/" ? rootFolder : await ensureFolder(rootFolder, column.title);
      for (const bookmark of column.children) {
        const path = bookmark.path[0] === column.title ? bookmark.path.slice(1) : bookmark.path;
        let parent = columnFolder;
        for (const folderName of path) {
          parent = await ensureFolder(parent, folderName);
        }

        parent.children = parent.children || [];
        const existing = parent.children.find((node) => !node.children && node.url === bookmark.url);
        if (existing) {
          if (existing.title !== bookmark.title) {
            await callBookmarkApi(runtime, bookmarksApi.update.bind(bookmarksApi), existing.id, {
              title: bookmark.title,
            });
            existing.title = bookmark.title;
            stats.updated++;
          } else {
            stats.unchanged++;
          }
        } else {
          if (urlsElsewhere.has(bookmark.url)) stats.duplicatesElsewhere++;
          const created = await callBookmarkApi(runtime, bookmarksApi.create.bind(bookmarksApi), {
            parentId: parent.id,
            title: bookmark.title,
            url: bookmark.url,
          });
          parent.children.push(created);
          urlsElsewhere.add(bookmark.url);
          stats.created++;
        }
        importedCount++;
      }
    }
    return stats;
  } catch (error) {
    error.processedCount = importedCount;
    throw error;
  }
}

if (typeof module !== "undefined" && module.exports) {
  module.exports = { analyzeBookmarkImport, findBookmarkRoot, importBookmarksToBrowser };
}
