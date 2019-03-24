require('dotenv').config();
const accountSid = process.env.TW_ACCOUNTSID;
const authToken = process.env.TW_AUTHTOKEN;
const client = require('twilio')(accountSid, authToken);

export const sendSms = async (mobileNumber) => {
  console.log('called');
  const otp = Math.floor(1000 + Math.random() * 9000);

  await client.messages.create({
    body: otp,
    from: process.env.TW_FROM_NO,
    to: mobileNumber
  })
    .then(message => console.log('message', message.sid))
    .catch(err => {
      console.log(err.message);
      //return err.message;
    })
    .done();
    return otp;
}