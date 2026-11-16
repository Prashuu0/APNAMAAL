import express from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";

import User from "../models/User.js";
import Restaurant from "../models/Restaurant.js";
import DeliveryBoy from "../models/DeliveryBoy.js";

import protect, { authorize } from "../middleware/auth.js";

const router = express.Router();

// Generate JWT Token
const generateToken = (user) => {
  if (!process.env.JWT_SECRET) {
    throw new Error("JWT_SECRET is missing in environment variables");
  }

  return jwt.sign(
    {
      userId: user._id,
      role: user.role,
    },
    process.env.JWT_SECRET,
    { expiresIn: "7d" },
  );
};

// Remove password from user response
const getSafeUser = (user) => {
  const safeUser = user.toObject();
  delete safeUser.password;
  return safeUser;
};

// Normalize Email
const normalizeEmail = (email) =>
  email ? String(email).trim().toLowerCase() : undefined;

// Normalize Phone
const normalizePhone = (phone) => (phone ? String(phone).trim() : undefined);

// Validate Account
const validateAccount = async ({ name, email, phone, password }) => {
  if (!name || !name.trim()) {
    throw new Error("Name is required");
  }

  if (!email && !phone) {
    throw new Error("Email or phone number is required");
  }

  if (!password || password.length < 8) {
    throw new Error("Password must contain at least 8 characters");
  }

  const normalizedEmail = normalizeEmail(email);
  const normalizedPhone = normalizePhone(phone);

  if (normalizedEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
    throw new Error("Invalid email address");
  }

  if (normalizedPhone && !/^\d{10}$/.test(normalizedPhone)) {
    throw new Error("Phone number must contain 10 digits");
  }

  const conditions = [];

  if (normalizedEmail) {
    conditions.push({ email: normalizedEmail });
  }

  if (normalizedPhone) {
    conditions.push({ phone: normalizedPhone });
  }

  const existingUser = await User.findOne({ $or: conditions });

  if (existingUser) {
    throw new Error("Email or phone number is already registered");
  }

  return { normalizedEmail, normalizedPhone };
};

// ============================================
// ADMIN: GET ALL USERS
// GET /api/users/admin/all
// ============================================

router.get("/admin/all", protect, authorize("admin"), async (req, res) => {
  try {
    const users = await User.find()
      .select("-password")
      .sort({ createdAt: -1 })
      .limit(100);

    res.json({
      success: true,
      count: users.length,
      users,
    });
  } catch (error) {
    console.error("Get all users error:", error);

    res.status(500).json({
      error: "Failed to fetch users",
    });
  }
});

// ============================================
// ADMIN: BLOCK / UNBLOCK USER
// PATCH /api/users/admin/:id/status
// ============================================

router.patch(
  "/admin/:id/status",
  protect,
  authorize("admin"),
  async (req, res) => {
    try {
      const { id } = req.params;
      const { isActive } = req.body;

      if (!mongoose.isValidObjectId(id)) {
        return res.status(400).json({
          success: false,
          error: "Invalid user ID",
        });
      }

      if (typeof isActive !== "boolean") {
        return res.status(400).json({
          success: false,
          error: "isActive must be true or false",
        });
      }

      if (id === req.user.userId) {
        return res.status(400).json({
          success: false,
          error: "You cannot block your own admin account",
        });
      }

      const user = await User.findById(id);

      if (!user) {
        return res.status(404).json({
          success: false,
          error: "User not found",
        });
      }

      if (user.role === "admin") {
        return res.status(403).json({
          success: false,
          error: "Admin accounts cannot be blocked from this action",
        });
      }

      user.isActive = isActive;
      await user.save();

      res.json({
        success: true,
        message: isActive
          ? "User unblocked successfully"
          : "User blocked successfully",
        user: getSafeUser(user),
      });
    } catch (error) {
      console.error("User status update error:", error);

      res.status(500).json({
        success: false,
        error: "Failed to update user status",
      });
    }
  },
);

