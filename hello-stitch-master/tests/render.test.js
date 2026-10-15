const assert = require("assert");
const fs = require("fs");
const path = require("path");
const vm = require("vm");

const context = { window: {}, document: {} };
const source = fs.readFileSync(path.join(__dirname, "..", "render.js"), "utf8");
vm.runInNewContext(source, context);

const bookmarks = [
  { id: "first", url: "https://same.example/" },
  { id: "second", url: "https://same.example/" },
  { id: "third", url: "https://target.example/" },
];
const columns = [{ title: "Folder", children: bookmarks }];
const target = {
  getAttribute(name) {
    return name === "data-bookmark-id" ? "first" : null;
  },
};

const result = context.window.performBookmarkMove(columns, bookmarks[1], target);
assert.strictEqual(result.moved, true);
assert.deepStrictEqual(
  columns[0].children.map((bookmark) => bookmark.id),
  ["second", "first", "third"]
);

console.log("render tests passed");
