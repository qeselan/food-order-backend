import { Request, Response, NextFunction } from 'express';
import { CreateVandorInput } from '../dto';

export const test = async (req: Request, res: Response, next: NextFunction) => {
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

  return res.json({
    name,
    address,
    pincode,
    foodType,
    email,
    password,
    ownerName,
    phone
  });
};
