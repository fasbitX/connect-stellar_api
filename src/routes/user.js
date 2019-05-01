import cloudinary from 'cloudinary';

import { User } from '../models/UserSchema';
import { Proof } from '../models/ProofSchema';
import { sendSms } from '../service/sendSms';
import { createAccount, getAccount } from '../service/stellarAccount';
import { Transaction } from '../models/TransactionSchema';
import request from 'request';
import lodash from 'lodash';
import { getAdmin } from './admin';
import async from 'async';
import logger from '../service/logger';

export const saveUser = (req, res) => {
    //console.log("Enter save user func, user mobile : ", req.body.mobile_number);
    if (req.body.mobile_number == null || new String(req.body.mobile_number).length <= 1) {
        res.status(500).send({ 'message': 'OOPS!! missing mobile number' });
        return;
    }
    if (req.body.code == null || new String(req.body.code).length <= 1) {
        res.status(500).send({ 'message': 'OOPS!! missing code' });
        return;
    }
    if (req.body.password == null || new String(req.body.password).length <= 1) {
        res.status(500).send({ 'message': 'OOPS!! missing password' });
        return;
    }
    try {
        User.findOne({ mobile_number: req.body.mobile_number, code: req.body.code }, (error, existingUser) => {

            if (error) {
                console.error(error);
                logger.error(error);
                res.status(500).send({ 'message': 'OOPS!! Something went wrong' });
                return
            }
            if (existingUser !== null) {
                loginUser(req, res);
            } else {
                createUser(req, res);
            }
        })
        
    }
    catch (error) {
        res.status(500).send({ 'message': 'OOPS!! Something went wrong' });
        return;
    }
}

export const createUser = (req, res) => {
    console.log("Create User func");
    const user = new User(req.body);
    try {
        user.save(async (error, response) => {
            if (error) res.status(500).send({ 'message': 'OOPS!! Something went wrong' });
            else {
                try {
                    const result = await createAccount();
                    const otp = await sendSms(req.body.mobile_number);
                    console.log('otp', otp);
                    updateUser(response._id, Object.assign({}, result, { 'otp': otp }), res);
                } catch (error) {
                    res.status(500).send({ 'message': 'OOPS!! Something went wrong' });
                    return;
                }
            }
        })
    } catch (error) {
        res.status(500).send({ 'message': 'OOPS!! Something went wrong' });
        return;
    }
}

export const createAddress = async (req, res) => {
    //
        try {
            const result = await createAccount();
            console.log(result);
            //await updateUser(req.body._id, Object.assign({}, result), res);
            res.send({ 'status': true, 'data': result });
        } catch (error) {
            res.status(500).send({ 'message': 'OOPS!! Something went wrong' });
            return;
        }
    
}

export const updateUser = (id, body, res) => {
    try {
        User.findOneAndUpdate(
            { _id: id },
            { $set: body },
            { new: true, upsert: true },
            (error, response) => {
                if (error) res.status(500).send({ 'message': 'OOPS!! Something went wrong' });
                else {
                    res.status(200).send(response);
                }
            }
        )
    } 
    catch (error) {
        res.status(500).send({ 'message': 'OOPS!! Something went wrong' });
        return;
    }
}

export const editProfile = (req, res) => {
    updateUser(req.params.id, req.body, res)
}

export const loginUser = (req, res) => {
    try {
        User.findOne(
            { mobile_number: req.body.mobile_number },
            (error, user) => {
                if (error) res.status(500).send({ 'message': error })
                else {
                    user.comparePassword(req.body.password, (error, isMatch) => {
                        if (error) res.status(500).send({ 'message': error })
                        else {
                            isMatch ? res.status(200).send({ user, message: 'Existing user' }) : res.status(500).send({ 'message': 'Incorrect password' });
                        }
                    });
                }
            }
        )
    }
    catch (error) {
        res.status(500).send({ 'message': 'OOPS!! Something went wrong' });
        return;
    }
}

