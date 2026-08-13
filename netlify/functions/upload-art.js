const { getStore } = require("@netlify/blobs");

const MAX_BYTES = 4.5 * 1024 * 1024; // ~4.5MB safety margin under the request limit
const CORNERS = ["🍀", "💠", "🌸", "🌷"];

exports.handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: JSON.stringify({ error: "Method not allowed." }) };
  }

  let body;
  try {
    body = JSON.parse(event.body || "{}");
  } catch (err) {
    return { statusCode: 400, body: JSON.stringify({ error: "Invalid request body." }) };
  }

  const { title, dataUrl } = body;

  if (!dataUrl || typeof dataUrl !== "string" || !dataUrl.startsWith("data:image/")) {
    return { statusCode: 400, body: JSON.stringify({ error: "Please choose an image to upload." }) };
  }

  const approxBytes = (dataUrl.length * 3) / 4;
  if (approxBytes > MAX_BYTES) {
    return { statusCode: 400, body: JSON.stringify({ error: "That image is too large. Try a smaller one." }) };
  }

  const cleanTitle = (title || "Untitled").toString().trim().slice(0, 60) || "Untitled";
  const id = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const corner = CORNERS[Math.floor(Math.random() * CORNERS.length)];

  try {
    const store = getStore("art");
    await store.setJSON(id, {
      id,
      title: cleanTitle,
      dataUrl,
      corner,
      uploadedAt: Date.now(),
    });

    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ok: true, id }),
    };
  } catch (err) {
    return {
      statusCode: 500,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ error: "Could not save that upload. Please try again." }),
    };
  }
};
