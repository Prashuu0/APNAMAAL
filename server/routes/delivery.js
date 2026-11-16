import express from "express";

import mongoose from "mongoose";

import DeliveryBoy from "../models/DeliveryBoy.js";

import Order from "../models/Order.js";

import protect, { authorize } from "../middleware/auth.js";

const router = express.Router();
// Fields safe to show in delivery partner listings
const safeFields =
  "name phone vehicle location status rating totalDeliveries user kycStatus rejectionReason";
// Get all delivery partner KYC records (Admin only)
router.get("/admin/kyc", protect, authorize("admin"), async (req, res) => {
  try {
    const deliveryBoys = await DeliveryBoy.find()
      .select(
        "name phone email vehicle license.number license.expiryDate license.frontImage license.backImage aadhar.image documents address status kycStatus rejectionReason createdAt user",
      )
      .populate("user", "name email phone")
      .sort({ createdAt: -1 })
      .lean();

    res.json({
      success: true,
      count: deliveryBoys.length,
      deliveryBoys,
    });
  } catch (error) {
    console.error("Admin KYC list error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch delivery KYC records",
    });
  }
});

// Approve or reject a delivery partner's KYC (Admin only)
router.patch("/:id/kyc", protect, authorize("admin"), async (req, res) => {
  try {
    const { id } = req.params;
    const { status, rejectionReason } = req.body;

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        error: "Invalid delivery partner ID",
      });
    }

    if (!["APPROVED", "REJECTED"].includes(status)) {
      return res.status(400).json({
        success: false,
        error: "Status must be APPROVED or REJECTED",
      });
    }

    if (
      status === "REJECTED" &&
      (!rejectionReason || !rejectionReason.trim())
    ) {
      return res.status(400).json({
        success: false,
        error: "Rejection reason is required",
      });
    }

    const update = {
      kycStatus: status,
      rejectionReason: status === "REJECTED" ? rejectionReason.trim() : "",
      reviewedAt: new Date(),
      reviewedBy: req.user.userId,
    };

    // Do not interrupt a delivery already in progress.
    const existing = await DeliveryBoy.findById(id);
    if (!existing) {
      return res.status(404).json({
        success: false,
        error: "Delivery partner not found",
      });
    }
    if (status === "REJECTED" && existing.status !== "BUSY") {
      update.status = "OFFLINE";
    }

    const deliveryBoy = await DeliveryBoy.findByIdAndUpdate(
      id,
      { $set: update },
      { new: true, runValidators: true },
    ).select(safeFields);

    res.json({
      success: true,
      message: `KYC ${status.toLowerCase()} successfully`,
      deliveryBoy,
    });
  } catch (error) {
    console.error("KYC approval error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to update KYC status",
    });
  }
});

