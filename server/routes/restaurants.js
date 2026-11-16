import express from "express";
import mongoose from "mongoose";

import Restaurant from "../models/Restaurant.js";
import MenuItem from "../models/MenuItem.js";

import protect, { authorize } from "../middleware/auth.js";

const router = express.Router();

// Common helper: validate MongoDB ID
const isValidId = (id) => mongoose.isValidObjectId(id);

// Common helper: check restaurant ownership
const checkRestaurantAccess = async (restaurantId, user) => {
  const restaurant = await Restaurant.findById(restaurantId);

  if (!restaurant) {
    return { restaurant: null, allowed: false };
  }

  const isOwner = restaurant.owner?.toString() === user.userId;

  const isAdmin = user.role === "admin";

  return {
    restaurant,
    allowed: isOwner || isAdmin,
  };
};

// ==================================================
// TASK 1 & 2: GET ALL RESTAURANTS WITH SEARCH/FILTER
// GET /api/restaurants
// ==================================================

router.get("/", async (req, res) => {
  try {
    const { query, cuisine, sort, page = 1, limit = 12, source } = req.query;

    const currentPage = Math.max(1, Number(page) || 1);
    const pageSize = Math.min(50, Math.max(1, Number(limit) || 12));

    const filter = {};

    if (query?.trim()) {
      const safeQuery = query.trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

      filter.$or = [
        { name: { $regex: safeQuery, $options: "i" } },
        { cuisine: { $regex: safeQuery, $options: "i" } },
        { description: { $regex: safeQuery, $options: "i" } },
        { "address.city": { $regex: safeQuery, $options: "i" } },
        { "address.street": { $regex: safeQuery, $options: "i" } },
      ];
    }

    if (cuisine?.trim()) {
      filter.cuisine = {
        $regex: cuisine.trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&"),
        $options: "i",
      };
    }

    if (req.query.isOpen === "true") {
      filter.isOpen = true;
    }

    if (source === "DATASET") {
      filter.source = "DATASET";
    } else if (source === "OWNER_ADDED") {
      filter.source = "OWNER_ADDED";
    }

    let sortOption = { createdAt: -1 };

    if (sort === "rating") sortOption = { rating: -1 };
    else if (sort === "time") sortOption = { deliveryTime: 1 };
    else if (sort === "cost") sortOption = { costForTwo: 1 };
    else if (sort === "cost-desc") sortOption = { costForTwo: -1 };
    else if (sort === "name") sortOption = { name: 1 };

    const [restaurants, total] = await Promise.all([
      Restaurant.find(filter)
        .sort(sortOption)
        .skip((currentPage - 1) * pageSize)
        .limit(pageSize)
        .lean(),

      Restaurant.countDocuments(filter),
    ]);

    res.json({
      success: true,
      restaurants,
      pagination: {
        page: currentPage,
        limit: pageSize,
        total,
        totalPages: Math.ceil(total / pageSize),
        hasNextPage: currentPage * pageSize < total,
      },
    });
  } catch (error) {
    console.error("Get restaurants error:", error);

    res.status(500).json({
      success: false,
      error: "Failed to fetch restaurants",
    });
  }
});

// ==================================================
// TASK 4: GET RESTAURANTS BY OWNER
// GET /api/restaurants/owner/:ownerId/list
// ==================================================

router.get("/owner/:ownerId/list", protect, async (req, res) => {
  try {
    const { ownerId } = req.params;

    if (!isValidId(ownerId)) {
      return res.status(400).json({
        error: "Invalid owner ID",
      });
    }

    const isOwner = req.user.userId === ownerId;
    const isAdmin = req.user.role === "admin";

    if (!isOwner && !isAdmin) {
      return res.status(403).json({
        error: "You cannot access these restaurants",
      });
    }

    const restaurants = await Restaurant.find({
      owner: ownerId,
    }).sort({ createdAt: -1 });

    res.json(restaurants);
  } catch (error) {
    console.error("Owner restaurants error:", error);

    res.status(500).json({
      error: "Failed to fetch owner restaurants",
    });
  }
});

// ==================================================
// TASK 4: CREATE RESTAURANT FOR OWNER
// POST /api/restaurants/owner/:ownerId
// ==================================================

router.post(
  "/owner/:ownerId",
  protect,
  authorize("restaurant_owner", "admin"),
  async (req, res) => {
    try {
      const { ownerId } = req.params;

      if (!isValidId(ownerId)) {
        return res.status(400).json({
          error: "Invalid owner ID",
        });
      }

      if (req.user.role !== "admin" && req.user.userId !== ownerId) {
        return res.status(403).json({
          error: "You cannot create restaurant for another owner",
        });
      }

      const {
        name,
        image,
        cuisine,
        description,
        address,
        rating,
        deliveryTime,
        costForTwo,
        offer,
        isOpen,
        operatingHours,
        deliveryFee,
        freeDeliveryAbove,
      } = req.body;

      const restaurant = await Restaurant.create({
        name,
        image,
        cuisine,
        description,
        address,
        rating,
        deliveryTime,
        costForTwo,
        offer,
        isOpen,
        operatingHours,
        deliveryFee,
        freeDeliveryAbove,
        owner: ownerId,
      });

      res.status(201).json(restaurant);
    } catch (error) {
      console.error("Create restaurant error:", error);

      res.status(400).json({
        error: error.message,
      });
    }
  },
);

