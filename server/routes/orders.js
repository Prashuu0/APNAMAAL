import express from "express";
import mongoose from "mongoose";

import Order from "../models/Order.js";
import User from "../models/User.js";
import Restaurant from "../models/Restaurant.js";
import MenuItem from "../models/MenuItem.js";
import DeliveryBoy from "../models/DeliveryBoy.js";

import protect, { authorize } from "../middleware/auth.js";

const router = express.Router();

const isValidId = (id) => mongoose.isValidObjectId(id);

const populateOrder = (query) =>
  query
    .populate("userId", "name email phone")
    .populate("restaurantId", "name image address")
    .populate("deliveryBoyId", "name phone vehicle");

// ============================================
// ADMIN DASHBOARD OVERVIEW
// GET /api/orders/admin/overview
// ============================================

router.get("/admin/overview", protect, authorize("admin"), async (req, res) => {
  try {
    const [
      totalUsers,
      totalCustomers,
      totalOwners,
      totalAdmins,
      totalRestaurants,
      totalDeliveryPartners,
      totalOrders,
      deliveredOrders,
      cancelledOrders,
      activeOrders,
      revenueData,
      statusBreakdown,
    ] = await Promise.all([
      User.countDocuments(),
      User.countDocuments({ role: "user" }),
      User.countDocuments({ role: "restaurant_owner" }),
      User.countDocuments({ role: "admin" }),
      Restaurant.countDocuments(),
      DeliveryBoy.countDocuments(),
      Order.countDocuments(),
      Order.countDocuments({ status: "DELIVERED" }),
      Order.countDocuments({ status: "CANCELLED" }),
      Order.countDocuments({
        status: {
          $in: ["PLACED", "CONFIRMED", "PREPARING", "OUT_FOR_DELIVERY"],
        },
      }),
      Order.aggregate([
        { $match: { status: "DELIVERED" } },
        {
          $group: {
            _id: null,
            totalRevenue: { $sum: "$pricing.total" },
          },
        },
      ]),
      Order.aggregate([
        {
          $group: {
            _id: "$status",
            count: { $sum: 1 },
          },
        },
      ]),
    ]);

    res.json({
      success: true,
      overview: {
        totalUsers,
        totalCustomers,
        totalOwners,
        totalAdmins,
        totalRestaurants,
        totalDeliveryPartners,
        totalOrders,
        deliveredOrders,
        cancelledOrders,
        activeOrders,
        totalRevenue: revenueData[0]?.totalRevenue || 0,
        statusBreakdown,
      },
    });
  } catch (error) {
    console.error("Admin overview error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch admin overview",
    });
  }
});

// ============================================
// ADMIN: GET ALL ORDERS
// GET /api/orders/admin/all
// ============================================

router.get("/admin/all", protect, authorize("admin"), async (req, res) => {
  try {
    const orders = await populateOrder(
      Order.find().sort({ createdAt: -1 }).limit(500),
    );

    res.json({
      success: true,
      count: orders.length,
      orders,
    });
  } catch (error) {
    console.error("Admin orders error:", error);
    res.status(500).json({
      error: "Failed to fetch orders",
    });
  }
});

// ============================================
// GET ORDERS FOR A CUSTOMER
// GET /api/orders/user/:userId
// ============================================

router.get("/user/:userId", protect, async (req, res) => {
  try {
    const { userId } = req.params;

    if (!isValidId(userId)) {
      return res.status(400).json({
        error: "Invalid user ID",
      });
    }

    if (req.user.role !== "admin" && req.user.userId !== userId) {
      return res.status(403).json({
        error: "You cannot access another user's orders",
      });
    }

    const orders = await populateOrder(
      Order.find({ userId }).sort({ createdAt: -1 }),
    );

    res.json(orders);
  } catch (error) {
    console.error("User orders error:", error);
    res.status(500).json({
      error: "Failed to fetch user orders",
    });
  }
});

// ============================================
// GET ORDERS FOR A RESTAURANT
// GET /api/orders/restaurant/:restaurantId
// ============================================

