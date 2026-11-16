import express from "express";
import mongoose from "mongoose";
import protect, { authorize } from "../middleware/auth.js";

import Coupon from "../models/Coupon.js";
import Notification from "../models/Notification.js";
import Order from "../models/Order.js";
import Restaurant from "../models/Restaurant.js";
import MenuItem from "../models/MenuItem.js";
import User from "../models/User.js";
import DeliveryBoy from "../models/DeliveryBoy.js";

const router = express.Router();

// -------------------- HELPERS --------------------

const notify = async (
  userId,
  title,
  message,
  orderId = null,
  type = "GENERAL",
) => {
  if (!userId) return;

  return Notification.create({
    userId,
    title,
    message,
    orderId,
    type,
  });
};

const findOrder = async (id) => {
  const conditions = [{ orderId: id }];

  if (mongoose.isValidObjectId(id)) {
    conditions.push({ _id: id });
  }

  return Order.findOne({ $or: conditions });
};

const calculateCoupon = async (code, subtotal, userId) => {
  if (!code) return { coupon: null, discount: 0 };

  const normalized = String(code).trim().toUpperCase();

  const coupon = await Coupon.findOne({
    code: normalized,
    isActive: true,
  });

  const now = new Date();

  if (!coupon || coupon.startsAt > now || coupon.expiresAt < now) {
    throw new Error("Coupon is invalid or expired");
  }

  if (subtotal < coupon.minOrderAmount) {
    throw new Error(`Minimum order amount is ₹${coupon.minOrderAmount}`);
  }

  if (coupon.usageLimit != null && coupon.usedCount >= coupon.usageLimit) {
    throw new Error("Coupon usage limit reached");
  }

  const userUsage =
    coupon.usedBy.find((entry) => String(entry.userId) === String(userId))
      ?.count || 0;

  if (userUsage >= coupon.perUserLimit) {
    throw new Error("You have already used this coupon");
  }

  let discount =
    coupon.discountType === "PERCENT"
      ? (subtotal * coupon.discountValue) / 100
      : coupon.discountValue;

  if (coupon.maxDiscount != null) {
    discount = Math.min(discount, coupon.maxDiscount);
  }

  discount = Math.min(subtotal, Math.max(0, Math.round(discount * 100) / 100));

  return { coupon, discount };
};

// -------------------- ADMIN COUPONS --------------------

