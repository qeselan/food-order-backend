import express from 'express';
import {
  EditCustomerProfile,
  GetCustomerProfile,
  CustomerLogin,
  CustomerOtp,
  CustomerSignUp,
  CustomerVerify,
  CreateOrder,
  GetOrders,
  GetOrderById,
  AddToCart,
  GetCart,
  DeleteCart
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
router.post('/cart', AddToCart);
router.get('/cart', GetCart);
router.delete('/cart', DeleteCart);

// Order
router.post('/create-order/:vandorId', CreateOrder);
router.get('/orders', GetOrders);
router.get('/order/:id', GetOrderById);

// Payment

export { router as CustomerRoute };
