const assert = require("assert");
const { removeBookmarkById, updateBookmarkAndMove } = require("../bookmark-actions");

function createApi() {
  const nodes = new Map([
    ["one", { id: "one", title: "First copy", url: "https://same.example/", parentId: "folder-a" }],
    ["two", { id: "two", title: "Second copy", url: "https://same.example/", parentId: "folder-a" }],
  ]);
  const calls = [];
  return {
    nodes,
    calls,
    api: {
      update(id, changes, callback) {
        const node = nodes.get(id);
        Object.assign(node, changes);
        calls.push(["update", id]);
        callback(node);
      },
      get(id, callback) {
        callback([nodes.get(id)]);
      },
      move(id, destination, callback) {
        nodes.get(id).parentId = destination.parentId;
        calls.push(["move", id, destination.parentId]);
        callback(nodes.get(id));
      },
      remove(id, callback) {
        calls.push(["remove", id]);
        nodes.delete(id);
        callback();
      },
    },
  };
}

async function run() {
  const { api, nodes, calls } = createApi();
  await updateBookmarkAndMove(api, {}, "two", {
    title: "Edited second copy",
    url: "https://same.example/",
  }, "folder-b");
  assert.strictEqual(nodes.get("two").title, "Edited second copy");
  assert.strictEqual(nodes.get("two").parentId, "folder-b");
  assert.strictEqual(nodes.get("one").title, "First copy");
  assert.deepStrictEqual(calls.slice(0, 2), [["update", "two"], ["move", "two", "folder-b"]]);

  await removeBookmarkById(api, {}, "one");
  assert.strictEqual(nodes.has("one"), false);
  assert.strictEqual(nodes.has("two"), true);
  assert.deepStrictEqual(calls[2], ["remove", "one"]);

  await assert.rejects(() => removeBookmarkById(api, {}, ""), /ID is required/);
}

run().then(() => {
  console.log("bookmark actions tests passed");
}).catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
