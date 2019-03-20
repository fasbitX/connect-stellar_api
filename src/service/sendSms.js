const accountSid = 'AC506bfda4ac89236d294d5508e2169bb4';
const authToken = 'b85a447ed4ec8884a5282e92e7be355e';
const client = require('twilio')(accountSid, authToken);

export const sendSms = async (mobileNumber) => {
  console.log('called');
  const otp = Math.floor(1000 + Math.random() * 9000);
  await client.messages
    .create({
      body: otp,
      from: '+15673200620',
      to: '+919600975087'
    })
    .then(message => console.log('message', message.sid))
    .done();
  return otp;
}