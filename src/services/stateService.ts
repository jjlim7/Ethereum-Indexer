import { State } from '../models/stateModel';

// Function to get the last processed block from the state
export const getLastProcessedBlock = async (): Promise<number> => {
  const state = await State.findOne();
  return state ? state.lastProcessedBlock : 0; // Return 0 if no state exists
};

// Function to update the last processed block
export const updateLastProcessedBlock = async (lastBlock: number) => {
  await State.updateOne({}, { lastProcessedBlock: lastBlock }, { upsert: true });
};
