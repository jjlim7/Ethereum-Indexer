// models/EthPriceModel.ts
import mongoose from "mongoose";

const ethPriceSchema = new mongoose.Schema({
  ethPriceInUSDT: { type: Number, required: true },
  timeStamp: { type: Date, required: true, unique: true },
});

export const EthPrice = mongoose.model("EthPrice", ethPriceSchema);
