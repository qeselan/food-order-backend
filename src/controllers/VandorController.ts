import { Request, Response } from 'express';
import { EditVandorInputs, VandorLoginInputs, CreateFoodInput } from '../dto';
import { FindVandor } from './AdminController';
import { GenerateSignature, validatePassword } from '../utilitiy';
import { Food } from '../models';
import { Order } from '../models/Order';

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

  return res.json({ message: 'Vandor not found' });
};

export const UpdateVandorProfile = async (req: Request, res: Response) => {
  const { foodType, name, address, phone } = <EditVandorInputs>req.body;

  const user = req.user;

  if (!user) {
    return res.json({ message: 'Vandor not found' });
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
    return res.json({ message: 'Vandor not found' });
  }

  const vandor = await FindVandor(user._id);

  if (!vandor) return res.json({ message: 'Vandor not found' });

  const files = req.files as [Express.Multer.File];

  const images = files.map((file) => file.filename);

  vandor.coverImages.push(...images);

  const result = await vandor.save();

  return res.json(result);
};

export const UpdateVandorService = async (req: Request, res: Response) => {
  const user = req.user;

  if (!user) {
    return res.json({ message: 'Vandor not found' });
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
    return res.json({ message: 'Vandor not found' });
  }

  const vandor = await FindVandor(user._id);

  if (!vandor) return res.json({ message: 'Vandor not found' });

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
    return res.json({ message: 'Vandor not found' });
  }
  const foods = await Food.find({ vandorId: user._id });

  return res.json(foods);
};

export const GetCurrentOrders = async (req: Request, res: Response) => {
  const user = req.user;
  if (!user) return res.json({ message: 'Vandor not found' });

  const orders = await Order.find({ vandorID: user._id }).populate(
    'items.food'
  );
  return res.status(200).json(orders);
};

export const GetOrderDetails = async (req: Request, res: Response) => {
  const orderId = req.params.id;
  const user = req.user;
  if (!user) return res.json({ message: 'Vandor not found' });

  const order = await Order.find({
    vandorID: user._id,
    orderID: orderId
  })
    .populate('items.food')
    .exec();

  if (!order) return res.json({ message: 'Please provide a valid order ID' });

  return res.status(200).json(order);
};

export const ProcessOrder = async (req: Request, res: Response) => {
  const user = req.user;
  const orderId = req.params.id;
  const { status, remarks, time } = req.body; // ACCEPT // REJECT // UNDER-PROCESS // READY

  // const order = await Order.findById(orderId).populate('food');
  const order = (
    await Order.find({
      vandorID: user._id,
      orderID: orderId
    })
      .populate('items.food')
      .exec()
  )[0];
  if (!order) res.status(400).json({ message: 'Order not found!' });

  order.orderStatus = status;
  order.remarks = remarks;
  if (time) order.readyTime = time;
  const updatedOrder = await order.save();

  return res.status(200).json({ updatedOrder });
};
