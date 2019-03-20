import StellarSdk from 'stellar-sdk';
import { AES, enc } from 'crypto-js';
import request from 'request';
import fs from 'fs';
import http from 'http';
import { Transform } from 'stream';
import async from 'async';    
import lodash from 'lodash';                                          

import { payment } from '../service/stellarAccount'
import { getUserProfile } from './user';
import { getAdmin } from './admin';
import { Transaction } from '../models/TransactionSchema'; 
import { saveCardDetails, saveWithdrawDetails } from './card';
import { createAccount, getAccount } from '../service/stellarAccount';

// const stripe = require("stripe")('sk_test_BlD4SrbP60Qa94PrQ1pTHYtB');


const ENVCryptoSecret = 'Stellar-is-awesome';
StellarSdk.Network.useTestNetwork();

let marketRate;

export const fiatBalance = async (req, res) => {
  const admin = await getAdmin();
  const stripe = require("stripe")(admin.stripeKey);
  stripe.balance.retrieve(function(error, balance) {
    if(error) res.status(500).send('OOPS!! Something went wrong');
    res.status(200).send(balance)
  });  
}

export const stellarBalance = async(req, res) => {
  const response = await getAdmin();
  
  const result = await getAccount(response.stellarAddress);
  res.status(200).send(result.balances);
}

export const nativeAssetTransaction = async (req, res) => {
    
    const sender = await getUserProfile(req.body.sender);
    const receiver = await getUserProfile(req.body.receiver);
    const admin = await getAdmin();

    // const sender = {
    //   stellarAddress: "GCD6WBCRZ7HUSMCWPSCHKLCVKWC3VD5PH43ARYUAUSET6IEO5ERTXYEI",
    //   stellarSeed: "SAA7KH36FRAAJH575ZQTVJKGCRIEX7NHQBAE57XVMP6XY6PCNH4WAM2O"
    // }

    // const receiver = {
    //   stellarAddress: "GCGEZ26EZB3NVHYF7BSLLJZM2K2DI5H3CZR6VNYJMB6FJHGPENHFGH5H",
    //   stellarSeed: "U2FsdGVkX1+/kq8rTmIL0+MF2cUtKzXUVhfNL1gX48mfrZmHj3KehcP+7ZiAjrmLCkM6T+gRcDKS9wSl4dMe5iMvUjIrISZ1HblQ0q4iyOI="
    // }

    const signerKeys = StellarSdk.Keypair.fromSecret(
        AES.decrypt(
            sender.stellarSeed,
            ENVCryptoSecret
        ).toString(enc.Utf8)
    )

    try {
        const amount = req.body.amount

        const { hash } = await payment(
          signerKeys,
          receiver.stellarAddress,
          req.body.amount.toString()
        )
        console.log('sent successfully', hash);

        const transactionFee = await payment(
          signerKeys,
          admin.stellarAddress,
          req.body.fee.toString()
        )
        console.log('admin sent successfully', transactionFee.hash);

        const dbUpdate = Object.assign({}, {'sender': sender._id, 'receiver': receiver._id, 'amount': req.body.amount, 'currency': 'xlm', 'fee': req.body.fee, 'hash': hash, 'walletAmount': req.body.walletAmount, 'walletFee': req.body.walletFee });
        let result = await saveTransaction(dbUpdate, res);

        if (result !== '') res.status(200).send(result);
      } catch (error) {
        console.log('error', error);
        res.status(500).send({'message': 'OOPS!! Something went wrong','error':error})
      }
}

export const saveTransaction = (data) => {
  let transaction = new Transaction(data);
  return transaction.save();
}

export const sentStellarTransaction = async (req, res) => {
  const admin = await getAdmin();
  Transaction.find({$and: [{currency: 'xlm', sender: admin._id}]})
    .sort({createdTs: -1})
    .populate({ path: 'receiver', select: 'stellarAddress'})
    .exec((error, response) => {
      if(error) res.status(500).send('OOPS!! Something went wrong');
      else {
          res.status(200).send(response);
      }
  });
}

