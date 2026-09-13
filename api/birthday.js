const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY =
  process.env.SUPABASE_SERVICE_ROLE_KEY;

function json(res, status, data) {
  res.status(status).json(data);
}

function makeId(length = 7) {
  const chars =
    "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789";

  let id = "";

  for (let i = 0; i < length; i++) {
    id += chars[Math.floor(Math.random() * chars.length)];
  }

  return id;
}

async function supabase(path, options = {}) {
  const response = await fetch(
    `${SUPABASE_URL}/rest/v1/${path}`,
    {
      ...options,
      headers: {
        apikey: SUPABASE_SERVICE_ROLE_KEY,
        Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
        "Content-Type": "application/json",
        Prefer: "return=representation",
        ...(options.headers || {})
      }
    }
  );

  const text = await response.text();

  let data;

  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = text;
  }

  if (!response.ok) {
    throw new Error(
      typeof data === "string"
        ? data
        : JSON.stringify(data)
    );
  }

  return data;
}

module.exports = async (req, res) => {
  try {
    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      return json(res, 500, {
        success: false,
        error: "Supabase environment variables are missing."
      });
    }

    /*
      CREATE
      POST /api/birthday
    */

    if (req.method === "POST") {
      const body =
        typeof req.body === "string"
          ? JSON.parse(req.body)
          : req.body;

      if (!body || typeof body !== "object") {
        return json(res, 400, {
          success: false,
          error: "Invalid birthday data."
        });
      }

      let shortId = makeId();

      // Extremely unlikely collision protection
      for (let attempt = 0; attempt < 5; attempt++) {
        const existing = await supabase(
          `birthdays?short_id=eq.${encodeURIComponent(shortId)}&select=id`,
          { method: "GET" }
        );

        if (!existing || existing.length === 0) break;

        shortId = makeId();
      }

      const result = await supabase("birthdays", {
        method: "POST",
        body: JSON.stringify({
          short_id: shortId,
          data: body
        })
      });

      return json(res, 200, {
        success: true,
        id: shortId
      });
    }

    /*
      READ
      GET /api/birthday?id=A7k92X
    */

    if (req.method === "GET") {
      const id = String(req.query?.id || "").trim();

      if (!id || !/^[A-Za-z0-9]{4,20}$/.test(id)) {
        return json(res, 400, {
          success: false,
          error: "Invalid birthday ID."
        });
      }

      const result = await supabase(
        `birthdays?short_id=eq.${encodeURIComponent(id)}&select=data,created_at&limit=1`,
        { method: "GET" }
      );

      if (!result || result.length === 0) {
        return json(res, 404, {
          success: false,
          error: "Birthday celebration not found."
        });
      }

      return json(res, 200, {
        success: true,
        id,
        data: result[0].data,
        created_at: result[0].created_at
      });
    }

    return json(res, 405, {
      success: false,
      error: "Method not allowed."
    });

  } catch (error) {
    console.error(error);

    return json(res, 500, {
      success: false,
      error: "Server error."
    });
  }
};