// ============================================
// GET LOGGED-IN USER PROFILE
// GET /api/users/me
// ============================================

router.get("/me", protect, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId).select("-password");

    if (!user) {
      return res.status(404).json({
        error: "User not found",
      });
    }

    res.json({
      success: true,
      user,
    });
  } catch (error) {
    console.error("Profile error:", error);

    res.status(500).json({
      error: "Failed to fetch profile",
    });
  }
});

// ============================================
// USER: ADDRESS MANAGEMENT
// ============================================

// Check that the logged-in user owns this address collection
const checkAddressOwner = (req, res) => {
  if (req.user.userId !== req.params.userId) {
    res.status(403).json({
      success: false,
      error: "You can only manage your own addresses",
    });
    return false;
  }

  return true;
};

// GET ALL SAVED ADDRESSES
router.get("/:userId/addresses", protect, async (req, res) => {
  try {
    if (!checkAddressOwner(req, res)) return;

    const user = await User.findById(req.params.userId).select("addresses");

    if (!user) {
      return res.status(404).json({
        success: false,
        error: "User not found",
      });
    }

    res.json({
      success: true,
      addresses: user.addresses,
    });
  } catch (error) {
    console.error("Fetch addresses error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch addresses",
    });
  }
});

// ADD NEW ADDRESS
router.post("/:userId/addresses", protect, async (req, res) => {
  try {
    if (!checkAddressOwner(req, res)) return;

    const { type, label, address, city, pincode, isDefault } = req.body;

    if (!address?.trim() || !city?.trim() || !pincode?.trim()) {
      return res.status(400).json({
        success: false,
        error: "Address, city and pincode are required",
      });
    }

    const user = await User.findById(req.params.userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        error: "User not found",
      });
    }

    const makeDefault = Boolean(isDefault) || user.addresses.length === 0;

    if (makeDefault) {
      user.addresses.forEach((item) => {
        item.isDefault = false;
      });
    }

    user.addresses.push({
      type: type || "other",
      label: label?.trim() || "",
      address: address.trim(),
      city: city.trim(),
      pincode: pincode.trim(),
      isDefault: makeDefault,
    });

    await user.save();

    res.status(201).json({
      success: true,
      message: "Address added successfully",
      addresses: user.addresses,
    });
  } catch (error) {
    console.error("Add address error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to add address",
    });
  }
});

// UPDATE ADDRESS
router.put("/:userId/addresses/:addressId", protect, async (req, res) => {
  try {
    if (!checkAddressOwner(req, res)) return;

    const user = await User.findById(req.params.userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        error: "User not found",
      });
    }

    const savedAddress = user.addresses.id(req.params.addressId);

    if (!savedAddress) {
      return res.status(404).json({
        success: false,
        error: "Address not found",
      });
    }

    const { type, label, address, city, pincode, isDefault } = req.body;

    if (!address?.trim() || !city?.trim() || !pincode?.trim()) {
      return res.status(400).json({
        success: false,
        error: "Address, city and pincode are required",
      });
    }

    if (type !== undefined) savedAddress.type = type;
    savedAddress.label = label?.trim() || "";
    savedAddress.address = address.trim();
    savedAddress.city = city.trim();
    savedAddress.pincode = pincode.trim();

    if (isDefault === true) {
      user.addresses.forEach((item) => {
        item.isDefault = item._id.equals(savedAddress._id);
      });
    }

    await user.save();

    res.json({
      success: true,
      message: "Address updated successfully",
      addresses: user.addresses,
    });
  } catch (error) {
    console.error("Update address error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to update address",
    });
  }
});