export const uploadImage = (req, res) => {
    if (req.body.image == null || new String(req.body.image).length <= 1) {
        res.status(500).send({ 'message': 'OOPS!! Something went wrong' });
        return;
    }
    try{
        cloudinary.v2.uploader.upload(`data:image/jpg;base64,${req.body.image}`, (error, result) => {
            console.log('err', error, result);
            res.send(result);
        });
    }
    catch (error) {
        res.status(500).send({ 'message': 'OOPS!! Something went wrong' });
        return;
    } 
}

export const searchAutocomplete = (req, res) => {
    const regex = new RegExp(`^${req.query.mobile_number}`);
    try {
        User.find({ mobile_number: regex }, (error, response) => {
            if (error) res.status(500).send({ 'message': 'OOPS!! Something went wrong' });
            else {
                res.status(200).send(response);
            }
        })
    }
    catch (error) {
        res.status(500).send({ 'message': 'OOPS!! Something went wrong' });
        return;
    }
}

export const getUser = async (req, res) => {
    try {
        User.findOne({ _id: req.params.id })
        .populate('proofs')
        .exec((error, response) => {
            if (error) res.status(500).send({ 'message': 'OOPS!! Something went wrong' });
            else {
                res.status(200).send(response);
            }
        })
    } catch (error) {
        res.status(500).send({ 'message': 'OOPS!! Something went wrong' });
        return;
    }
    
}

export const getUserDetails = async (req, res) => {
    try{
        User.findOne({ mobile_number: req.query.mobile_number })
        .exec((error, response) => {
            if (error) res.status(500).send({ 'message': 'OOPS!! Something went wrong' });
            else {
                res.status(200).send(response);
            }
        })
    }
    catch (error) {
        res.status(500).send({ 'message': 'OOPS!! Something went wrong' });
        return;
    }
}

export const getUserProfile = (id,res) => {
    try {
        return User.findOne({ _id: id }, (error, response) => {
            if (error) res.status(500).send({ 'message': 'OOPS!! Something went wrong' });
            else {
                if(response) {
                    console.log("response")
                    return (response);
                } else {
                    console.log("no response")
                    res.status(500).send({ 'message': 'OOPS!!' });
                }
            }
        })
    } catch (error) {
        res.status(500).send({ 'message': 'OOPS!! Something went wrong' });
        return;
    }
}

export const getCountryCode = (req, res) => {
    const country = [];
    const url = (req.query.name == undefined || req.query.name == null || req.query.name == '') ? 'https://restcountries.eu/rest/v2/all' : `https://restcountries.eu/rest/v2/name/${req.query.name}`;
    try{
        request(url, (error, result) => {
            if (error) res.status(500).send({ 'message': error })
            else {
                JSON.parse(result.body).map((item) => country.push(lodash.pick(item, ['name', 'callingCodes', 'flag'])));
                res.status(200).send(country);
            }
        })
    } catch (error) {
        res.status(500).send({ 'message': 'OOPS!! Something went wrong' });
        return;
    }
}

export const getAllProfile = (req, res) => {
    try {
        User.find()
        .populate('proofs')
        .exec((error, response) => {
            if (error) res.status(500).send({ 'message': 'OOPS!! Something went wrong' });
            else {
                res.status(200).send(response);
            }
        })
    }
    catch (error) {
        res.status(500).send({ 'message': 'OOPS!! Something went wrong' });
        return;
    }
}

export const getUserCount = (req, res) => {
    try {
        User.countDocuments()
        .exec((error, count) => {
            if (error) res.status(500).send({ 'message': 'OOPS!! Something went wrong' });
            else {
                res.status(200).send({ count: count });
            }
        })
    } catch (error) {
        res.status(500).send({ 'message': 'OOPS!! Something went wrong' });
        return;
    }
}

export const getStellarAccount = async (req, res) => {
    try {
        const user = await getUserProfile(req.params.id);
        const result = await getAccount(user.stellarAddress);
   
        res.status(200).send(result.balances);
    } catch (error) {
        res.status(500).send({ 'message': 'OOPS!! Something went wrong' });
        return;
    }
}

