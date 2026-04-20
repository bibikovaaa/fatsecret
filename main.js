import express from "express";

import { Buffer } from "buffer";

const app = express();
const PORT = 3000;

// === CONFIG ===
// npm i dotenv
// import dotenv from "dotenv";
// dotenv.config();

const CLIENT_ID = process.env.CLIENT_ID;
const CLIENT_SECRET = process.env.CLIENT_SECRET;
if (!CLIENT_ID || !CLIENT_SECRET) {
  throw new Error('Нужно передать переменные окружения');
}

// === GET IP ===
async function getIp() {
  const response = await fetch("https://api.ipify.org?format=json");
  return response.json();
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
app.get("/search", async (req, res) => {
  // https://fatsecret-tdor.onrender.com/search-food?food=banana
  try {
    const food = req.query.food; // banana

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

app.get("/ip", async (req, res) => {
  try {
    const ipData = await getIp();
    res.json(ipData);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch IP" });
  }
});

// === START SERVER ===
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});