router.get(
  "/restaurant/:restaurantId",
  protect,
  authorize("restaurant_owner", "admin"),
  async (req, res) => {
    try {
      const { restaurantId } = req.params;

      if (!isValidId(restaurantId)) {
        return res.status(400).json({
          error: "Invalid restaurant ID",
        });
      }

      const restaurant = await Restaurant.findById(restaurantId);

      if (!restaurant) {
        return res.status(404).json({
          error: "Restaurant not found",
        });
      }

      if (
        req.user.role !== "admin" &&
        restaurant.owner?.toString() !== req.user.userId
      ) {
        return res.status(403).json({
          error: "You cannot access this restaurant's orders",
        });
      }

      const orders = await populateOrder(
        Order.find({ restaurantId }).sort({ createdAt: -1 }),
      );

      res.json(orders);
    } catch (error) {
      console.error("Restaurant orders error:", error);
      res.status(500).json({
        error: "Failed to fetch restaurant orders",
      });
    }
  },
);

// ============================================
// CREATE ORDER
// POST /api/orders
// ============================================

router.post("/", protect, authorize("user"), async (req, res) => {
  try {
    const {
      restaurantId,
      items,
      address,
      paymentMethod,
      scheduled,
      scheduledDate,
      scheduledTime,
      couponCode,
    } = req.body;

    if (!isValidId(restaurantId)) {
      return res.status(400).json({
        error: "Invalid restaurant ID",
      });
    }

    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        error: "Order must contain at least one item",
      });
    }

    if (!address || !address.trim()) {
      return res.status(400).json({
        error: "Delivery address is required",
      });
    }

    if (!["COD", "UPI", "Card", "Wallet"].includes(paymentMethod)) {
      return res.status(400).json({
        error: "Invalid payment method",
      });
    }

    const restaurant = await Restaurant.findById(restaurantId);

    if (!restaurant) {
      return res.status(404).json({
        error: "Restaurant not found",
      });
    }

    if (!restaurant.isOpen) {
      return res.status(400).json({
        error: "Restaurant is currently closed",
      });
    }

    const orderItems = [];
    let subtotal = 0;

    for (const orderItem of items) {
      if (
        !isValidId(orderItem.item) ||
        !Number.isInteger(Number(orderItem.quantity)) ||
        Number(orderItem.quantity) < 1
      ) {
        return res.status(400).json({
          error: "Invalid order item or quantity",
        });
      }

      const menuItem = await MenuItem.findOne({
        _id: orderItem.item,
        restaurantId,
        available: true,
      });

      if (!menuItem) {
        return res.status(400).json({
          error: "One or more menu items are unavailable",
        });
      }

      const quantity = Number(orderItem.quantity);
      const price = menuItem.price;

      subtotal += price * quantity;

      orderItems.push({
        item: menuItem._id,
        name: menuItem.name,
        price,
        quantity,
      });
    }

    const deliveryFee =
      restaurant.freeDeliveryAbove && subtotal >= restaurant.freeDeliveryAbove
        ? 0
        : restaurant.deliveryFee || 0;

    const tax = Number((subtotal * 0.05).toFixed(2));
    const discount = 0;

    const total = Number((subtotal + deliveryFee + tax - discount).toFixed(2));

    const orderId = `AM${Date.now()}${Math.floor(1000 + Math.random() * 9000)}`;

    const order = await Order.create({
      orderId,
      userId: req.user.userId,
      restaurantId,
      items: orderItems,
      address: address.trim(),
      paymentMethod,
      status: "PLACED",
      scheduled: Boolean(scheduled),
      scheduledDate: scheduled ? scheduledDate || null : null,
      scheduledTime: scheduled ? scheduledTime || null : null,
      couponCode: couponCode || null,
      pricing: {
        subtotal,
        deliveryFee,
        tax,
        discount,
        total,
      },
    });

    const savedOrder = await populateOrder(Order.findById(order._id));

    res.status(201).json({
      success: true,
      message: "Order placed successfully",
      ...savedOrder.toObject(),
    });
  } catch (error) {
    console.error("Create order error:", error);

    res.status(500).json({
      error: error.message || "Failed to create order",
    });
  }
});

// ============================================
// GET ORDER STATUS
// GET /api/orders/:id/status
// ============================================

