import mongoose from 'mongoose';
import bcrypt from 'bcrypt';

const Schema = mongoose.Schema;
const ObjectId = Schema.ObjectId;
 
const ProofModel = new Schema({
    addressProof: String,
    idProof: String,
    photoProof: String,
    createdTs: { type: Date, default: Date.now }
});

export const Proof = mongoose.model('proof', ProofModel);