// Get delivery partners (Admin and Restaurant Owner)
router.get(
  "/",

  protect,

  authorize("admin", "restaurant_owner"),

  async (req, res) => {
    try {
      const deliveryBoys = await DeliveryBoy.find()

        .select(safeFields)

        .sort({ createdAt: -1 })

        .lean();

      res.json(deliveryBoys);
    } catch (error) {
      console.error("Get delivery partners error:", error);

      res.status(500).json({
        success: false,

        error: "Failed to fetch delivery partners",
      });
    }
  },
);
// Get own delivery profile
router.get("/me", protect, authorize("delivery"), async (req, res) => {
  try {
    const deliveryBoy = await DeliveryBoy.findOne({
      user: req.user.userId,
    })

      .select(safeFields)

      .lean();

    if (!deliveryBoy) {
      return res.status(404).json({
        success: false,

        error: "Delivery profile not found",
      });
    }

    res.json({
      success: true,

      deliveryBoy,
    });
  } catch (error) {
    console.error("Get own delivery profile error:", error);

    res.status(500).json({
      success: false,

      error: "Failed to fetch delivery profile",
    });
  }
});
// Get available orders for delivery partners
router.get(
  "/available-orders",

  protect,

  authorize("delivery"),

  async (req, res) => {
    try {
      const deliveryBoy = await DeliveryBoy.findOne({
        user: req.user.userId,
      });

      if (!deliveryBoy) {
        return res.status(404).json({
          success: false,

          error: "Delivery profile not found",
        });
      }

      if (deliveryBoy.kycStatus !== "APPROVED") {
        return res.json({
          success: true,
          orders: [],
          message: "Your KYC is pending approval",
        });
      }

      if (deliveryBoy.status !== "AVAILABLE") {
        return res.json({
          success: true,

          orders: [],

          message: "You must be online to see available orders",
        });
      }

      const orders = await Order.find({
        deliveryBoyId: deliveryBoy._id,
        deliveryAssignmentStatus: "PENDING",
        status: { $in: ["CONFIRMED", "PREPARING"] },
      })

        .select(
          "orderId restaurantId items address pricing paymentMethod status createdAt etaMinutes",
        )

        .populate("restaurantId", "name address")

        .sort({ createdAt: -1 })

        .lean();

      res.json({
        success: true,

        orders,
      });
    } catch (error) {
      console.error("Get available orders error:", error);

      res.status(500).json({
        success: false,

        error: "Failed to fetch available orders",
      });
    }
  },
);
// Get orders assigned to logged-in delivery partner
router.get("/my-orders", protect, authorize("delivery"), async (req, res) => {
  try {
    const deliveryBoy = await DeliveryBoy.findOne({
      user: req.user.userId,
    });

    if (!deliveryBoy) {
      return res.status(404).json({
        success: false,

        error: "Delivery profile not found",
      });
    }

    const orders = await Order.find({
      deliveryBoyId: deliveryBoy._id,
    })

      .populate("restaurantId", "name address")

      .populate("userId", "name")

      .sort({ createdAt: -1 })

      .lean();

    res.json({
      success: true,

      orders,
    });
  } catch (error) {
    console.error("Get my delivery orders error:", error);

    res.status(500).json({
      success: false,

      error: "Failed to fetch assigned orders",
    });
  }
});
// Update own online/offline status
router.patch("/me/status", protect, authorize("delivery"), async (req, res) => {
  try {
    const { status } = req.body;

    if (!["AVAILABLE", "OFFLINE"].includes(status)) {
      return res.status(400).json({
        success: false,

        error: "Status must be AVAILABLE or OFFLINE",
      });
    }

    const deliveryBoy = await DeliveryBoy.findOne({
      user: req.user.userId,
    });

    if (!deliveryBoy) {
      return res.status(404).json({
        success: false,

        error: "Delivery profile not found",
      });
    }

    if (status === "AVAILABLE" && deliveryBoy.kycStatus !== "APPROVED") {
      return res.status(403).json({
        success: false,
        error: "Your KYC is not approved yet. Please contact admin.",
      });
    }

    if (deliveryBoy.status === "BUSY") {
      return res.status(400).json({
        success: false,

        error: "You cannot change status while an order is assigned",
      });
    }

    deliveryBoy.status = status;

    await deliveryBoy.save();

    res.json({
      success: true,

      message:
        status === "AVAILABLE" ? "You are now online" : "You are now offline",

      deliveryBoy: {
        _id: deliveryBoy._id,

        name: deliveryBoy.name,

        status: deliveryBoy.status,
      },
    });
  } catch (error) {
    console.error("Update delivery status error:", error);

    res.status(500).json({
      success: false,

      error: "Failed to update delivery status",
    });
  }
});

// Accept an order assigned by restaurant owner
router.post(
  "/orders/:orderId/accept",
  protect,
  authorize("delivery"),
  async (req, res) => {
    try {
      const { orderId } = req.params;

      if (!mongoose.isValidObjectId(orderId)) {
        return res.status(400).json({
          success: false,
          error: "Invalid order ID",
        });
      }

      const deliveryBoy = await DeliveryBoy.findOne({
        user: req.user.userId,
      });

      if (!deliveryBoy) {
        return res.status(404).json({
          success: false,
          error: "Delivery profile not found",
        });
      }

      if (deliveryBoy.kycStatus !== "APPROVED") {
        return res.status(403).json({
          success: false,
          error: "Your KYC must be approved before accepting orders",
        });
      }

      const existingOrder = await Order.findOne({
        _id: orderId,
        deliveryBoyId: deliveryBoy._id,
        deliveryAssignmentStatus: "PENDING",
        status: { $in: ["CONFIRMED", "PREPARING"] },
      });

      if (!existingOrder) {
        return res.status(404).json({
          success: false,
          error: "No pending delivery assignment found",
        });
      }

      // Reserve delivery partner
      const reservedPartner = await DeliveryBoy.findOneAndUpdate(
        {
          _id: deliveryBoy._id,
          user: req.user.userId,
          status: "AVAILABLE",
          kycStatus: "APPROVED",
          currentOrderId: null,
        },
        {
          $set: {
            status: "BUSY",
            currentOrderId: existingOrder._id,
          },
        },
        { new: true },
      );

      if (!reservedPartner) {
        return res.status(400).json({
          success: false,
          error: "You are not available to accept this order",
        });
      }

      // Confirm assignment only if request is still pending
      const order = await Order.findOneAndUpdate(
        {
          _id: existingOrder._id,
          deliveryBoyId: deliveryBoy._id,
          deliveryAssignmentStatus: "PENDING",
          status: { $in: ["CONFIRMED", "PREPARING"] },
        },
        {
          $set: {
            deliveryAssignmentStatus: "ACCEPTED",
            deliveryRespondedAt: new Date(),
          },
        },
        { new: true },
      )
        .populate("restaurantId", "name address")
        .populate("userId", "name phone");

      if (!order) {
        // Release partner if assignment could not be confirmed
        await DeliveryBoy.findOneAndUpdate(
          {
            _id: deliveryBoy._id,
            currentOrderId: existingOrder._id,
          },
          {
            $set: {
              status: "AVAILABLE",
              currentOrderId: null,
            },
          },
        );

        return res.status(409).json({
          success: false,
          error: "This assignment is no longer available",
        });
      }

      res.json({
        success: true,
        message: "Delivery assignment accepted successfully",
        order,
      });
    } catch (error) {
      console.error("Accept delivery assignment error:", error);

      res.status(500).json({
        success: false,
        error: "Failed to accept delivery assignment",
      });
    }
  },
);

