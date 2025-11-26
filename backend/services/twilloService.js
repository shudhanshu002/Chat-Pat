const twillo = require('twilio');

//Auth Keys
const accountsid = process.env.TWILLO_ACCOUNT_SID
const authToken = process.env.TWILLO_AUTH_TOKEN
const serviceSid = process.env.TWILLO_SERVICE_SID

const client = twillo(accountsid,authToken)

const sendOtpToPhoneNumber = async(phoneNumber) => {
    try {
        console.log('sending otp to this phone number',phoneNumber);
        if(!phoneNumber){
            throw new  error('phone number is required');
        }
        const response = await client.verify.v2.services(serviceSid).verifications.create({
            channel: 'sms',
            to: phoneNumber,
            
        });

        console.log(`this is my otp response ${response}`)
    } catch (error) {
        console.log(error);
        throw new Error('Failed tio send otp')
    }
}

const verifyOtp = async(phoneNumber, otp) => {
    try {
        console.log(serviceSid)
        const response = await client.verify.v2.services(serviceSid).verificationChecks.create({
            to: phoneNumber,
            code: otp
        });

        console.log(`this is my otp response ${response}`)
        return response;
    } catch (error) {
        console.log(error);
        throw new Error('Otp verification failed')
    }
}

module.exports = {
    sendOtpToPhoneNumber,
    verifyOtp
}