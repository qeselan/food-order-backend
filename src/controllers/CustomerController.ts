import { Request, Response } from 'express';
import { validate } from 'class-validator';
import { plainToClass } from 'class-transformer';
import {
  CreateCustomerInputs,
  CustomerLoginInputs,
  EditCustomerProfileInputs,
  OrderInputs
} from '../dto';
import {
  GenerateOtp,
  GeneratePassword,
  GenerateSalt,
  GenerateSignature,
  onRequestOTP,
  validatePassword
} from '../utilitiy';
import { Customer, Food, Vandor } from '../models';
import { Order } from '../models/Order';

export const CustomerSignUp = async (req: Request, res: Response) => {
  const customerInputs = plainToClass(CreateCustomerInputs, req.body);

  const inputErrors = await validate(customerInputs, {
    validationError: { target: true }
  });

  if (inputErrors.length > 0) {
    return res.status(400).json(inputErrors);
  }

  const { email, phone, password } = customerInputs;

  const existingCustomer = await Customer.findOne({
    $or: [{ email: email }, { phone: phone }]
  });

  if (existingCustomer)
    return res.status(409).json({
      message: 'An user exist with the provided email or phone number!'
    });

  const salt = await GenerateSalt();
  const hashedPassword = await GeneratePassword(password, salt);

  const { otp, expiry } = GenerateOtp();

  const result = await Customer.create({
    email: email,
    password: hashedPassword,
    salt: salt,
    phone: phone,
    otp: otp,
    otp_expiry: expiry,
    firstName: '',
    lastName: '',
    address: '',
    verified: false,
    lat: 0,
    lng: 0
  });

  if (!result) return res.status(400).json({ message: 'Error with signup!' });

  // send the OTP to customer
  await onRequestOTP(otp, phone);

  // generate the signature
  const signature = GenerateSignature({
    _id: result._id,
    email: result.email,
    verified: result.verified
  });

  // send the result to client
  return res.status(201).json({
    signature: signature,
    email: result.email,
    verified: result.verified
  });
};

export const CustomerLogin = async (req: Request, res: Response) => {
  const loginInputs = plainToClass(CustomerLoginInputs, req.body);

  const loginErrors = await validate(loginInputs, {
    validationError: { target: true }
  });

  if (loginErrors.length > 0) return res.status(400).json(loginErrors);

  const { email, password } = loginInputs;

  const customer = await Customer.findOne({ email: email });

  if (!customer) return res.status(400).json({ message: 'Wrong credentials!' });

  const validation = await validatePassword(
    password,
    customer.password,
    customer.salt
  );

  if (!validation)
    return res.status(400).json({ message: 'Wrong credentials' });

  const signature = GenerateSignature({
    _id: customer._id,
    email: customer.email,
    verified: customer.verified
  });

  return res.status(201).json({
    signature: signature,
    email: customer.email,
    verified: customer.verified
  });
};

export const CustomerVerify = async (req: Request, res: Response) => {
  const { otp } = req.body;
  const customer = req.user;

  if (!customer) return res.status(400).json({ message: 'No user provided!' });

  const profile = await Customer.findById(customer._id);

  if (!profile)
    return res.status(400).json({ message: 'User does not exist!' });

  if (profile.otp !== parseInt(otp) || profile.otp_expiry <= new Date())
    res.status(400).json({ message: 'OTP expired!' });

  if (profile.verified === true)
    res.status(200).json({ message: 'User already verified!' });

  profile.verified = true;

  const updatedCustomer = await profile.save();

  const signature = GenerateSignature({
    _id: updatedCustomer._id,
    email: updatedCustomer.email,
    verified: updatedCustomer.verified
  });

  return res.status(201).json({
    signature: signature,
    verified: updatedCustomer.verified,
    email: updatedCustomer.email
  });
};

export const CustomerOtp = async (req: Request, res: Response) => {
  const customer = req.user;

  if (!customer) return res.status(400).json('User not provided!');

  const profile = await Customer.findById(customer._id);

  if (!profile) return res.status(400).json('User does not exist!');

  const { otp, expiry } = GenerateOtp();

  profile.otp = otp;
  profile.otp_expiry = expiry;

  await profile.save();
  await onRequestOTP(otp, profile.phone);

  res
    .status(200)
    .json({ message: 'OTP sent to your registered phone number!' });
};

export const GetCustomerProfile = async (req: Request, res: Response) => {
  const customer = req.user;

  if (!customer) return res.status(400).json('User not provided!');

  const profile = await Customer.findById(customer._id);

  if (!profile) return res.status(400).json('User does not exist!');

  res.status(200).json(profile);
};

