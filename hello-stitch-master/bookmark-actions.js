function callBookmarkAction(runtime, method, ...args) {
  return new Promise((resolve, reject) => {
    method(...args, (result) => {
      const error = runtime && runtime.lastError;
      if (error) reject(new Error(error.message));
      else resolve(result);
    });
  });
}

async function updateBookmarkAndMove(bookmarksApi, runtime, bookmarkId, changes, destinationParentId) {
  const updated = await callBookmarkAction(runtime, bookmarksApi.update.bind(bookmarksApi), String(bookmarkId), changes);
  if (!destinationParentId) return updated;
  const current = await callBookmarkAction(runtime, bookmarksApi.get.bind(bookmarksApi), String(bookmarkId));
  const bookmark = Array.isArray(current) ? current[0] : current;
  if (!bookmark) throw new Error("The bookmark no longer exists.");
  if (String(bookmark.parentId) === String(destinationParentId)) return updated;
  return callBookmarkAction(runtime, bookmarksApi.move.bind(bookmarksApi), String(bookmarkId), {
    parentId: String(destinationParentId),
  });
}

function removeBookmarkById(bookmarksApi, runtime, bookmarkId) {
  if (!bookmarkId) return Promise.reject(new Error("A bookmark ID is required."));
  return callBookmarkAction(runtime, bookmarksApi.remove.bind(bookmarksApi), String(bookmarkId));
}

if (typeof module !== "undefined" && module.exports) {
  module.exports = { updateBookmarkAndMove, removeBookmarkById };
}