export const receivedStellarTransaction = async (req, res) => {
  const admin = await getAdmin();
  Transaction.find({$and: [{currency: 'xlm', receiver: admin._id}]})
    .sort({createdTs: -1})
    .populate({ path: 'sender', select: 'stellarAddress'})
    .exec((error, response) => {
      if(error) res.status(500).send('OOPS!! Something went wrong');
      else {
          res.status(200).send(response);
      }
  });
}

export const withdrawTransaction = async (req, res) => {
  const admin = await getAdmin();
  Transaction.find({$and: [{currency: 'usd', sender: admin._id}]})
    .sort({createdTs: -1})
    .exec((error, response) => {
      if(error) res.status(500).send('OOPS!! Something went wrong');
      else {
          res.status(200).send(response);
      }
  });
}

export const depositTransaction = async (req, res) => {
  const admin = await getAdmin();
  Transaction.find({$and: [{currency: 'usd', receiver: admin._id}]})
    .sort({createdTs: -1})
    .exec((error, response) => {
      if(error) res.status(500).send('OOPS!! Something went wrong');
      else {
          res.status(200).send(response);
      }
  });
}

export const getReceivedAmount = (transactionId) => {
  return Transaction.findOne({transactionID: transactionId}, (error, response) => {
      if(error) console.error({'message': error})
      else {
          return(response);
      }
  })
}

export const depositFeeTransaction = async (req, res) => {
  const admin = await getAdmin();
  Transaction.find({$and: [{currency: 'usd', receiver: admin._id}]})
      .sort({createdTs: -1})
      .lean()
      .exec(async (error, response) => {
          if(error) console.error(error);
          else {
              const final = [];
              async.eachLimit(response, 1, async (usdTransaction, callback) => {
                  const xlmTransaction = await getReceivedAmount(usdTransaction._id);
                  if(xlmTransaction !== null) final.push(Object.assign({}, usdTransaction, {fee: xlmTransaction.fee, received: xlmTransaction.amount}));
                  callback();
              }, () => {
                  res.status(200).send(final);
              });
          }
      });
}

export const withdrawFeeTransaction = async (req, res) => {
  const admin = await getAdmin();
  Transaction.find({$and: [{currency: 'xlm', receiver: admin._id}]})
      .sort({createdTs: -1})
      .lean()
      .exec(async (error, response) => {
          if(error) console.error(error);
          else {
              const final = [];
              async.eachLimit(response, 1, async (xlmTransaction, callback) => {
                  const usdTransaction = await getReceivedAmount(xlmTransaction._id);
                  if(usdTransaction !== null) final.push(Object.assign({}, xlmTransaction, {fee: usdTransaction.walletFee, received: usdTransaction.amount}));
                  callback();
              }, () => {
                  res.status(200).send(final);
              });
          }
      });
}

export const userTransaction = async(req, res) => {
  const admin = await getAdmin();
  Transaction.find({$and: [{currency: 'xlm', receiver: {$ne: admin._id}, sender: {$ne: admin._id}}]})
    .sort({createdTs: -1})
    .populate({ path: 'receiver', select: ['stellarAddress', '_id']})
    .exec((error, response) => {
      if(error) res.status(500).send('OOPS!! Something went wrong');
      else {
          res.status(200).send(response);
      }
  });
}

const checkStellarAmount = async (admin, req, res, next) => {
  const response = await getAdmin();
  const result = await getAccount(response.stellarAddress);
  res.status(200).send(result.balances);
}

