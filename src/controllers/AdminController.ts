import { Request, Response } from 'express';
import { CreateVandorInput } from '../dto';
import { Vandor } from '../models';
import { GeneratePassword, GenerateSalt } from '../utilitiy';

export const FindVandor = async (id: string | undefined, email?: string) => {
  if (email) {
    return await Vandor.findOne({ email: email });
  } else {
    return await Vandor.findById(id);
  }
};

export const CreateVandor = async (req: Request, res: Response) => {
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

  const existingVendor = await FindVandor('', email);

  if (existingVendor) {
    return res.json({ message: 'A vandor already exists with the email.' });
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

export const GetVandors = async (req: Request, res: Response) => {
  const vandors = await Vandor.find();

  if (vandors !== null) {
    return res.json(vandors);
  }

  return res.json({ message: 'No vandor exist.' });
};

export const GetVandorByID = async (req: Request, res: Response) => {
  const vandorId = req.params.id;
  const vandor = await FindVandor(vandorId);
  if (vandor !== null) {
    return res.json(vandor);
  }
  return res.json({ message: 'vandors data not available' });
};
