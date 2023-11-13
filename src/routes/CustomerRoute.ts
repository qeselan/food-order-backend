import express from 'express';
import {
  EditCustomerProfile,
  GetCustomerProfile,
  CustomerLogin,
  CustomerOtp,
  CustomerSignUp,
  CustomerVerify
} from '../controllers';
import { Authenticate } from '../middlewares';

const router = express.Router();

// Sign Up
router.post('/signup', CustomerSignUp);

// Sign in
router.post('/login', CustomerLogin);

/** Authentication Required */

router.use(Authenticate);

// Verify Customer Account
router.patch('/verify', CustomerVerify);

// OTP
router.get('/otp', CustomerOtp);

// Profile
router.get('/profile', GetCustomerProfile);

router.patch('/profile', EditCustomerProfile);

// Cart
// Order
// Payment

export { router as CustomerRoute };
