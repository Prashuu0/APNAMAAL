import mongoose from "mongoose";
import { connectDB } from "./config/db.js";

import Restaurant from "./models/Restaurant.js";
import MenuItem from "./models/MenuItem.js";

const restaurantData = [
  {
    name: "Bombay Spice Kitchen",
    image: "https://images.unsplash.com/photo-1544025162-d76694265947?w=900",
    cuisine: "Indian",
    description: "Authentic North Indian flavors",
    rating: 4.5,
    deliveryTime: 30,
    costForTwo: 500,
    offer: "Flat ₹80 off",
    isOpen: true,
    operatingHours: { open: "10:00", close: "23:00" },
  },
  {
    name: "Pizza Yard",
    image: "https://images.unsplash.com/photo-1513104890138-7c749659a591?w=900",
    cuisine: "Italian",
    description: "Wood-fired pizzas and pasta",
    rating: 4.3,
    deliveryTime: 25,
    costForTwo: 600,
    offer: "Buy 1 Get 1",
    isOpen: true,
    operatingHours: { open: "11:00", close: "23:00" },
  },
  {
    name: "Healthy Bowl Co.",
    image: "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=900",
    cuisine: "Healthy",
    description: "Nutritious and delicious bowls",
    rating: 4.6,
    deliveryTime: 20,
    costForTwo: 450,
    offer: null,
    isOpen: true,
    operatingHours: { open: "09:00", close: "21:00" },
  },
];

const menuData = {
  "Bombay Spice Kitchen": [
    {
      name: "Butter Chicken",
      description: "Creamy tomato-based curry",
      price: 350,
      category: "Main Course",
      veg: false,
    },
    {
      name: "Paneer Tikka",
      description: "Grilled cottage cheese",
      price: 280,
      category: "Starters",
      veg: true,
    },
    {
      name: "Biryani",
      description: "Fragrant basmati rice",
      price: 320,
      category: "Main Course",
      veg: false,
    },
  ],

  "Pizza Yard": [
    {
      name: "Margherita Pizza",
      description: "Classic cheese pizza",
      price: 299,
      category: "Pizza",
      veg: true,
    },
    {
      name: "Pepperoni Pizza",
      description: "Spicy pepperoni pizza",
      price: 399,
      category: "Pizza",
      veg: false,
    },
  ],

  "Healthy Bowl Co.": [
    {
      name: "Quinoa Bowl",
      description: "Protein-rich quinoa",
      price: 320,
      category: "Bowls",
      veg: true,
    },
    {
      name: "Greek Salad",
      description: "Fresh vegetable salad",
      price: 250,
      category: "Salads",
      veg: true,
    },
  ],
};

async function seedRestaurants() {
  try {
    await connectDB();

    console.log("Seeding restaurants...");

    for (const data of restaurantData) {
      const restaurant = await Restaurant.findOneAndUpdate(
        { name: data.name },
        { $set: data },
        {
          upsert: true,
          returnDocument: "after",
          runValidators: true,
          setDefaultsOnInsert: true,
        },
      );

      console.log("Restaurant saved:", restaurant.name);

      const items = menuData[data.name] || [];

      for (const item of items) {
        await MenuItem.updateOne(
          {
            restaurantId: restaurant._id,
            name: item.name,
          },
          {
            $set: {
              ...item,
              restaurantId: restaurant._id,
              available: true,
            },
          },
          {
            upsert: true,
            runValidators: true,
          },
        );
      }
    }

    console.log("Restaurant and menu seeding completed!");
  } catch (error) {
    console.error("Seeding failed:", error);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
}

seedRestaurants();