// SET DEFAULT ADDRESS
router.patch(
  "/:userId/addresses/:addressId/default",
  protect,
  async (req, res) => {
    try {
      if (!checkAddressOwner(req, res)) return;

      const user = await User.findById(req.params.userId);

      if (!user) {
        return res.status(404).json({
          success: false,
          error: "User not found",
        });
      }

      const selectedAddress = user.addresses.id(req.params.addressId);

      if (!selectedAddress) {
        return res.status(404).json({
          success: false,
          error: "Address not found",
        });
      }

      user.addresses.forEach((item) => {
        item.isDefault = item._id.equals(selectedAddress._id);
      });

      await user.save();

      res.json({
        success: true,
        message: "Default address updated",
        addresses: user.addresses,
      });
    } catch (error) {
      console.error("Set default address error:", error);
      res.status(500).json({
        success: false,
        error: "Failed to set default address",
      });
    }
  },
);

// DELETE ADDRESS
router.delete("/:userId/addresses/:addressId", protect, async (req, res) => {
  try {
    if (!checkAddressOwner(req, res)) return;

    const user = await User.findById(req.params.userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        error: "User not found",
      });
    }

    const deletedAddress = user.addresses.id(req.params.addressId);

    if (!deletedAddress) {
      return res.status(404).json({
        success: false,
        error: "Address not found",
      });
    }

    const wasDefault = deletedAddress.isDefault;

    user.addresses.pull({ _id: req.params.addressId });

    if (wasDefault && user.addresses.length > 0) {
      user.addresses[0].isDefault = true;
    }

    await user.save();

    res.json({
      success: true,
      message: "Address deleted successfully",
      addresses: user.addresses,
    });
  } catch (error) {
    console.error("Delete address error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to delete address",
    });
  }
});

// ============================================
// USER: FAVORITES / WISHLIST
// ============================================

// Check logged-in user ownership
const checkFavoriteOwner = (req, res) => {
  if (String(req.user.userId) !== String(req.params.userId)) {
    res.status(403).json({
      success: false,
      error: "You can only manage your own favorites",
    });
    return false;
  }

  return true;
};

// GET ALL FAVORITE RESTAURANTS
// GET /api/users/:userId/favorites
router.get("/:userId/favorites", protect, async (req, res) => {
  try {
    if (!checkFavoriteOwner(req, res)) return;

    const { userId } = req.params;

    if (!mongoose.isValidObjectId(userId)) {
      return res.status(400).json({
        success: false,
        error: "Invalid user ID",
      });
    }

    const user = await User.findById(userId).populate("favorites");

    if (!user) {
      return res.status(404).json({
        success: false,
        error: "User not found",
      });
    }

    res.json({
      success: true,
      favorites: user.favorites,
    });
  } catch (error) {
    console.error("Fetch favorites error:", error);

    res.status(500).json({
      success: false,
      error: "Failed to fetch favorites",
    });
  }
});

// ADD RESTAURANT TO FAVORITES
// POST /api/users/:userId/favorites
router.post("/:userId/favorites", protect, async (req, res) => {
  try {
    if (!checkFavoriteOwner(req, res)) return;

    const { userId } = req.params;
    const { restaurantId } = req.body;

    if (!mongoose.isValidObjectId(userId)) {
      return res.status(400).json({
        success: false,
        error: "Invalid user ID",
      });
    }

    if (!mongoose.isValidObjectId(restaurantId)) {
      return res.status(400).json({
        success: false,
        error: "Valid restaurant ID is required",
      });
    }

    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        error: "User not found",
      });
    }

    const restaurant = await Restaurant.findById(restaurantId);

    if (!restaurant) {
      return res.status(404).json({
        success: false,
        error: "Restaurant not found",
      });
    }

    // Prevent duplicate favorites
    user.favorites.addToSet(restaurant._id);

    await user.save();

    res.status(200).json({
      success: true,
      message: "Restaurant added to favorites",
      favorites: user.favorites,
    });
  } catch (error) {
    console.error("Add favorite error:", error);

    res.status(500).json({
      success: false,
      error: "Failed to add favorite",
    });
  }
});