router.get("/:id/status", protect, async (req, res) => {
  try {
    const order = await Order.findOne({
      orderId: req.params.id,
    });

    if (!order) {
      return res.status(404).json({
        error: "Order not found",
      });
    }

    const isAdmin = req.user.role === "admin";
    const isCustomer = order.userId.toString() === req.user.userId;

    if (!isAdmin && !isCustomer) {
      return res.status(403).json({
        error: "You cannot access this order",
      });
    }

    res.json({
      success: true,
      orderId: order.orderId,
      status: order.status,
    });
  } catch (error) {
    console.error("Order status error:", error);
    res.status(500).json({
      error: "Failed to fetch order status",
    });
  }
});

// ============================================
// GET ORDER BY ORDER ID OR MONGODB ID
// GET /api/orders/:id
// ============================================

router.get("/:id", protect, async (req, res) => {
  try {
    const id = req.params.id;

    const conditions = [{ orderId: id }];

    if (isValidId(id)) {
      conditions.push({ _id: id });
    }

    const order = await populateOrder(Order.findOne({ $or: conditions }));

    if (!order) {
      return res.status(404).json({
        error: "Order not found",
      });
    }

    const isAdmin = req.user.role === "admin";
    const isCustomer = order.userId?._id.toString() === req.user.userId;

    const isOwner =
      req.user.role === "restaurant_owner" &&
      order.restaurantId?.owner?.toString() === req.user.userId;

    const deliveryBoy =
      req.user.role === "delivery"
        ? await DeliveryBoy.findOne({ user: req.user.userId })
        : null;

    const isDeliveryPartner =
      deliveryBoy &&
      order.deliveryBoyId?._id.toString() === deliveryBoy._id.toString();

    if (!isAdmin && !isCustomer && !isOwner && !isDeliveryPartner) {
      return res.status(403).json({
        error: "You cannot access this order",
      });
    }

    res.json(order);
  } catch (error) {
    console.error("Get order error:", error);
    res.status(500).json({
      error: "Failed to fetch order",
    });
  }
});

/* ============================================
   OWNER: ACCEPT OR REJECT ORDER
   PATCH /api/orders/:id/owner-response
============================================ */

router.patch(
  "/:id/owner-response",
  protect,
  authorize("restaurant_owner"),
  async (req, res) => {
    try {
      const { action, reason } = req.body;

      if (!["ACCEPT", "REJECT"].includes(action)) {
        return res.status(400).json({
          success: false,
          error: "Action must be ACCEPT or REJECT",
        });
      }

      const conditions = [{ orderId: req.params.id }];

      if (isValidId(req.params.id)) {
        conditions.push({ _id: req.params.id });
      }

      const order = await Order.findOne({
        $or: conditions,
      });

      if (!order) {
        return res.status(404).json({
          success: false,
          error: "Order not found",
        });
      }

      const restaurant = await Restaurant.findById(order.restaurantId);

      if (!restaurant || restaurant.owner?.toString() !== req.user.userId) {
        return res.status(403).json({
          success: false,
          error: "You cannot manage this order",
        });
      }

      if (order.status !== "PLACED") {
        return res.status(400).json({
          success: false,
          error: "Only newly placed orders can be accepted or rejected",
        });
      }

      if (action === "ACCEPT") {
        order.status = "CONFIRMED";
      } else {
        if (!reason || !reason.trim()) {
          return res.status(400).json({
            success: false,
            error: "Rejection reason is required",
          });
        }

        order.status = "CANCELLED";
        order.cancelledBy = "restaurant_owner";
        order.cancellationReason = reason.trim();
        order.cancelledAt = new Date();
      }

      await order.save();

      res.json({
        success: true,
        message:
          action === "ACCEPT"
            ? "Order accepted successfully"
            : "Order rejected successfully",
        order,
      });
    } catch (error) {
      console.error("Owner order response error:", error);

      res.status(500).json({
        success: false,
        error: "Failed to process order response",
      });
    }
  },
);

/* ============================================
   OWNER: ASSIGN DELIVERY PARTNER
   POST /api/orders/:id/assign-delivery
============================================ */

