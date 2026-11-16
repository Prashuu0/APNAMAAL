import mongoose from "mongoose";

const orderSchema = new mongoose.Schema(
  {
    orderId: {
      type: String,
      unique: true,
      required: true,
    },

    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    restaurantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Restaurant",
      required: true,
    },

    items: [
      {
        item: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "MenuItem",
          required: true,
        },
        name: String,
        price: Number,
        quantity: {
          type: Number,
          required: true,
          min: 1,
        },
      },
    ],

    address: {
      type: String,
      required: true,
    },

    paymentMethod: {
      type: String,
      required: true,
      enum: ["COD", "UPI", "Card", "Wallet"],
    },

    status: {
      type: String,
      enum: [
        "PLACED",
        "CONFIRMED",
        "PREPARING",
        "OUT_FOR_DELIVERY",
        "DELIVERED",
        "CANCELLED",
      ],
      default: "PLACED",
    },

    deliveryBoyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "DeliveryBoy",
      default: null,
    },

    // Delivery assignment details
    deliveryAssignmentStatus: {
      type: String,
      enum: ["NOT_ASSIGNED", "PENDING", "ACCEPTED", "REJECTED"],
      default: "NOT_ASSIGNED",
    },

    deliveryAssignedAt: {
      type: Date,
      default: null,
    },

    deliveryRespondedAt: {
      type: Date,
      default: null,
    },

    deliveryRejectionReason: {
      type: String,
      default: "",
    },

    deliveryAssignedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    scheduled: {
      type: Boolean,
      default: false,
    },

    scheduledDate: {
      type: Date,
      default: null,
    },

    scheduledTime: {
      type: String,
      default: null,
    },

    pricing: {
      subtotal: {
        type: Number,
        required: true,
      },
      deliveryFee: {
        type: Number,
        default: 0,
      },
      tax: {
        type: Number,
        default: 0,
      },
      discount: {
        type: Number,
        default: 0,
      },
      total: {
        type: Number,
        required: true,
      },
    },

    // Coupon details
    couponId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Coupon",
      default: null,
    },

    couponCode: {
      type: String,
      default: null,
    },

    // Cancellation details
    cancelledBy: {
      type: String,
      enum: ["user", "restaurant_owner", "admin", "system"],
      default: null,
    },

    cancellationReason: {
      type: String,
      default: "",
    },

    cancelledAt: {
      type: Date,
      default: null,
    },

    // Refund details
    refund: {
      status: {
        type: String,
        enum: ["NOT_REQUIRED", "PENDING", "PROCESSING", "COMPLETED", "FAILED"],
        default: "NOT_REQUIRED",
      },

      amount: {
        type: Number,
        default: 0,
      },

      refundId: {
        type: String,
        default: null,
      },

      processedAt: {
        type: Date,
        default: null,
      },

      failureReason: {
        type: String,
        default: "",
      },
    },

    etaMinutes: {
      type: Number,
      default: 30,
    },

    deliveredAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  },
);

orderSchema.index({ userId: 1, createdAt: -1 });
orderSchema.index({ restaurantId: 1, status: 1 });
orderSchema.index({ deliveryBoyId: 1, deliveryAssignmentStatus: 1 });
orderSchema.index({ status: 1, deliveryAssignmentStatus: 1 });

export default mongoose.model("Order", orderSchema);
