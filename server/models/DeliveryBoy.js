import mongoose from "mongoose";

const deliveryBoySchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    phone: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    email: {
      type: String,
      unique: true,
      sparse: true,
      trim: true,
      lowercase: true,
    },
    vehicle: {
      type: {
        type: String,
        enum: ["bike", "bicycle", "car"],
        default: "bike",
      },
      number: {
        type: String,
        required: true,
        trim: true,
        uppercase: true,
      },
      model: String,
      color: String,
    },
    license: {
      number: {
        type: String,
        required: true,
        trim: true,
        uppercase: true,
      },
      expiryDate: Date,
      frontImage: String,
      backImage: String,
    },
    aadhar: {
      number: {
        type: String,
        required: true,
        trim: true,
      },
      image: String,
    },
    address: {
      street: String,
      city: String,
      state: String,
      pincode: String,
    },
    bankDetails: {
      accountNumber: String,
      ifscCode: String,
      bankName: String,
      accountHolderName: String,
    },
    documents: {
      vehicleRC: String,
      insurance: String,
      photo: String,
    },
    location: {
      latitude: Number,
      longitude: Number,
      updatedAt: {
        type: Date,
        default: Date.now,
      },
    },
    kycStatus: {
      type: String,
      enum: ["PENDING", "APPROVED", "REJECTED"],
      default: "PENDING",
    },
    rejectionReason: {
      type: String,
      default: "",
    },
    reviewedAt: {
      type: Date,
      default: null,
    },
    reviewedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    status: {
      type: String,
      enum: ["AVAILABLE", "BUSY", "OFFLINE"],
      default: "OFFLINE",
    },
    currentOrderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Order",
      default: null,
    },
    rating: {
      type: Number,
      default: 0,
      min: 0,
      max: 5,
    },
    totalDeliveries: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  },
);

deliveryBoySchema.index({ status: 1 });

deliveryBoySchema.index({ kycStatus: 1 });

export default mongoose.model("DeliveryBoy", deliveryBoySchema);