router.get("/coupons", protect, authorize("admin"), async (req, res) => {
  try {
    const coupons = await Coupon.find().sort({ createdAt: -1 });
    res.json(coupons);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.post("/coupons", protect, authorize("admin"), async (req, res) => {
  try {
    const body = req.body;

    const coupon = await Coupon.create({
      code: String(body.code || "")
        .trim()
        .toUpperCase(),
      description: body.description || "",
      discountType: body.discountType,
      discountValue: Number(body.discountValue),
      maxDiscount:
        body.maxDiscount === "" || body.maxDiscount == null
          ? null
          : Number(body.maxDiscount),
      minOrderAmount: Number(body.minOrderAmount || 0),
      usageLimit: body.usageLimit ? Number(body.usageLimit) : null,
      perUserLimit: Number(body.perUserLimit || 1),
      startsAt: body.startsAt || new Date(),
      expiresAt: body.expiresAt,
      isActive: body.isActive !== false,
    });

    res.status(201).json(coupon);
  } catch (error) {
    res.status(400).json({
      message:
        error.code === 11000 ? "Coupon code already exists" : error.message,
    });
  }
});

router.patch("/coupons/:id", protect, authorize("admin"), async (req, res) => {
  try {
    const coupon = await Coupon.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    if (!coupon) {
      return res.status(404).json({ message: "Coupon not found" });
    }

    res.json(coupon);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

router.delete("/coupons/:id", protect, authorize("admin"), async (req, res) => {
  try {
    const coupon = await Coupon.findByIdAndDelete(req.params.id);

    if (!coupon) {
      return res.status(404).json({ message: "Coupon not found" });
    }

    res.json({ success: true });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// -------------------- COUPON VALIDATION --------------------

router.post(
  "/coupons/validate",
  protect,
  authorize("user"),
  async (req, res) => {
    try {
      const subtotal = Number(req.body.subtotal || 0);

      if (!Number.isFinite(subtotal) || subtotal < 0) {
        return res.status(400).json({
          message: "Invalid subtotal",
        });
      }

      const result = await calculateCoupon(
        req.body.code,
        subtotal,
        req.user.userId,
      );

      res.json({
        valid: true,
        code: result.coupon.code,
        discount: result.discount,
        description: result.coupon.description,
      });
    } catch (error) {
      res.status(400).json({
        valid: false,
        message: error.message,
      });
    }
  },
);

// -------------------- CHECKOUT WITH COUPON --------------------

// Frontend will use POST /api/orders/checkout.
// Existing POST /api/orders is kept unchanged.

router.post(
  "/orders/checkout",
  protect,
  authorize("user"),
  async (req, res) => {
    try {
      const {
        restaurantId,
        items = [],
        address,
        paymentMethod = "COD",
        scheduled = false,
        scheduledDate,
        scheduledTime,
        couponCode,
      } = req.body;

      if (!mongoose.isValidObjectId(restaurantId)) {
        return res.status(400).json({
          message: "Invalid restaurant",
        });
      }

      if (!Array.isArray(items) || !items.length) {
        return res.status(400).json({
          message: "Cart is empty",
        });
      }

      if (!address || !String(address).trim()) {
        return res.status(400).json({
          message: "Delivery address is required",
        });
      }

      const restaurant = await Restaurant.findById(restaurantId);

      if (!restaurant) {
        return res.status(404).json({
          message: "Restaurant not found",
        });
      }

      const snapshots = [];
      let subtotal = 0;

      for (const entry of items) {
        const raw = entry.item || entry;

        const menuItemId =
          typeof entry.item === "string"
            ? entry.item
            : entry.item?._id ||
              entry.item?.id ||
              entry.menuItemId ||
              entry._id ||
              entry.id;

        const quantity = Number(
          entry.quantity || entry.qty || raw.quantity || raw.qty || 1,
        );

        if (
          !mongoose.isValidObjectId(menuItemId) ||
          !Number.isInteger(quantity) ||
          quantity < 1 ||
          quantity > 50
        ) {
          return res.status(400).json({
            message: "Invalid cart item or quantity",
          });
        }

        const menuItem = await MenuItem.findOne({
          _id: menuItemId,
          restaurantId,
          available: { $ne: false },
        });

        if (!menuItem) {
          return res.status(400).json({
            message: `Menu item is unavailable: ${raw.name || "Unknown item"}`,
          });
        }

        subtotal += Number(menuItem.price) * quantity;

        // Order.js uses the field name "item".
        snapshots.push({
          item: menuItem._id,
          name: menuItem.name,
          price: menuItem.price,
          quantity,
        });
      }

      const { coupon, discount } = await calculateCoupon(
        couponCode,
        subtotal,
        req.user.userId,
      );

      const deliveryFee = Number(restaurant.deliveryFee || 0);
      const taxable = Math.max(0, subtotal - discount);
      const tax = Math.round(taxable * 0.05 * 100) / 100;
      const total = Math.max(0, taxable + deliveryFee + tax);

      const orderId = `AM${Date.now()}${Math.floor(Math.random() * 900 + 100)}`;

      const order = await Order.create({
        orderId,
        userId: req.user.userId,
        restaurantId,
        items: snapshots,
        address,
        paymentMethod,
        status: "PLACED",
        scheduled: Boolean(scheduled),
        scheduledDate: scheduled ? scheduledDate : null,
        scheduledTime: scheduled ? scheduledTime : null,
        pricing: {
          subtotal,
          deliveryFee,
          tax,
          discount,
          total,
        },
        couponCode: coupon?.code || null,
        couponId: coupon?._id || null,
      });

      if (coupon) {
        coupon.usedCount += 1;

        const usage = coupon.usedBy.find(
          (entry) => String(entry.userId) === String(req.user.userId),
        );

        if (usage) {
          usage.count += 1;
        } else {
          coupon.usedBy.push({
            userId: req.user.userId,
            count: 1,
          });
        }

        await coupon.save();
      }

      await notify(
        req.user.userId,
        "Order placed",
        `Your order ${order.orderId} has been placed successfully.`,
        order._id,
        "ORDER_PLACED",
      );

      res.status(201).json(order);
    } catch (error) {
      res.status(400).json({
        message: error.message || "Unable to place order",
      });
    }
  },
);

// -------------------- CUSTOMER CANCELLATION --------------------

router.post(
  "/orders/:orderId/cancel",
  protect,
  authorize("user"),
  async (req, res) => {
    try {
      const order = await findOrder(req.params.orderId);

      if (!order) {
        return res.status(404).json({
          message: "Order not found",
        });
      }

      if (
        String(order.userId) !== String(req.user.userId) &&
        req.user.role !== "admin"
      ) {
        return res.status(403).json({
          message: "Not allowed to cancel this order",
        });
      }

      if (!["PLACED", "CONFIRMED"].includes(order.status)) {
        return res.status(400).json({
          message: "Order can only be cancelled before preparation starts",
        });
      }

      order.status = "CANCELLED";
      order.cancelledBy = req.user.role === "admin" ? "admin" : "user";

      order.cancellationReason = String(
        req.body.reason || "Cancelled by customer",
      ).slice(0, 500);

      order.cancelledAt = new Date();

      const paidOnline = ["UPI", "Card", "Wallet"].includes(
        order.paymentMethod,
      );

      order.refund = {
        status: paidOnline ? "PENDING" : "NOT_REQUIRED",
        amount: paidOnline ? Number(order.pricing?.total || 0) : 0,
      };

      await order.save();

      await notify(
        order.userId,
        "Order cancelled",
        `Your order ${order.orderId} has been cancelled.`,
        order._id,
        "ORDER_CANCELLED",
      );

      res.json({
        success: true,
        order,
        refund: order.refund,
      });
    } catch (error) {
      res.status(400).json({ message: error.message });
    }
  },
);

// -------------------- ADMIN REFUND STATUS --------------------

// This only updates the refund record.
// It does NOT transfer money through Razorpay or another gateway.

router.patch(
  "/orders/:orderId/refund",
  protect,
  authorize("admin"),
  async (req, res) => {
    try {
      const order = await findOrder(req.params.orderId);

      if (!order) {
        return res.status(404).json({
          message: "Order not found",
        });
      }

      if (order.status !== "CANCELLED") {
        return res.status(400).json({
          message: "Only cancelled orders can be refunded",
        });
      }

      const status = req.body.status;

      if (!["COMPLETED", "FAILED"].includes(status)) {
        return res.status(400).json({
          message: "Refund status must be COMPLETED or FAILED",
        });
      }

      order.refund.status = status;
      order.refund.processedAt = new Date();
      order.refund.failureReason =
        status === "FAILED"
          ? String(req.body.failureReason || "").slice(0, 500)
          : "";

      await order.save();

      await notify(
        order.userId,
        "Refund update",
        status === "COMPLETED"
          ? `Refund for order ${order.orderId} has been marked completed.`
          : `Refund for order ${order.orderId} could not be processed.`,
        order._id,
        "GENERAL",
      );

      res.json({
        success: true,
        refund: order.refund,
      });
    } catch (error) {
      res.status(400).json({ message: error.message });
    }
  },
);

// -------------------- RESTAURANT SALES SUMMARY --------------------

router.get(
  "/orders/restaurant/:restaurantId/summary",
  protect,
  async (req, res) => {
    try {
      const restaurant = await Restaurant.findById(
        req.params.restaurantId,
      ).select("owner name");

      if (!restaurant) {
        return res.status(404).json({
          message: "Restaurant not found",
        });
      }

      if (
        req.user.role !== "admin" &&
        String(restaurant.owner) !== String(req.user.userId)
      ) {
        return res.status(403).json({
          message: "Not allowed",
        });
      }

      const [counts, revenue, recent] = await Promise.all([
        Order.aggregate([
          { $match: { restaurantId: restaurant._id } },
          {
            $group: {
              _id: "$status",
              count: { $sum: 1 },
            },
          },
        ]),

        Order.aggregate([
          {
            $match: {
              restaurantId: restaurant._id,
              status: "DELIVERED",
            },
          },
          {
            $group: {
              _id: null,
              revenue: { $sum: "$pricing.total" },
              orders: { $sum: 1 },
            },
          },
        ]),

        Order.find({ restaurantId: restaurant._id })
          .sort({ createdAt: -1 })
          .limit(8)
          .populate("userId", "name phone")
          .lean(),
      ]);

      res.json({
        restaurant: restaurant.name,
        statusBreakdown: counts,
        revenue: revenue[0]?.revenue || 0,
        deliveredOrders: revenue[0]?.orders || 0,
        recentOrders: recent,
      });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  },
);

// -------------------- NOTIFICATIONS --------------------

router.get("/notifications", protect, async (req, res) => {
  try {
    const notifications = await Notification.find({
      userId: req.user.userId,
    })
      .sort({ createdAt: -1 })
      .limit(50)
      .lean();

    res.json({
      notifications,
      unreadCount: notifications.filter((item) => !item.isRead).length,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.patch("/notifications/read-all", protect, async (req, res) => {
  try {
    await Notification.updateMany(
      {
        userId: req.user.userId,
        isRead: false,
      },
      {
        $set: {
          isRead: true,
          readAt: new Date(),
        },
      },
    );

    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.patch("/notifications/:id/read", protect, async (req, res) => {
  try {
    const notification = await Notification.findOneAndUpdate(
      {
        _id: req.params.id,
        userId: req.user.userId,
      },
      {
        $set: {
          isRead: true,
          readAt: new Date(),
        },
      },
      { new: true },
    );

    if (!notification) {
      return res.status(404).json({
        message: "Notification not found",
      });
    }

    res.json(notification);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// -------------------- ADMIN ANALYTICS --------------------

router.get(
  "/admin/analytics",
  protect,
  authorize("admin"),
  async (req, res) => {
    try {
      const since = new Date();
      since.setDate(since.getDate() - 6);
      since.setHours(0, 0, 0, 0);

      const [
        users,
        restaurants,
        deliveryPartners,
        orders,
        delivered,
        cancelled,
        revenue,
        daily,
      ] = await Promise.all([
        User.countDocuments(),
        Restaurant.countDocuments(),
        DeliveryBoy.countDocuments(),
        Order.countDocuments(),
        Order.countDocuments({ status: "DELIVERED" }),
        Order.countDocuments({ status: "CANCELLED" }),

        Order.aggregate([
          { $match: { status: "DELIVERED" } },
          {
            $group: {
              _id: null,
              total: { $sum: "$pricing.total" },
            },
          },
        ]),

        Order.aggregate([
          {
            $match: {
              status: "DELIVERED",
              deliveredAt: { $gte: since },
            },
          },
          {
            $group: {
              _id: {
                $dateToString: {
                  format: "%Y-%m-%d",
                  date: "$deliveredAt",
                },
              },
              revenue: { $sum: "$pricing.total" },
              orders: { $sum: 1 },
            },
          },
          { $sort: { _id: 1 } },
        ]),
      ]);

      res.json({
        users,
        restaurants,
        deliveryPartners,
        orders,
        delivered,
        cancelled,
        revenue: revenue[0]?.total || 0,
        daily,
      });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  },
);

export default router;
