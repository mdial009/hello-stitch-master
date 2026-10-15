const assert = require("assert");
const {
  analyzeBookmarkImport,
  findBookmarkRoot,
  importBookmarksToBrowser,
} = require("../bookmark-import");

function createBookmarkApi() {
  const root = {
    id: "bar",
    title: "Bookmarks Bar",
    children: [
      {
        id: "projects",
        title: "Projects",
        children: [
          {
            id: "existing",
            title: "Old title",
            url: "https://example.com/",
            parentId: "projects",
          },
        ],
      },
      {
        id: "other",
        title: "Other",
        children: [{
          id: "duplicate",
          title: "Keep in Other",
          url: "https://example.com/",
          parentId: "other",
        }],
      },
    ],
  };
  let nextId = 1;
  let updates = [];

  function findNode(id, node = root) {
    if (node.id === id) return node;
    for (const child of node.children || []) {
      const found = findNode(id, child);
      if (found) return found;
    }
    return null;
  }

  return {
    root,
    get updates() {
      return updates;
    },
    api: {
      getTree(callback) {
        callback([{ children: [root] }]);
      },
      create(details, callback) {
        const node = {
          ...details,
          id: `created-${nextId++}`,
          parentId: details.parentId,
          ...(details.url ? {} : { children: [] }),
        };
        callback(node);
      },
      update(id, changes, callback) {
        const node = findNode(id);
        Object.assign(node, changes);
        updates.push({ id, changes });
        callback(node);
      },
    },
  };
}

async function run() {
  const { api, root, updates } = createBookmarkApi();
  const count = await importBookmarksToBrowser([
    {
      title: "Projects",
      children: [
        {
          title: "New title",
          url: "https://example.com/",
          path: ["Projects"],
        },
        {
          title: "Nested bookmark",
          url: "https://nested.example/",
          path: ["Projects", "Dev"],
        },
      ],
    },
    {
      title: "/",
      children: [{
        title: "Root bookmark",
        url: "https://root.example/",
        path: [],
      }],
    },
    {
      title: "Imported",
      children: [{
        title: "Copy of example",
        url: "https://example.com/",
        path: ["Imported"],
      }],
    },
  ], api, {}, /bookmarks\s*bar/i);

  assert.deepStrictEqual(count, {
    created: 3,
    updated: 1,
    unchanged: 0,
    duplicatesElsewhere: 1,
  });
  assert.deepStrictEqual(updates, [{ id: "existing", changes: { title: "New title" } }]);
  assert.strictEqual(root.children[0].children[0].title, "New title");
  assert.strictEqual(root.children[1].children[0].title, "Keep in Other");
  assert.strictEqual(root.children[0].children[1].title, "Dev");
  assert.strictEqual(root.children[0].children[1].children[0].url, "https://nested.example/");
  assert.strictEqual(root.children[0].children[1].children[0].parentId, "created-1");
  assert.strictEqual(root.children[0].children[1].children.length, 1);
  assert.strictEqual(root.children[2].url, "https://root.example/");
  assert.strictEqual(root.children[3].children[0].url, "https://example.com/");

  const preview = analyzeBookmarkImport([{
    title: "Projects",
    children: [
      { title: "New title", url: "https://example.com/", path: ["Projects"] },
      { title: "New bookmark", url: "https://new.example/", path: ["Projects"] },
      { title: "Copy elsewhere", url: "https://example.com/", path: ["Elsewhere"] },
    ],
  }], [{ children: [root] }], /bookmarks\s*bar/i);
  assert.deepStrictEqual(preview.stats, {
    created: 2,
    updated: 0,
    unchanged: 1,
    duplicatesElsewhere: 1,
  });
  assert.deepStrictEqual(preview.items.map((item) => item.action), [
    "Already present",
    "Add new bookmark",
    "Add copy (URL exists elsewhere)",
  ]);
  assert.strictEqual(findBookmarkRoot([{ children: [root] }], /bookmarks\s*bar/i).id, "bar");
  assert.strictEqual(findBookmarkRoot([{ children: [{ id: "toolbar", title: "Bookmarks Toolbar", children: [] }] }], /never-match/i), null);
  const chosenFolder = { id: "chosen", title: "My Bookmarks", children: [] };
  assert.strictEqual(
    findBookmarkRoot([{ children: [chosenFolder] }], /never-match/i, "chosen"),
    chosenFolder
  );

  await assert.rejects(
    () => importBookmarksToBrowser([], {
      getTree(callback) {
        callback([{ children: [] }]);
      },
    }, {}, /bookmarks\s*bar/i),
    /configured bookmarks folder/
  );

  let createdCount = 0;
  const runtime = { lastError: null };
  const partialApi = {
    getTree(callback) { callback([{ children: [{ id: "bar", title: "Bookmarks Bar", children: [] }] }]); },
    create(details, callback) {
      createdCount++;
      if (createdCount === 2) {
        runtime.lastError = { message: "Disk full" };
        callback(undefined);
        runtime.lastError = null;
      } else {
        callback({ ...details, id: "partial-created", parentId: details.parentId });
      }
    },
  };
  await assert.rejects(
    () => importBookmarksToBrowser([{
      title: "/",
      children: [
        { title: "First", url: "https://first.example/", path: [] },
        { title: "Second", url: "https://second.example/", path: [] },
      ],
    }], partialApi, runtime, /bookmarks\s*bar/i),
    (error) => error.message === "Disk full" && error.processedCount === 1
  );
}

run().then(() => {
  console.log("bookmark import tests passed");
}).catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