export const stripeTransaction = async (req, res) => {

  console.log(req.body);
  await getCurrentStellarRate();
  const admin = await getAdmin();
  if(req.body.saveCard === true || req.body.saveCard == 1) {
    const card = await saveCardDetails(req.body.card);
    console.log('inside if');
  }

  console.log('admin.stripeKey '+admin.stripeKey);
  const stripe = require("stripe")(admin.stripeKey);

  stripe.customers.create({
    description: 'Customer for stripe transaction',
    source: req.body.stripeToken 
  }, (error, customer) => {
    if(error || customer === null) {
      console.log('error occured '+error)
      return res.status(500).send('OOPS!! Something went wrong');
    }
    stripe.charges.create({
      amount: (req.body.amount * 100).toString(),
      currency: "usd",
      customer: customer.id,
      description: "Charge for each transaction"
    }, async (error, charge) => {
      console.log(error);
      if(error || charge == null) res.status(500).send('OOPS!! Something went wrong');
      if(charge.status === 'succeeded') {
        const dbUpdate = Object.assign({}, {'sender': req.body.user, 'receiver': admin._id, 'amount': req.body.amount, 'currency': 'usd', 'cardNumber': req.body.card.number });
        const usdTransaction = await saveTransaction(dbUpdate);

        await stellarPayment(admin, usdTransaction, req, res);
      }
    });
  });
}

export const stellarPayment = async (admin, usdTransaction, req, res) => {
  const receiver = await getUserProfile(req.body.user);
  console.log('admin.stellarSeed'+admin.stellarSeed)
  const adminKeys = StellarSdk.Keypair.fromSecret(
     AES.decrypt(
      admin.stellarSeed,
      ENVCryptoSecret
    ).toString(enc.Utf8)
  )

  try {
    const { hash } = await payment(
      adminKeys,
      receiver.stellarAddress,
      req.body.xlmAmount.toString()
    )
    console.log('sent successfully', hash);
    
    const dbUpdate = Object.assign({}, {'sender': admin._id, 'receiver': receiver._id, 'amount': req.body.xlmAmount, 'currency': 'xlm', 'transactionID': usdTransaction._id, 'hash': hash});
    let result = await saveTransaction(dbUpdate, res);
    //let resp = Object.assign({}, result, {usdAmount: usdTransaction.amount});
    
    let resp = {};
    resp.data = result;
    resp.fiat_amount = usdTransaction.amount;
    if (result !== '') res.status(200).send(resp);
  } catch (error) {
    res.status(500).send('OOPS!! Something went wrong');
  }
}

export const getCurrentStellarRate = async () => {
  request('https://min-api.cryptocompare.com/data/price?fsym=USD&tsyms=XLM', (error, result) => {
    if(error) console.error(error);
    else {
        marketRate = JSON.parse(result.body).XLM
    }
})
}

const checkFiatAmount = async (admin, req, res, next) => {
  const stripe = require("stripe")(admin.stripeKey);
  stripe.balance.retrieve(function(error, balance) {
    if(error) res.status(500).send('OOPS!! Something went wrong');
    if(balance < req.body.usd * 100) res.status(500).send('Please try smaller amount');
    else next();
  });
}

export const withdraw = async (req, res) => {
  fileUpload(req, res);
}

const downloadFile = async (url, extension, req) => {                                                 
  return new Promise((resolve, reject) => {
    http.request(url, function(response) {                                        
      var data = new Transform();                                                    
    
      response.on('data', function(chunk) {                                       
        data.push(chunk);                                                         
      });                                                                         
    
      response.on('end', async function() { 
        const currentDate = Date.now();                                           
        await fs.writeFileSync(`images/${req.params.id}.${extension}`, data.read()); 
        resolve()                              
      });                                                                         
    }).end(console.log('end'));
  })
}

const fileUpload = async (req, res) => {

  const url = req.body.verificationFile;
  const extensionArray = url.split('.');
  const extension = extensionArray[extensionArray.length - 1];
  await downloadFile(url, extension, req);
  const admin = await getAdmin();
  const stripe = require("stripe")(admin.stripeKey);

  stripe.fileUploads.create(
    {
      purpose: 'identity_document',
      file: {
        data: fs.readFileSync(`images/${req.params.id}.${extension}`),
        name: 'licence.jpg',
        type: 'application/octet-stream'
      }
    }, (error, file) => {
      if(error) res.status(500).send('OOPS!! Something went wrong');
      createStripeAccount(file, req, res);
  })
}