// REMOVE RESTAURANT FROM FAVORITES
// DELETE /api/users/:userId/favorites/:restaurantId
router.delete("/:userId/favorites/:restaurantId", protect, async (req, res) => {
  try {
    if (!checkFavoriteOwner(req, res)) return;

    const { userId, restaurantId } = req.params;

    if (
      !mongoose.isValidObjectId(userId) ||
      !mongoose.isValidObjectId(restaurantId)
    ) {
      return res.status(400).json({
        success: false,
        error: "Invalid user or restaurant ID",
      });
    }

    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        error: "User not found",
      });
    }

    user.favorites.pull(restaurantId);

    await user.save();

    res.json({
      success: true,
      message: "Restaurant removed from favorites",
      favorites: user.favorites,
    });
  } catch (error) {
    console.error("Remove favorite error:", error);

    res.status(500).json({
      success: false,
      error: "Failed to remove favorite",
    });
  }
});

// ============================================
// GET USER BY ID
// GET /api/users/:id
// ============================================

router.get("/:id", protect, async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({
        error: "Invalid user ID",
      });
    }

    const isOwner = req.user.userId === id;
    const isAdmin = req.user.role === "admin";

    if (!isOwner && !isAdmin) {
      return res.status(403).json({
        error: "You cannot access another user profile",
      });
    }

    const user = await User.findById(id).select("-password");

    if (!user) {
      return res.status(404).json({
        error: "User not found",
      });
    }

    res.json(user);
  } catch (error) {
    console.error("Get user error:", error);

    res.status(500).json({
      error: "Failed to fetch user",
    });
  }
});

// ============================================
// CUSTOMER REGISTRATION
// POST /api/users/register
// ============================================

router.post("/register", async (req, res) => {
  try {
    const { name, email, phone, password } = req.body;

    const { normalizedEmail, normalizedPhone } = await validateAccount({
      name,
      email,
      phone,
      password,
    });

    const hashedPassword = await bcrypt.hash(password, 12);

    const user = await User.create({
      name: name.trim(),
      email: normalizedEmail,
      phone: normalizedPhone,
      password: hashedPassword,
      role: "user",
    });

    const token = generateToken(user);

    res.status(201).json({
      success: true,
      user: getSafeUser(user),
      token,
    });
  } catch (error) {
    console.error("Customer registration error:", error);

    res.status(error.code === 11000 ? 409 : 400).json({
      error:
        error.code === 11000
          ? "Email or phone number already exists"
          : error.message || "Registration failed",
    });
  }
});

// ============================================
// RESTAURANT OWNER REGISTRATION
// POST /api/users/register-restaurant-owner
// ============================================

router.post("/register-restaurant-owner", async (req, res) => {
  let createdUserId;

  try {
    const { name, email, phone, password, restaurant } = req.body;

    if (!restaurant?.name || !restaurant?.cuisine) {
      return res.status(400).json({
        error: "Restaurant name and cuisine are required",
      });
    }

    if (!email) {
      return res.status(400).json({
        error: "Email is required for restaurant owner",
      });
    }

    const { normalizedEmail, normalizedPhone } = await validateAccount({
      name,
      email,
      phone,
      password,
    });

    const hashedPassword = await bcrypt.hash(password, 12);

    const user = await User.create({
      name: name.trim(),
      email: normalizedEmail,
      phone: normalizedPhone,
      password: hashedPassword,
      role: "restaurant_owner",
    });

    createdUserId = user._id;

    const newRestaurant = await Restaurant.create({
      name: restaurant.name.trim(),
      image:
        restaurant.image ||
        "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?q=80&w=1600&auto=format&fit=crop",
      cuisine: restaurant.cuisine,
      description: restaurant.description || "",
      address: restaurant.address || {},
      operatingHours: restaurant.operatingHours || {},
      deliveryFee: restaurant.deliveryFee ?? 30,
      freeDeliveryAbove: restaurant.freeDeliveryAbove ?? 500,
      isOpen: true,
      rating: 0,
      deliveryTime: 30,
      owner: user._id,
    });

    const token = generateToken(user);

    res.status(201).json({
      success: true,
      user: getSafeUser(user),
      restaurant: newRestaurant,
      token,
    });
  } catch (error) {
    if (createdUserId) {
      await User.findByIdAndDelete(createdUserId);
    }

    console.error("Owner registration error:", error);

    res.status(error.code === 11000 ? 409 : 400).json({
      error:
        error.code === 11000
          ? "Email or phone number already exists"
          : error.message || "Owner registration failed",
    });
  }
});

