import { Request, Response } from 'express';
import { validate } from 'class-validator';
import { plainToClass } from 'class-transformer';
import { CreateCustomerInputs } from '../dto/Customer.dto';
import { GenerateOtp, GeneratePassword, GenerateSalt } from '../utilitiy';
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

  if (result) {
    // send the OTP to customer
    // generate the signature
    // send the result to client
  }
};

export const CustomerLogin = async (req: Request, res: Response) => {};

export const CustomerVerify = async (req: Request, res: Response) => {};

export const CustomerOtp = async (req: Request, res: Response) => {};

export const GetCustomerProfile = async (req: Request, res: Response) => {};

export const EditCustomerProfile = async (req: Request, res: Response) => {};
