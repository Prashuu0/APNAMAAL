import mongoose from "mongoose";

const restaurantSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    image: {
      type: String,
      required: true,
    },
    cuisine: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      default: "",
    },
    rating: {
      type: Number,
      default: 0,
      min: 0,
      max: 5,
    },
    deliveryTime: {
      type: Number,
      required: true,
      default: 30, // minutes
    },
    costForTwo: {
      type: Number,
      default: 0,
    },
    offer: {
      type: String,
      default: null,
    },
    isOpen: {
      type: Boolean,
      default: true,
    },
    operatingHours: {
      open: {
        type: String,
        default: "10:00",
      },
      close: {
        type: String,
        default: "22:00",
      },
    },
    address: {
      street: String,
      city: String,
      state: String,
      pincode: String,
    },
    location: {
      latitude: Number,
      longitude: Number,
    },
    deliveryFee: {
      type: Number,
      default: 30,
    },
    freeDeliveryAbove: {
      type: Number,
      default: 500,
    },
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: false, // For now, can be added later
    },

    // Dataset / external source information
    source: {
      type: String,
      enum: ["DATASET", "OWNER_ADDED"],
      default: "OWNER_ADDED",
    },
    externalSourceId: {
      type: String,
      unique: true,
      sparse: true,
    },
    externalUrl: {
      type: String,
      default: "",
    },
    kind: {
      type: String,
      default: "",
    },
    diet: {
      type: String,
      default: "",
    },
    hoursText: {
      type: String,
      default: "",
    },
    priceBand: {
      type: String,
      default: "",
    },
    menuItemsText: {
      type: String,
      default: "",
    },
    availabilityVerified: {
      type: Boolean,
      default: false,
    },
    isClaimed: {
      type: Boolean,
      default: false,
    },
    claimStatus: {
      type: String,
      enum: ["UNCLAIMED", "PENDING", "APPROVED", "REJECTED"],
      default: "UNCLAIMED",
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
    updatedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  },
);

// Index for search
restaurantSchema.index({ name: "text", cuisine: "text", description: "text" });

export default mongoose.model("Restaurant", restaurantSchema);
