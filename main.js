import express from "express";
import fetch from "node-fetch"; // если Node <18
import { Buffer } from "buffer";

const app = express();
const PORT = 3000;

// === CONFIG ===
const CLIENT_ID = process.env.CLIENT_ID;
const CLIENT_SECRET = process.env.CLIENT_SECRET;
if (!CLIENT_ID || !CLIENT_SECRET) {
  throw new Error('Нужно передать переменные окружения');
}

// === FATSECRET TOKEN ===
async function getFatSecretAccessToken() {
  const credentials = Buffer
    .from(`${CLIENT_ID}:${CLIENT_SECRET}`)
    .toString("base64");

  const body = new URLSearchParams({
    grant_type: "client_credentials",
    scope: "basic",
  });

  const response = await fetch("https://oauth.fatsecret.com/connect/token", {
    method: "POST",
    headers: {
      Authorization: `Basic ${credentials}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: body.toString(),
  });

  const data = await response.json();
  return data.access_token;
}

// === SEARCH FOOD ===
async function searchFood(query) {
  const token = await getFatSecretAccessToken();

  const url =
    "https://platform.fatsecret.com/rest/foods/search/v1" +
    `?search_expression=${encodeURIComponent(query)}` +
    "&page_number=0" +
    "&max_results=10" +
    "&format=json";

  const response = await fetch(url, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  return response.json();
}

// === EXPRESS ENDPOINT ===
app.get("/search-food", async (req, res) => {
  try {
    const food = req.query.food;

    if (!food) {
      return res.status(400).json({ error: "Query param 'food' is required" });
    }

    const data = await searchFood(food);
    res.json(data);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// === START SERVER ===
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});