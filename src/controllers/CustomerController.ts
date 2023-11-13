import { Request, Response } from 'express';
import { validate } from 'class-validator';
import { plainToClass } from 'class-transformer';
import {
  CreateCustomerInputs,
  CustomerLoginInputs,
  EditCustomerProfileInputs
} from '../dto';
import {
  GenerateOtp,
  GeneratePassword,
  GenerateSalt,
  GenerateSignature,
  onRequestOTP,
  validatePassword
} from '../utilitiy';
import { Customer } from '../models';

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
