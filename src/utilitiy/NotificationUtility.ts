import { AUTH_TOKEN, ACCOUNT_SID, FROM_PHONE_NUMBER } from '../config';

// Email

// Notifications

// OTP
export const GenerateOtp = () => {
  const otp = Math.floor(100000 + Math.random() * 900000);
  const expiry = new Date();
  expiry.setTime(new Date().getTime() + 30 * 60 * 1000);

  return { otp, expiry };
};

export const onRequestOTP = async (otp: number, toPhoneNumber: string) => {
  const accountSid = ACCOUNT_SID;
  const authToken = AUTH_TOKEN;
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const client = require('twilio')(accountSid, authToken);

  const response = await client.messages.create({
    body: `Your OTP is ${otp}`,
    from: FROM_PHONE_NUMBER,
    to: `+1${toPhoneNumber}`
  });

  return response;
};

// Payment Notification or emails
