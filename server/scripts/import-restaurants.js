import mongoose from "mongoose";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import csv from "csv-parser";

import { connectDB } from "../config/db.js";
import Restaurant from "../models/Restaurant.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const csvPath = path.join(__dirname, "../data/restaurants-delhi.csv");

const BATCH_SIZE = 500;

const toNumber = (value, fallback = 0) => {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
};

const validCoordinates = (lat, lon) =>
  Number.isFinite(lat) &&
  Number.isFinite(lon) &&
  lat >= -90 &&
  lat <= 90 &&
  lon >= -180 &&
  lon <= 180;

async function importRestaurants() {
  let batch = [];
  let imported = 0;
  let skipped = 0;

  try {
    if (!fs.existsSync(csvPath)) {
      throw new Error(`CSV file not found: ${csvPath}`);
    }

    await connectDB();

    console.log("Starting Delhi restaurant import...");

    const stream = fs.createReadStream(csvPath).pipe(
      csv({
        mapHeaders: ({ header }) => header.replace(/^\uFEFF/, "").trim(),
      }),
    );
    let headerChecked = false;

    stream.on("headers", (headers) => {
      console.log("CSV Headers:", headers);
    });

    async function saveBatch() {
      if (batch.length === 0) return;

      const operations = batch.map((restaurant) => ({
        updateOne: {
          filter: {
            externalSourceId: restaurant.externalSourceId,
          },
          update: {
            $set: restaurant,
          },
          upsert: true,
        },
      }));

      const result = await Restaurant.bulkWrite(operations, {
        ordered: false,
      });

      imported += (result.upsertedCount || 0) + (result.modifiedCount || 0);

      console.log(`Processed ${imported} records...`);
      batch = [];
    }

    for await (const row of stream) {
      const id = row.id?.trim();
      const name = row.name?.trim();

      const latitude = toNumber(row.lat, NaN);
      const longitude = toNumber(row.lon, NaN);

      if (!id || !name || !validCoordinates(latitude, longitude)) {
        skipped++;
        continue;
      }

      const cuisine = row.cuisines?.trim() || row.kind?.trim() || "Other";

      const restaurant = {
        name,
        image:
          "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=900",
        cuisine,
        description: "",
        rating: 0,
        deliveryTime: 30,
        costForTwo: toNumber(row.cost_for_two),
        isOpen: true,

        address: {
          street: row.address?.trim() || row.locality?.trim() || "",
          city: row.city?.trim() || "Delhi",
          state: row.state?.trim() || "Delhi",
          pincode: row.pincode?.trim() || "",
        },

        location: {
          latitude,
          longitude,
        },

        source: "DATASET",
        externalSourceId: id,
        externalUrl: row.url?.trim() || "",
        kind: row.kind?.trim() || "",
        diet: row.diet?.trim() || "",
        hoursText: row.hours?.trim() || "",
        priceBand: row.price_band?.trim() || "",
        menuItemsText: row.menu_items?.trim() || "",

        availabilityVerified: false,
        isClaimed: false,
        claimStatus: "UNCLAIMED",
      };

      batch.push(restaurant);

      if (batch.length >= BATCH_SIZE) {
        await saveBatch();
      }
    }

    await saveBatch();

    console.log("\nRestaurant import completed!");
    console.log("Processed records:", imported);
    console.log("Skipped records:", skipped);

    const totalDatasetRestaurants = await Restaurant.countDocuments({
      source: "DATASET",
    });

    console.log(
      "Total dataset restaurants in database:",
      totalDatasetRestaurants,
    );
  } catch (error) {
    console.error("Restaurant import failed:", error);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
}

importRestaurants();