// ==================================================
// TASK 1: GET RESTAURANT BY ID
// GET /api/restaurants/:id
// ==================================================

router.get("/:id", async (req, res) => {
  try {
    const { id } = req.params;

    if (!isValidId(id)) {
      return res.status(400).json({
        error: "Invalid restaurant ID",
      });
    }

    const restaurant = await Restaurant.findById(id);

    if (!restaurant) {
      return res.status(404).json({
        error: "Restaurant not found",
      });
    }

    res.json(restaurant);
  } catch (error) {
    console.error("Get restaurant error:", error);

    res.status(500).json({
      error: "Failed to fetch restaurant",
    });
  }
});

// ==================================================
// TASK 3: GET MENU ITEMS BY RESTAURANT
// GET /api/restaurants/:id/menu
// ==================================================

router.get("/:id/menu", async (req, res) => {
  try {
    const { id } = req.params;
    const { veg } = req.query;

    if (!isValidId(id)) {
      return res.status(400).json({
        error: "Invalid restaurant ID",
      });
    }

    const restaurantExists = await Restaurant.exists({
      _id: id,
    });

    if (!restaurantExists) {
      return res.status(404).json({
        error: "Restaurant not found",
      });
    }

    const filter = {
      restaurantId: id,
      available: true,
    };

    if (veg === "true") {
      filter.veg = true;
    } else if (veg === "false") {
      filter.veg = false;
    }

    const menuItems = await MenuItem.find(filter)
      .sort({ category: 1, name: 1 })
      .lean();

    res.json(menuItems);
  } catch (error) {
    console.error("Get menu error:", error);

    res.status(500).json({
      error: "Failed to fetch menu",
    });
  }
});

// ==================================================
// TASK 3: ADD MENU ITEM
// POST /api/restaurants/:id/menu
// ==================================================

router.post(
  "/:id/menu",
  protect,
  authorize("restaurant_owner", "admin"),
  async (req, res) => {
    try {
      const { id } = req.params;

      if (!isValidId(id)) {
        return res.status(400).json({
          error: "Invalid restaurant ID",
        });
      }

      const access = await checkRestaurantAccess(id, req.user);

      if (!access.restaurant) {
        return res.status(404).json({
          error: "Restaurant not found",
        });
      }

      if (!access.allowed) {
        return res.status(403).json({
          error: "You cannot manage this restaurant menu",
        });
      }

      const {
        name,
        description,
        price,
        image,
        category,
        veg,
        available,
        popular,
        nutritionalInfo,
        allergens,
      } = req.body;

      const menuItem = await MenuItem.create({
        restaurantId: id,
        name,
        description,
        price,
        image,
        category,
        veg,
        available,
        popular,
        nutritionalInfo,
        allergens,
      });

      res.status(201).json(menuItem);
    } catch (error) {
      console.error("Add menu item error:", error);

      res.status(400).json({
        error: error.message,
      });
    }
  },
);

// ==================================================
// TASK 3: UPDATE MENU ITEM
// PUT /api/restaurants/:id/menu/:itemId
// ==================================================

router.put(
  "/:id/menu/:itemId",
  protect,
  authorize("restaurant_owner", "admin"),
  async (req, res) => {
    try {
      const { id, itemId } = req.params;

      if (!isValidId(id) || !isValidId(itemId)) {
        return res.status(400).json({
          error: "Invalid restaurant or menu item ID",
        });
      }

      const access = await checkRestaurantAccess(id, req.user);

      if (!access.restaurant) {
        return res.status(404).json({
          error: "Restaurant not found",
        });
      }

      if (!access.allowed) {
        return res.status(403).json({
          error: "You cannot manage this menu",
        });
      }

      const allowedFields = [
        "name",
        "description",
        "price",
        "image",
        "category",
        "veg",
        "available",
        "popular",
        "nutritionalInfo",
        "allergens",
      ];

      const updateData = {};

      for (const field of allowedFields) {
        if (req.body[field] !== undefined) {
          updateData[field] = req.body[field];
        }
      }

      const menuItem = await MenuItem.findOneAndUpdate(
        {
          _id: itemId,
          restaurantId: id,
        },
        { $set: updateData },
        {
          new: true,
          runValidators: true,
        },
      );

      if (!menuItem) {
        return res.status(404).json({
          error: "Menu item not found",
        });
      }

      res.json(menuItem);
    } catch (error) {
      console.error("Update menu error:", error);

      res.status(400).json({
        error: error.message,
      });
    }
  },
);

