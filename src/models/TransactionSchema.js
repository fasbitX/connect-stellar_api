import mongoose from 'mongoose';
import bcrypt from 'bcrypt';

const Schema = mongoose.Schema;
const ObjectId = Schema.ObjectId;
const saltRounds = 10;
 
const TransactionModel = new Schema({
    sender: { type: ObjectId, ref: 'user' },
    receiver: { type: ObjectId, ref: 'user' },
    currency: { type: String, enum: ['usd', 'xlm'] },
    amount: String,
    cardNumber: String,
    fee: String,
    createdTs: { type: Date, default: Date.now },
    hash: String,
    transactionID: String,
    walletAmount: String,
    walletFee: String
});

export const Transaction = mongoose.model('transaction', TransactionModel);