export const EditCustomerProfile = async (req: Request, res: Response) => {
  const customer = req.user;

  if (!customer) return res.status(400).json('User not provided!');

  const profile = await Customer.findById(customer._id);

  if (!profile) return res.status(400).json('User does not exist!');

  const profileInputs = plainToClass(EditCustomerProfileInputs, req.body);

  const { firstName, lastName, address } = profileInputs;

  profile.firstName = firstName;
  profile.lastName = lastName;
  profile.address = address;

  const updatedCustomer = await profile.save();

  res.status(200).json({ updatedCustomer });
};

export const CreateOrder = async (req: Request, res: Response) => {
  // Grab logged in user
  const customer = req.user;
  if (!customer) return res.status(400).json('User not provided!');

  // Create and order ID
  const orderId = `${Math.floor(Math.random() * 89999) + 1000}`;

  const profile = await Customer.findById(customer._id);
  if (!profile) return res.status(400).json('User does not exist!');

  // Grab order items from request
  const cart = req.body as OrderInputs[];

  const vandorId = req.params['vandorId'];

  try {
    await Vandor.findById(vandorId);
  } catch (error) {
    return res.status(400).json('Provide valid vandorID!');
  }

  const cartItems = [];

  let netAmount = 0;

  const foods = await Food.find()
    .where('_id')
    .in(cart.map((item) => item._id))
    .exec();

  // Calculate order amount
  foods.forEach((food) => {
    cart.forEach(({ _id, unit }) => {
      if (food._id == _id) {
        netAmount += food.price * unit;
        cartItems.push({ food, unit });
      }
    });
  });

  if (cartItems) {
    const currentOrder = await Order.create({
      orderID: orderId,
      vandorID: vandorId,
      items: cartItems,
      totalAmount: netAmount,
      orderDate: new Date(),
      paidThrough: 'COD',
      paymentResponse: '',
      orderStatus: 'Waiting',
      remarks: '',
      deliveryId: '',
      appliedOffers: false,
      offerId: '',
      readyTime: 45
    });

    profile.cart = [] as any;
    profile.orders.push(currentOrder);
    await profile.save();

    return res.status(200).json(currentOrder);
  }
  return res.status(400).json({ message: 'Error with create order!' });
};

export const AddToCart = async (req: Request, res: Response) => {
  const customer = req.user;
  if (!customer) return res.status(400).json('User not provided!');
  const profile = await Customer.findById(customer._id).populate('cart.food');
  if (!profile) return res.status(400).json('User does not exist!');

  const { _id, unit } = req.body as OrderInputs;
  const food = await Food.findById(_id);
  if (!food) return res.status(400).json('Food does not exist!');

  const cartItem = profile.cart.filter(
    (item) => item.food._id.toString() === _id
  );
  const item = cartItem.length !== 0 ? cartItem[0] : undefined;

  if (item) {
    item.unit += unit;
  } else {
    if (unit !== 0) profile.cart.push({ food, unit });
  }

  await profile.save();

  return res.status(200).json(profile.cart);
};

export const GetCart = async (req: Request, res: Response) => {
  const customer = req.user;
  if (!customer) return res.status(400).json('User not provided!');
  const profile = await Customer.findById(customer._id).populate('cart.food');
  if (!profile) return res.status(400).json('User does not exist!');

  return res.status(200).json(profile.cart);
};

export const DeleteCart = async (req: Request, res: Response) => {
  const customer = req.user;
  if (!customer) return res.status(400).json('User not provided!');
  const profile = await Customer.findById(customer._id).populate('cart.food');
  if (!profile) return res.status(400).json('User does not exist!');
  profile.cart = [] as any;
  const updatedCustomer = await profile.save();

  return res.status(200).json(updatedCustomer.cart);
};

export const GetOrders = async (req: Request, res: Response) => {
  // Grab logged in user
  const customer = req.user;

  if (!customer) return res.status(400).json('User not provided!');

  const profile = await Customer.findById(customer._id).populate('orders');

  if (!profile) return res.status(400).json('User does not exist!');

  return res.status(200).json(profile.orders);
};

export const GetOrderById = async (req: Request, res: Response) => {
  const orderId = req.params.id;
  const customer = req.user;

  if (!customer) return res.status(400).json('User not provided!');

  const profile = await Customer.findById(customer._id).populate('orders');

  if (!profile.orders.map((order) => order.id).includes(orderId))
    return res.status(400).json('Order not found!');

  if (!orderId) return res.status(400).json('Please provide orderID!');

  res
    .status(200)
    .json(profile.orders.filter((order) => order.id === orderId)[0]);
};
