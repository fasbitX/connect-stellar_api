import mongoose from 'mongoose';
import bcrypt from 'bcrypt';

const Schema = mongoose.Schema;
const ObjectId = Schema.ObjectId;
const saltRounds = 10;
 
const UserModel = new Schema({
  firstName: String,
  lastName: String,
  email: String,
  dob: String,
  code: String,
  mobile_number: String,
  password: String,
  postal: Number,
  address: String,
  image: String,
  proofs: { type: ObjectId, ref: 'proof' },
  stellarAddress: String,
  stellarSeed: String,
  otp: String,
  createdTs: { type: Date, default: Date.now }
});

UserModel.pre("save", function (next) {
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

UserModel.methods.comparePassword = function(candidatePassword, cb) {
    let user = this;
    bcrypt.compare(candidatePassword, user.password, function(err, isMatch) {
        if (err) return cb(err);
        cb(null, isMatch);
    });
};

export const User = mongoose.model('user', UserModel);