const { getStore } = require("@netlify/blobs");

function artStore() {
  return getStore({
    name: "art",
    siteID: process.env.SITE_ID,
    token: process.env.BLOBS_TOKEN,
  });
}

exports.handler = async () => {
  try {
    const store = artStore();
    const { blobs } = await store.list();

    const items = await Promise.all(
      blobs.map((b) => store.get(b.key, { type: "json" }).catch(() => null))
    );

    const cleaned = items
      .filter(Boolean)
      .sort((a, b) => (a.uploadedAt || 0) - (b.uploadedAt || 0));

    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json", "Cache-Control": "no-store" },
      body: JSON.stringify(cleaned),
    };
  } catch (err) {
    console.error("list-art error:", err && err.stack ? err.stack : err);
    // If Blobs isn't set up yet, fail soft with an empty list rather than breaking the page.
    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify([]),
    };
  }
};
