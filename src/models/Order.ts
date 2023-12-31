import mongoose, { Schema, Document } from 'mongoose';

export interface OrderDoc extends Document {
  orderID: string;
  vandorID: string;
  items: [any];
  totalAmount: number;
  orderDate: Date;
  paidThrough: string; // COD, Credit Card, Wallet
  paymentResponse: string;
  orderStatus: string;
  remarks: string;
  deliveryId: string;
  appliedOffers: boolean;
  offerId: string;
  readyTime: number;
}

const OrderSchema = new Schema(
  {
    orderID: { type: String, required: true },
    vandorID: { type: String, required: true },
    items: [
      {
        food: { type: Schema.Types.ObjectId, ref: 'food', required: true },
        unit: { type: Number, required: true }
      }
    ],
    totalAmount: { type: Number, required: true },
    orderDate: { type: Date },
    paidThrough: { type: String },
    paymentResponse: { type: String },
    orderStatus: { type: String },
    remarks: { type: String },
    deliveryId: { type: String },
    appliedOffers: { type: Boolean },
    offerId: { type: String },
    readyTime: { type: Number }
  },
  {
    toJSON: {
      transform(doc, ret) {
        delete ret.__v;
        delete ret.createdAt;
        delete ret.updatedAt;
      }
    },
    timestamps: true
  }
);

const Order = mongoose.model<OrderDoc>('order', OrderSchema);
export { Order };
