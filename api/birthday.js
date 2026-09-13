const { put, list } = require("@vercel/blob");

function send(res, status, data) {
  res.status(status).json(data);
}

function generateId(length = 7) {
  const chars =
    "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789";

  let id = "";

  for (let i = 0; i < length; i++) {
    id += chars[Math.floor(Math.random() * chars.length)];
  }

  return id;
}

function validId(id) {
  return /^[A-Za-z0-9]{7}$/.test(id);
}

module.exports = async function handler(req, res) {
  try {
    /*
    =====================================================
    CREATE BIRTHDAY
    POST /api/birthday
    =====================================================
    */

    if (req.method === "POST") {
      const body =
        typeof req.body === "string"
          ? JSON.parse(req.body)
          : req.body;

      if (!body || typeof body !== "object") {
        return send(res, 400, {
          success: false,
          error: "Invalid birthday data."
        });
      }

      let id = generateId();

      /*
      Store the complete birthday configuration
      in Vercel Blob.

      The ID is the filename, not the birthday data.
      */

      const record = {
        id,
        createdAt: new Date().toISOString(),
        data: body
      };

      await put(
        `birthdays/${id}.json`,
        JSON.stringify(record),
        {
          access: "public",
          contentType: "application/json",
          addRandomSuffix: false
        }
      );

      const origin =
        req.headers["x-forwarded-proto"] +
        "://" +
        req.headers["x-forwarded-host"];

      const fallbackOrigin =
        `https://${req.headers.host}`;

      const base =
        origin &&
        origin.includes("://")
          ? origin
          : fallbackOrigin;

      return send(res, 200, {
        success: true,
        id,
        url: `${base}/b/${id}`
      });
    }

    /*
    =====================================================
    READ BIRTHDAY
    GET /api/birthday?id=A7k92X
    =====================================================
    */

    if (req.method === "GET") {
      const id =
        String(req.query?.id || "").trim();

      if (!validId(id)) {
        return send(res, 400, {
          success: false,
          error: "Invalid birthday link."
        });
      }

      /*
      Find the exact Blob.
      */

      const result = await list({
        prefix: `birthdays/${id}.json`,
        limit: 1
      });

      if (
        !result ||
        !result.blobs ||
        result.blobs.length === 0
      ) {
        return send(res, 404, {
          success: false,
          error: "Birthday celebration not found."
        });
      }

      const blob = result.blobs[0];

      const response =
        await fetch(blob.url);

      if (!response.ok) {
        return send(res, 404, {
          success: false,
          error: "Birthday data unavailable."
        });
      }

      const record =
        await response.json();

      return send(res, 200, {
        success: true,
        id,
        data: record.data,
        createdAt: record.createdAt
      });
    }

    return send(res, 405, {
      success: false,
      error: "Method not allowed."
    });

  } catch (error) {
    console.error("Birthday API error:", error);

    return send(res, 500, {
      success: false,
      error:
        error?.message ||
        "Internal server error."
    });
  }
};