export const uploadKyc = async (req, res) => {
    if (req.body.addressProof == null || new String(req.body.addressProof).length <= 1) {
        res.status(500).send({ 'message': 'OOPS!! missing address' });
        return;
    }
    if (req.body.idProof == null || new String(req.body.idProof).length <= 1) {
        res.status(500).send({ 'message': 'OOPS!! missing id' });
        return;
    }
    const proof = new Proof(req.body);
    try {
        proof.save(async (error, response) => {
            if (error) res.status(500).send({ 'message': 'OOPS!! Something went wrong' });
            else {
                updateUser(req.params.id, { 'proofs': response._id }, res);
            }
        })
    } catch (error) {
        res.status(500).send({ 'message': 'OOPS!! Something went wrong' });
        return;
    }
    
}

export const sentStellarTransaction = async (req, res) => {
    let admin;

    try {
        admin = await getAdmin();
    } catch (error) {
        logger.error(error);
        res.status(500).send({ 'message': 'OOPS!! Something went wrong', 'error': error });
        return;
    }

    console.log('stellar transaction get')
    Transaction.find({ $and: [{ currency: 'xlm', sender: req.params.id, receiver: { $ne: admin._id } }] })
        //Transaction.find({$and: [{currency: 'xlm', sender: req.params.id}]})
        .sort({ createdTs: -1 })
        .populate({ path: 'receiver', select: ['stellarAddress', 'full_name'] })
        .exec((error, response) => {
            if (error) {
                res.status(500).send({ 'message': 'OOPS!! Something went wrong', 'error': error });
                return;
            }
            else {
                res.status(200).send(response);
            }
        });
}

export const receivedStellarTransaction = async (req, res) => {
    let admin;

    try {
        admin = await getAdmin();
    } catch (error) {
        logger.error(error);
        res.status(500).send({ 'message': 'OOPS!! Something went wrong', 'error': error });
        return;
    }

    Transaction.find({ $and: [{ currency: 'xlm', receiver: req.params.id, sender: { $ne: admin._id } }] })
        .sort({ createdTs: -1 })
        .populate({ path: 'sender', select: ['stellarAddress', 'full_name', 'mobile_number'] })
        .exec((error, response) => {
            if (error) {
                res.status(500).send({ 'message': 'OOPS!! Something went wrong', 'error': error });
                return;
            }
            else {
                res.status(200).send(response);
            }
        });
}

export const getReceivedAmount = (transactionId) => {
    console.log('called', transactionId);
    return Transaction.findOne({ transactionID: transactionId }, (error, response) => {
        console.log('response', response);
        if (error) res.status(500).send({ 'message': 'OOPS!! Something went wrong' });
        else {
            return (response);
        }
    })
}

export const depositTransaction = async (req, res) => {
    Transaction.find({ $and: [{ currency: 'usd', sender: req.params.id }] })
        .sort({ createdTs: -1 })
        .lean()
        .exec(async (error, response) => {
            if (error) res.status(500).send({ 'message': 'OOPS!! Something went wrong' });
            else {
                const final = [];
                async.eachLimit(response, 1, async (usdTransaction, callback) => {
                    const xlmTransaction = await getReceivedAmount(usdTransaction._id);
                    if (xlmTransaction !== null) final.push(Object.assign({}, usdTransaction, { hash: xlmTransaction.hash, received: xlmTransaction.amount }));
                    callback();
                }, () => {
                    res.status(200).send(final);
                });
            }
        });
}

export const withdrawTransaction = async (req, res) => {
    const admin = await getAdmin();
    Transaction.find({ $and: [{ currency: 'xlm', sender: req.params.id, receiver: admin._id }] })
        .sort({ createdTs: -1 })
        .lean()
        .exec(async (error, response) => {
            if (error) res.status(500).send({ 'message': 'OOPS!! Something went wrong' });
            else {
                const final = [];
                async.eachLimit(response, 1, async (xlmTransaction, callback) => {
                    const usdTransaction = await getReceivedAmount(xlmTransaction._id);
                    if (usdTransaction !== null) final.push(Object.assign({}, xlmTransaction, { received: usdTransaction.amount, walletFee: usdTransaction.walletFee }));
                    callback();
                }, () => {
                    res.status(200).send(final);
                })
            }
        });
}