// ============================================
// DELIVERY PARTNER REGISTRATION
// POST /api/users/register-delivery
// ============================================

router.post("/register-delivery", async (req, res) => {
  let createdUserId;

  try {
    const {
      name,
      email,
      phone,
      password,
      vehicle,
      license,
      aadhar,
      address,
      bankDetails,
    } = req.body;

    if (!phone) {
      return res.status(400).json({
        error: "Phone number is required for delivery partner",
      });
    }

    if (!vehicle?.number || !license?.number || !aadhar?.number) {
      return res.status(400).json({
        error: "Vehicle, license and Aadhaar details are required",
      });
    }

    if (!/^\d{12}$/.test(String(aadhar.number))) {
      return res.status(400).json({
        error: "Aadhaar number must contain 12 digits",
      });
    }

    const { normalizedEmail, normalizedPhone } = await validateAccount({
      name,
      email,
      phone,
      password,
    });

    const hashedPassword = await bcrypt.hash(password, 12);

    const user = await User.create({
      name: name.trim(),
      email: normalizedEmail,
      phone: normalizedPhone,
      password: hashedPassword,
      role: "delivery",
    });

    createdUserId = user._id;

    const deliveryBoy = await DeliveryBoy.create({
      user: user._id,
      name: user.name,
      email: normalizedEmail,
      phone: normalizedPhone,
      vehicle,
      license,
      aadhar,
      address,
      bankDetails,
      status: "OFFLINE",
    });

    const token = generateToken(user);

    res.status(201).json({
      success: true,
      user: getSafeUser(user),
      deliveryBoy: {
        _id: deliveryBoy._id,
        name: deliveryBoy.name,
        phone: deliveryBoy.phone,
        vehicle: deliveryBoy.vehicle,
        status: deliveryBoy.status,
      },
      token,
    });
  } catch (error) {
    if (createdUserId) {
      await User.findByIdAndDelete(createdUserId);
    }

    console.error("Delivery registration error:", error);

    res.status(error.code === 11000 ? 409 : 400).json({
      error:
        error.code === 11000
          ? "Email or phone number already exists"
          : error.message || "Delivery registration failed",
    });
  }
});

// ============================================
// LOGIN FOR ALL REGISTERED ROLES
// POST /api/users/login
// ============================================

router.post("/login", async (req, res) => {
  try {
    const { email, phone, password } = req.body;

    if ((!email && !phone) || !password) {
      return res.status(400).json({
        error: "Email/phone and password are required",
      });
    }

    const query = email
      ? { email: normalizeEmail(email) }
      : { phone: normalizePhone(phone) };

    const user = await User.findOne(query);

    if (!user || !user.password) {
      return res.status(401).json({
        error: "Invalid email/phone or password",
      });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      return res.status(401).json({
        error: "Invalid email/phone or password",
      });
    }

    // Check whether account is blocked
    if (!user.isActive) {
      return res.status(403).json({
        error: "Your account has been blocked. Please contact support.",
      });
    }

    const token = generateToken(user);

    res.json({
      success: true,
      user: getSafeUser(user),
      token,
    });
  } catch (error) {
    console.error("Login error:", error);

    res.status(500).json({
      error: "Login failed",
    });
  }
});

export default router;