// Reject an order assigned by restaurant owner
router.post(
  "/orders/:orderId/reject",
  protect,
  authorize("delivery"),
  async (req, res) => {
    try {
      const { orderId } = req.params;
      const { reason } = req.body;

      if (!mongoose.isValidObjectId(orderId)) {
        return res.status(400).json({
          success: false,
          error: "Invalid order ID",
        });
      }

      const deliveryBoy = await DeliveryBoy.findOne({
        user: req.user.userId,
      });

      if (!deliveryBoy) {
        return res.status(404).json({
          success: false,
          error: "Delivery profile not found",
        });
      }

      const order = await Order.findOneAndUpdate(
        {
          _id: orderId,
          deliveryBoyId: deliveryBoy._id,
          deliveryAssignmentStatus: "PENDING",
          status: { $in: ["CONFIRMED", "PREPARING"] },
        },
        {
          $set: {
            deliveryBoyId: null,
            deliveryAssignmentStatus: "REJECTED",
            deliveryRespondedAt: new Date(),
            deliveryRejectionReason:
              reason?.trim() || "Rejected by delivery partner",
          },
        },
        { new: true },
      );

      if (!order) {
        return res.status(404).json({
          success: false,
          error: "No pending delivery assignment found",
        });
      }

      res.json({
        success: true,
        message: "Delivery assignment rejected successfully",
        order,
      });
    } catch (error) {
      console.error("Reject delivery assignment error:", error);

      res.status(500).json({
        success: false,
        error: "Failed to reject delivery assignment",
      });
    }
  },
);

// Start delivery after accepting the assignment
router.patch(
  "/orders/:orderId/start",
  protect,
  authorize("delivery"),
  async (req, res) => {
    try {
      const { orderId } = req.params;

      if (!mongoose.isValidObjectId(orderId)) {
        return res.status(400).json({
          success: false,
          error: "Invalid order ID",
        });
      }

      const deliveryBoy = await DeliveryBoy.findOne({
        user: req.user.userId,
      });

      if (!deliveryBoy) {
        return res.status(404).json({
          success: false,
          error: "Delivery profile not found",
        });
      }

      const order = await Order.findOneAndUpdate(
        {
          _id: orderId,
          deliveryBoyId: deliveryBoy._id,
          deliveryAssignmentStatus: "ACCEPTED",
          status: { $in: ["CONFIRMED", "PREPARING"] },
        },
        {
          $set: {
            status: "OUT_FOR_DELIVERY",
          },
        },
        { new: true },
      );

      if (!order) {
        return res.status(400).json({
          success: false,
          error: "Accepted assignment not found or delivery already started",
        });
      }

      res.json({
        success: true,
        message: "Delivery started successfully",
        order,
      });
    } catch (error) {
      console.error("Start delivery error:", error);

      res.status(500).json({
        success: false,
        error: "Failed to start delivery",
      });
    }
  },
);