router.post(
  "/:id/assign-delivery",
  protect,
  authorize("restaurant_owner"),
  async (req, res) => {
    try {
      const { deliveryBoyId } = req.body;

      if (!isValidId(deliveryBoyId)) {
        return res.status(400).json({
          success: false,
          error: "Invalid delivery partner ID",
        });
      }

      const conditions = [{ orderId: req.params.id }];

      if (isValidId(req.params.id)) {
        conditions.push({ _id: req.params.id });
      }

      const order = await Order.findOne({
        $or: conditions,
      });

      if (!order) {
        return res.status(404).json({
          success: false,
          error: "Order not found",
        });
      }

      const restaurant = await Restaurant.findById(order.restaurantId);

      if (!restaurant || restaurant.owner?.toString() !== req.user.userId) {
        return res.status(403).json({
          success: false,
          error: "You cannot assign delivery for this order",
        });
      }

      if (!["CONFIRMED", "PREPARING"].includes(order.status)) {
        return res.status(400).json({
          success: false,
          error: "Order must be confirmed or preparing before assignment",
        });
      }

      if (
        order.deliveryAssignmentStatus === "PENDING" ||
        order.deliveryAssignmentStatus === "ACCEPTED"
      ) {
        return res.status(400).json({
          success: false,
          error: "A delivery partner is already assigned or awaiting response",
        });
      }

      const partner = await DeliveryBoy.findById(deliveryBoyId);

      if (!partner) {
        return res.status(404).json({
          success: false,
          error: "Delivery partner not found",
        });
      }

      if (partner.kycStatus !== "APPROVED") {
        return res.status(400).json({
          success: false,
          error: "Delivery partner KYC is not approved",
        });
      }

      if (partner.status !== "AVAILABLE" || partner.currentOrderId) {
        return res.status(400).json({
          success: false,
          error: "Delivery partner is not available",
        });
      }

      order.deliveryBoyId = partner._id;
      order.deliveryAssignmentStatus = "PENDING";
      order.deliveryAssignedAt = new Date();
      order.deliveryRespondedAt = null;
      order.deliveryRejectionReason = "";
      order.deliveryAssignedBy = req.user.userId;

      await order.save();

      res.json({
        success: true,
        message: "Delivery assignment request sent successfully",
        order,
      });
    } catch (error) {
      console.error("Assign delivery partner error:", error);

      res.status(500).json({
        success: false,
        error: "Failed to assign delivery partner",
      });
    }
  },
);

// ============================================
// UPDATE ORDER STATUS
// PATCH /api/orders/:id/status
// ============================================

router.patch(
  "/:id/status",
  protect,
  authorize("restaurant_owner", "admin"),
  async (req, res) => {
    try {
      const { status, deliveryBoyId } = req.body;

      const allowedStatuses = [
        "CONFIRMED",
        "PREPARING",
        "OUT_FOR_DELIVERY",
        "CANCELLED",
      ];

      if (!allowedStatuses.includes(status)) {
        return res.status(400).json({
          error: "Invalid order status",
        });
      }

      const order = await Order.findOne({
        $or: [
          { orderId: req.params.id },
          ...(isValidId(req.params.id) ? [{ _id: req.params.id }] : []),
        ],
      });

      if (!order) {
        return res.status(404).json({
          error: "Order not found",
        });
      }

      if (req.user.role !== "admin") {
        const restaurant = await Restaurant.findById(order.restaurantId);

        if (!restaurant || restaurant.owner?.toString() !== req.user.userId) {
          return res.status(403).json({
            error: "You cannot update this order",
          });
        }
      }

      const updates = { status };

      if (status === "OUT_FOR_DELIVERY" && deliveryBoyId) {
        if (!isValidId(deliveryBoyId)) {
          return res.status(400).json({
            error: "Invalid delivery partner ID",
          });
        }

        const partner = await DeliveryBoy.findById(deliveryBoyId);

        if (!partner) {
          return res.status(404).json({
            error: "Delivery partner not found",
          });
        }

        updates.deliveryBoyId = deliveryBoyId;
      }

      if (status === "DELIVERED") {
        updates.deliveredAt = new Date();
      }

      const updatedOrder = await Order.findByIdAndUpdate(
        order._id,
        { $set: updates },
        { new: true, runValidators: true },
      );

      res.json({
        success: true,
        message: "Order status updated successfully",
        order: updatedOrder,
      });
    } catch (error) {
      console.error("Update order error:", error);
      res.status(500).json({
        error: "Failed to update order status",
      });
    }
  },
);

export default router;
