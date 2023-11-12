import { Request, Response } from 'express';
import { EditVandorInputs, VandorLoginInputs, CreateFoodInput } from '../dto';
import { FindVandor } from './AdminController';
import { GenerateSignature, validatePassword } from '../utilitiy';
import { Food } from '../models';

export const VandorLogin = async (req: Request, res: Response) => {
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

export const GetVandorProfile = async (req: Request, res: Response) => {
  const user = req.user;

  if (user) {
    const existingVendor = await FindVandor(user._id);
    return res.json(existingVendor);
  }

  return res.json({ message: 'Vandor information not found' });
};

export const UpdateVandorProfile = async (req: Request, res: Response) => {
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

export const UpdateVandorCoverImage = async (req: Request, res: Response) => {
  const user = req.user;

  if (!user) {
    return res.json({ message: 'Vandor information not found' });
  }

  const vandor = await FindVandor(user._id);

  if (!vandor) return res.json({ message: 'Vandor information not found' });

  const files = req.files as [Express.Multer.File];

  const images = files.map((file) => file.filename);

  vandor.coverImages.push(...images);

  const result = await vandor.save();

  return res.json(result);
};

export const UpdateVandorService = async (req: Request, res: Response) => {
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

export const AddFood = async (req: Request, res: Response) => {
  const user = req.user;

  if (!user) {
    return res.json({ message: 'Vandor information not found' });
  }

  const vandor = await FindVandor(user._id);

  if (!vandor) return res.json({ message: 'Vandor information not found' });

  const { name, description, category, foodType, readyTime, price } = <
    CreateFoodInput
  >req.body;

  const files = req.files as [Express.Multer.File];

  const images = files.map((file) => file.filename);

  const createdFood = await Food.create({
    vandorId: vandor._id,
    name: name,
    description: description,
    category: category,
    foodType: foodType,
    images: images,
    readyTime: readyTime,
    price: price,
    rating: 0
  });

  vandor.foods.push(createdFood);
  const result = await vandor.save();

  return res.json(result);
};

export const GetFoods = async (req: Request, res: Response) => {
  const user = req.user;

  if (!user) {
    return res.json({ message: 'Vandor information not found' });
  }
  const foods = await Food.find({ vandorId: user._id });

  return res.json(foods);
};
