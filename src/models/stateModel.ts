import mongoose, { Document, Schema } from 'mongoose';

interface StateDocument extends Document {
  lastProcessedBlock: number;
}

const StateSchema = new Schema<StateDocument>({
  lastProcessedBlock: {
    type: Number,
    required: true,
    default: 0, // Start from block 0 initially
  },
});

export const State = mongoose.model<StateDocument>('State', StateSchema);