// ==================================================
// TASK 3: DELETE MENU ITEM
// DELETE /api/restaurants/:id/menu/:itemId
// ==================================================

router.delete(
  "/:id/menu/:itemId",
  protect,
  authorize("restaurant_owner", "admin"),
  async (req, res) => {
    try {
      const { id, itemId } = req.params;

      if (!isValidId(id) || !isValidId(itemId)) {
        return res.status(400).json({
          error: "Invalid ID",
        });
      }

      const access = await checkRestaurantAccess(id, req.user);

      if (!access.restaurant) {
        return res.status(404).json({
          error: "Restaurant not found",
        });
      }

      if (!access.allowed) {
        return res.status(403).json({
          error: "You cannot delete this menu item",
        });
      }

      const deletedItem = await MenuItem.findOneAndDelete({
        _id: itemId,
        restaurantId: id,
      });

      if (!deletedItem) {
        return res.status(404).json({
          error: "Menu item not found",
        });
      }

      res.json({
        success: true,
        message: "Menu item deleted successfully",
      });
    } catch (error) {
      console.error("Delete menu error:", error);

      res.status(500).json({
        error: "Failed to delete menu item",
      });
    }
  },
);

// ==================================================
// TASK 4: UPDATE RESTAURANT
// PUT /api/restaurants/:id
// ==================================================

router.put(
  "/:id",
  protect,
  authorize("restaurant_owner", "admin"),
  async (req, res) => {
    try {
      const { id } = req.params;

      if (!isValidId(id)) {
        return res.status(400).json({
          error: "Invalid restaurant ID",
        });
      }

      const access = await checkRestaurantAccess(id, req.user);

      if (!access.restaurant) {
        return res.status(404).json({
          error: "Restaurant not found",
        });
      }

      if (!access.allowed) {
        return res.status(403).json({
          error: "You cannot update this restaurant",
        });
      }

      const allowedFields = [
        "name",
        "image",
        "cuisine",
        "description",
        "address",
        "rating",
        "deliveryTime",
        "costForTwo",
        "offer",
        "isOpen",
        "operatingHours",
        "deliveryFee",
        "freeDeliveryAbove",
      ];

      const updateData = {};

      for (const field of allowedFields) {
        if (req.body[field] !== undefined) {
          updateData[field] = req.body[field];
        }
      }

      const restaurant = await Restaurant.findByIdAndUpdate(
        id,
        { $set: updateData },
        {
          new: true,
          runValidators: true,
        },
      );

      res.json(restaurant);
    } catch (error) {
      console.error("Update restaurant error:", error);

      res.status(400).json({
        error: error.message,
      });
    }
  },
);

// ==================================================
// TASK 4: UPDATE RESTAURANT OFFER
// PATCH /api/restaurants/:id/offer
// ==================================================

router.patch(
  "/:id/offer",
  protect,
  authorize("restaurant_owner", "admin"),
  async (req, res) => {
    try {
      const { id } = req.params;

      if (!isValidId(id)) {
        return res.status(400).json({
          error: "Invalid restaurant ID",
        });
      }

      const access = await checkRestaurantAccess(id, req.user);

      if (!access.restaurant) {
        return res.status(404).json({
          error: "Restaurant not found",
        });
      }

      if (!access.allowed) {
        return res.status(403).json({
          error: "You cannot update this offer",
        });
      }

      const restaurant = await Restaurant.findByIdAndUpdate(
        id,
        {
          $set: {
            offer: req.body.offer ?? null,
          },
        },
        {
          new: true,
          runValidators: true,
        },
      );

      res.json({
        success: true,
        message: "Offer updated successfully",
        restaurant,
      });
    } catch (error) {
      console.error("Offer update error:", error);

      res.status(400).json({
        error: error.message,
      });
    }
  },
);

// ==================================================
// TASK 1: DELETE RESTAURANT
// DELETE /api/restaurants/:id
// ==================================================

router.delete(
  "/:id",
  protect,
  authorize("restaurant_owner", "admin"),
  async (req, res) => {
    try {
      const { id } = req.params;

      if (!isValidId(id)) {
        return res.status(400).json({
          error: "Invalid restaurant ID",
        });
      }

      const access = await checkRestaurantAccess(id, req.user);

      if (!access.restaurant) {
        return res.status(404).json({
          error: "Restaurant not found",
        });
      }

      if (!access.allowed) {
        return res.status(403).json({
          error: "You cannot delete this restaurant",
        });
      }

      // Delete its menu items as well
      await MenuItem.deleteMany({
        restaurantId: id,
      });

      await Restaurant.findByIdAndDelete(id);

      res.json({
        success: true,
        message: "Restaurant and its menu deleted successfully",
      });
    } catch (error) {
      console.error("Delete restaurant error:", error);

      res.status(500).json({
        error: "Failed to delete restaurant",
      });
    }
  },
);

export default router;