const createStripeAccount = async (file, req, res) => {

  const admin = await getAdmin();
  const stripe = require("stripe")(admin.stripeKey);

  stripe.accounts.create({
    country: "US",
    type: "custom",
    legal_entity: {
      first_name: req.body.firstName,
      last_name: req.body.lastName,
      ssn_last_4: req.body.ssn,
      dob: {
        day: req.body.day,
        month: req.body.month,
        year: req.body.year
      },
      address: {
        city: req.body.city,
        line1: req.body.line1,
        line2: req.body.line2,
        postal_code: req.body.postalCode,
        state: req.body.state
      },
      verification: {
        document: file.id
      },
      type: 'individual',
      phone_number: req.body.phoneNumber
    }
  }, (error, account) => {
    if(error || account === null) res.status(500).send('OOPS!! Something went wrong');
    createBankToken(account.id, req, res);
  });
}

const createBankToken = async (accountId, req, res) => {

  const admin = await getAdmin();
  const stripe = require("stripe")(admin.stripeKey);

  stripe.tokens.create({
    bank_account: {
      country: 'US',
      currency: 'usd',
      account_holder_name: req.body.accountHolder,
      account_holder_type: 'individual',
      routing_number: req.body.routingNumber,
      account_number: req.body.accountNumber
    }
  }, (error, token) => {
    if(error || token === null) res.status(500).send('OOPS!! Something went wrong');
    createBankAccount(accountId, token.id, req, res)
  });
}

const createBankAccount = async (accountId, tokenId, req, res) => {

  const admin = await getAdmin();
  const stripe = require("stripe")(admin.stripeKey);

  stripe.accounts.createExternalAccount(
    accountId,
    { external_account: tokenId },
    (error, bank_account) => {
      if(error) res.status(500).send('OOPS!! Something went wrong');
      createTransfers(accountId, req, res);
    }
  );
}

const createTransfers = async (accountId, req, res) => {

  const admin = await getAdmin();
  const stripe = require("stripe")(admin.stripeKey);

  const xlmTransaction = await createStellarTransfer(req, res);

  stripe.transfers.create({
    amount: Math.round((Number(req.body.usd) - Number(req.body.walletFee)) * 100),
    currency: "usd",
    destination: accountId
  }, async (error, transfer) => {

    if(error) res.status(500).send('OOPS!! Something went wrong');
    if(req.body.saveDetails  === true || req.body.saveDetails  == 1) {
      await saveWithdrawDetails(lodash.pick(req.body, ['ssn', 'firstName', 'lastName', 'day', 'month', 'year', 'city', 'line1', 'line2', 'state', 'postalCode', 'phoneNumber',
      'verificationFile', 'accountNumber', 'accountHolder', 'routingNumber', 'user']));
    }
    const dbUpdate = Object.assign({}, {'sender': admin._id, 'receiver': req.params.id, 'amount': req.body.usd, 'currency': 'usd',  'walletFee': req.body.walletFee, 'transactionID': xlmTransaction._id});
    const usdUpdate = await saveTransaction(dbUpdate);

    res.status(200).send(usdUpdate);
  });
}

const createStellarTransfer = async (req, res) => {

  return new Promise(async (resolve, reject) => {
    const admin = await getAdmin();
    const user = await getUserProfile(req.params.id);

    const signerKeys = StellarSdk.Keypair.fromSecret(
      AES.decrypt(
          user.stellarSeed,
          ENVCryptoSecret
      ).toString(enc.Utf8)
    )

    try {
      const { hash } = await payment(
        signerKeys,
        admin.stellarAddress,
        req.body.xlm.toString()
      )
      console.log('sent successfully', hash);

      const sendUpdate = Object.assign({}, {'sender': user._id, 'receiver': admin._id, 'amount': req.body.xlm, 'currency': 'xlm', fee: Number(req.body.fee) + Number(req.body.rate), 'hash': hash});
      const xlmTransaction = await saveTransaction(sendUpdate);
      resolve(xlmTransaction)
    } catch (error) {
      res.status(500).send('OOPS!! Something went wrong');
    }
  });
}