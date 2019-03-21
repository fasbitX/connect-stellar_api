import express from 'express';
import bodyParser from 'body-parser';
import mongoose from 'mongoose';
import { User } from './models/UserSchema';
import cloudinary from 'cloudinary';
import { Admin } from './models/AdminSchema'; 
const MessagingResponse = require('twilio').twiml.MessagingResponse;


const app = express();

//db connection
const url = 'mongodb://mongo:27017/WhatsappClone';
console.log("Mongo URL: " + url)
mongoose.connect(url, { useNewUrlParser: true }); 
console.log("*****************************Mongo Connection: *************************** ");
console.log(mongoose.connection.readyState);
console.log("*****************************Mongo Connection: *************************** ");

// new Admin({
//     mobile_number: 1234567890,
//     password: '00000',
// }).save().then(console.log('created'));

// body parser config
app.use(bodyParser.json({limit: '50mb'}));
app.use(bodyParser.urlencoded({ limit: '50mb', extended: true }))

// CORS
app.use(function (req, res, next) {

    // Website you wish to allow to connect
    res.setHeader('Access-Control-Allow-Origin', '*');

    // Request methods you wish to allow
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');

    // Request headers you wish to allow
    res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With,content-type');

    // Set to true if you need the website to include cookies in the requests sent
    // to the API (e.g. in case you use sessions)
    res.setHeader('Access-Control-Allow-Credentials', true);

    // Pass to next layer of middleware
    next();
});

// cloudinary config
cloudinary.config({ 
    cloud_name: 'draalvptx', 
    api_key: '388483629878342', 
    api_secret: 'pAPT2KDGkyNcyBKT9NuqzjkM5VA' 
});  

// routes
app.post('/user', require('./routes/user').saveUser)
app.post('/user/:id', require('./routes/user').editProfile)
app.get('/user/:id', require('./routes/user').getUser)
app.post('/upload', require('./routes/user').uploadImage)
app.post('/payment', require('./routes/transaction').nativeAssetTransaction)
app.get('/search', require('./routes/user').searchAutocomplete)
app.get('/code', require('./routes/user').getCountryCode)
app.post('/deposit', require('./routes/transaction').stripeTransaction)
app.get('/account/:id', require('./routes/user').getStellarAccount)
app.get('/card/:id', require('./routes/card').getCardDetails)
app.post('/withdraw/:id', require('./routes/transaction').withdraw)
app.post('/proof/:id', require('./routes/user').uploadKyc)
app.get('/sentTransaction/:id', require('./routes/user').sentStellarTransaction)
app.get('/receivedTransaction/:id', require('./routes/user').receivedStellarTransaction)
app.get('/withdrawTransaction/:id', require('./routes/user').withdrawTransaction)
app.get('/depositTransaction/:id', require('./routes/user').depositTransaction)
app.get('/user', require('./routes/user').getUserDetails)
app.get('/withdraw/:id', require('./routes/card').getWithdrawDetails)
app.post('/account',require('./routes/user').createAddress)


//admin routes
app.post('/admin', require('./routes/admin').createUser)
app.post('/admin/login', require('./routes/admin').loginUser)
app.post('/admin/:id', require('./routes/admin').updateProfile)
app.get('/admin', require('./routes/admin').adminDetails)
app.get('/admin/sent', require('./routes/transaction').sentStellarTransaction)
app.get('/admin/received', require('./routes/transaction').receivedStellarTransaction)
app.get('/admin/userTransaction', require('./routes/transaction').userTransaction)
app.get('/admin/user', require('./routes/user').getAllProfile)
app.get('/admin/user/count', require('./routes/user').getUserCount)
app.get('/admin/deposit', require('./routes/transaction').depositTransaction)
app.get('/admin/depositFee', require('./routes/transaction').depositFeeTransaction)
app.get('/admin/withdrawFee', require('./routes/transaction').withdrawFeeTransaction)
app.get('/admin/withdraw', require('./routes/transaction').withdrawTransaction)
app.get('/admin/fiat', require('./routes/transaction').fiatBalance)
app.get('/admin/stellar', require('./routes/transaction').stellarBalance)
app.get('/admin/address', require('./routes/admin').createStellarAddress)

if(process.argv[2] && process.argv[2] == 'seed'){
    console.log('seed', process.argv[3])
    switch (process.argv[3] || null) {
        case 'user':
            new Admin({
                mobile_number: 1234567890,
                password: '00000',
            }).save().then(console.log('created'));
        break;
        default: 
            console.log('No collection');
            break;
    }
}

app.listen(4000, () => console.log('Example app listening on port 4000!'))