import { Request, Response, NextFunction } from 'express';
import { CreateVandorInput } from '../dto';
import { Vandor } from '../models';
import { GeneratePassword, GenerateSalt } from '../utilitiy';

export const CreateVandor = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const {
    name,
    address,
    pincode,
    foodType,
    email,
    password,
    ownerName,
    phone
  } = <CreateVandorInput>req.body;

  const existingVendor = await Vandor.findOne({ email: email });

  if (existingVendor) {
    return res.json({ message: 'A vandor exists with the email' });
  }

  // generate a salt
  const salt = await GenerateSalt();

  // encrypt the password using the salt
  const userPassword = await GeneratePassword(password, salt);

  const createdVandor = await Vandor.create({
    name: name,
    address: address,
    pincode: pincode,
    foodType: foodType,
    email: email,
    password: userPassword,
    salt: salt,
    ownerName: ownerName,
    phone: phone,
    rating: 0,
    serviceAvailable: false,
    coverImages: []
  });

  return res.json(createdVandor);
};

export const GetVandors = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {};

export const GetVandorByID = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {};
