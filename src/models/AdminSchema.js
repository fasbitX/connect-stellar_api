import mongoose from 'mongoose';
import bcrypt from 'bcrypt';

const Schema = mongoose.Schema;
const ObjectId = Schema.ObjectId;
const saltRounds = 10;
 
const AdminModel = new Schema({
  mobile_number: String,
  password: String,
  createdTs: { type: Date, default: Date.now },
  stellarAddress: String,
  stellarSeed: String,
  stripeKey: String,
  sellRate: String,
  sellTransactionFee: String,
  sendTransactionFee: String,
  termsAndConditions: String
});

AdminModel.pre("save", function (next) {
    let user = this;
    bcrypt.genSalt(saltRounds, function(error, salt) {
        if(error) return next(error);
        bcrypt.hash(user.password, salt, function(error, hash) {
            if(error) return next(error);
            // Store hashed password in DB.
            user.password = hash;
            next();
        });
    });
});

AdminModel.methods.comparePassword = function(candidatePassword, cb) {
    let user = this;
    bcrypt.compare(candidatePassword, user.password, function(err, isMatch) {
        if (err) return cb(err);
        cb(null, isMatch);
    });
};

export const Admin = mongoose.model('admin', AdminModel);