// Complete an assigned delivery
router.patch(
  "/orders/:orderId/complete",

  protect,

  authorize("delivery"),

  async (req, res) => {
    try {
      const { orderId } = req.params;

      if (!mongoose.isValidObjectId(orderId)) {
        return res.status(400).json({
          success: false,

          error: "Invalid order ID",
        });
      }

      const deliveryBoy = await DeliveryBoy.findOne({
        user: req.user.userId,
      });

      if (!deliveryBoy) {
        return res.status(404).json({
          success: false,

          error: "Delivery profile not found",
        });
      }

      const order = await Order.findOneAndUpdate(
        {
          _id: orderId,

          deliveryBoyId: deliveryBoy._id,

          status: "OUT_FOR_DELIVERY",
        },

        {
          $set: {
            status: "DELIVERED",

            deliveredAt: new Date(),
          },
        },

        { new: true },
      );

      if (!order) {
        return res.status(404).json({
          success: false,

          error: "Assigned order not found or already completed",
        });
      }

      await DeliveryBoy.findOneAndUpdate(
        {
          _id: deliveryBoy._id,

          user: req.user.userId,

          currentOrderId: order._id,
        },

        {
          $set: {
            status:
              deliveryBoy.kycStatus === "APPROVED" ? "AVAILABLE" : "OFFLINE",

            currentOrderId: null,
          },

          $inc: {
            totalDeliveries: 1,
          },
        },
      );

      res.json({
        success: true,

        message: "Delivery completed successfully",

        order,
      });
    } catch (error) {
      console.error("Complete delivery error:", error);

      res.status(500).json({
        success: false,

        error: "Failed to complete delivery",
      });
    }
  },
);
// Update own location
router.patch(
  "/:id/location",

  protect,

  authorize("delivery"),

  async (req, res) => {
    try {
      const { id } = req.params;

      const { latitude, longitude } = req.body;

      if (!mongoose.isValidObjectId(id)) {
        return res.status(400).json({
          success: false,

          error: "Invalid delivery partner ID",
        });
      }

      const lat = Number(latitude);

      const lng = Number(longitude);

      if (
        !Number.isFinite(lat) ||
        !Number.isFinite(lng) ||
        lat < -90 ||
        lat > 90 ||
        lng < -180 ||
        lng > 180
      ) {
        return res.status(400).json({
          success: false,

          error: "Valid latitude and longitude are required",
        });
      }

      const deliveryBoy = await DeliveryBoy.findOneAndUpdate(
        {
          _id: id,

          user: req.user.userId,
        },

        {
          $set: {
            "location.latitude": lat,

            "location.longitude": lng,

            "location.updatedAt": new Date(),
          },
        },

        { new: true },
      ).select(safeFields);

      if (!deliveryBoy) {
        return res.status(404).json({
          success: false,

          error: "Delivery profile not found",
        });
      }

      res.json({
        success: true,

        message: "Location updated successfully",

        deliveryBoy,
      });
    } catch (error) {
      console.error("Update delivery location error:", error);

      res.status(500).json({
        success: false,

        error: "Failed to update location",
      });
    }
  },
);

// Get live delivery partner location for customer's order
router.get("/track/:orderId", protect, authorize("user"), async (req, res) => {
  try {
    const { orderId } = req.params;

    const order = await Order.findOne({
      orderId,
      userId: req.user.userId,
    })
      .select("orderId status deliveryBoyId")
      .populate({
        path: "deliveryBoyId",
        select: "name phone location status",
      })
      .lean();

    if (!order) {
      return res.status(404).json({
        success: false,
        error: "Order not found",
      });
    }

    if (order.status !== "OUT_FOR_DELIVERY") {
      return res.json({
        success: true,
        trackingActive: false,
        status: order.status,
        location: null,
      });
    }

    if (!order.deliveryBoyId) {
      return res.json({
        success: true,
        trackingActive: false,
        status: order.status,
        location: null,
      });
    }

    const { latitude, longitude, updatedAt } =
      order.deliveryBoyId.location || {};

    res.json({
      success: true,
      trackingActive: true,
      status: order.status,
      deliveryPartner: {
        name: order.deliveryBoyId.name,
        phone: order.deliveryBoyId.phone,
      },
      location:
        Number.isFinite(latitude) && Number.isFinite(longitude)
          ? { latitude, longitude, updatedAt }
          : null,
    });
  } catch (error) {
    console.error("Live tracking error:", error);

    res.status(500).json({
      success: false,
      error: "Failed to fetch tracking location",
    });
  }
});

// Get delivery partner by ID
router.get("/:id", protect, async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({
        success: false,

        error: "Invalid delivery partner ID",
      });
    }

    const deliveryBoy = await DeliveryBoy.findById(id)

      .select(safeFields)

      .lean();

    if (!deliveryBoy) {
      return res.status(404).json({
        success: false,

        error: "Delivery partner not found",
      });
    }

    const isOwner = deliveryBoy.user?.toString() === req.user.userId;

    const isAdmin = req.user.role === "admin";

    if (!isOwner && !isAdmin) {
      return res.status(403).json({
        success: false,

        error: "You cannot access this delivery profile",
      });
    }

    res.json(deliveryBoy);
  } catch (error) {
    console.error("Get delivery partner error:", error);

    res.status(500).json({
      success: false,

      error: "Failed to fetch delivery partner",
    });
  }
});

export default router;
