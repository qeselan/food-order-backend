import { Request, Response, NextFunction } from 'express';
import { CreateVandorInput, EditVandorInputs, VandorLoginInputs } from '../dto';
import { FindVandor } from './AdminController';
import { GenerateSignature, validatePassword } from '../utilitiy';

export const VandorLogin = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const { email, password } = <VandorLoginInputs>req.body;

  const existingVendor = await FindVandor('', email);

  if (!existingVendor) {
    return res.json({ message: 'Login credentials not valid' });
  }

  // validation and give access
  const validation = await validatePassword(
    password,
    existingVendor.password,
    existingVendor.salt
  );

  if (validation) {
    const signature = GenerateSignature({
      _id: existingVendor.id,
      email: existingVendor.email,
      foodType: existingVendor.foodType,
      name: existingVendor.name
    });

    return res.json(signature);
  } else {
    return res.json({ message: 'Password not valid' });
  }
};

export const GetVandorProfile = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const user = req.user;

  if (user) {
    const existingVendor = await FindVandor(user._id);
    return res.json(existingVendor);
  }

  return res.json({ message: 'Vandor information not found' });
};

export const UpdateVandorProfile = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const { foodType, name, address, phone } = <EditVandorInputs>req.body;

  const user = req.user;

  if (!user) {
    return res.json({ message: 'Vandor information not found' });
  }

  const existingVendor = await FindVandor(user._id);

  if (existingVendor) {
    existingVendor.name ?? (existingVendor.name = name);
    existingVendor.address ?? (existingVendor.address = address);
    existingVendor.phone ?? (existingVendor.phone = phone);
    existingVendor.foodType ?? (existingVendor.foodType = foodType);
    const savedVandor = await existingVendor.save();
    return res.json(savedVandor);
  }

  return res.json(existingVendor);
};

export const UpdateVandorService = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const user = req.user;

  if (!user) {
    return res.json({ message: 'Vandor information not found' });
  }

  const existingVendor = await FindVandor(user._id);

  if (existingVendor) {
    existingVendor.serviceAvailable = !existingVendor.serviceAvailable;
    const savedVandor = await existingVendor.save();
    return res.json(savedVandor);
  }

  return res.json(existingVendor);
};
