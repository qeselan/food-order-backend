import { Request, Response } from 'express';
import { FoodDoc, Vandor } from '../models';

export const GetFoodAvailability = async (req: Request, res: Response) => {
  const pincode = req.params.pincode;

  const result = await Vandor.find({
    pincode: pincode,
    serviceAvailable: true
  })
    .sort([['rating', 'descending']])
    .populate('foods');

  if (result.length === 0) {
    return res.status(400).json({ message: 'Data not found!' });
  }

  return res.status(200).json(result);
};

export const GetTopRestaurants = async (req: Request, res: Response) => {
  const pincode = req.params.pincode;

  const result = await Vandor.find({
    pincode: pincode,
    serviceAvailable: true
  })
    .sort([['rating', 'descending']])
    .limit(10);

  if (result.length === 0) {
    return res.status(400).json({ message: 'Data not found!' });
  }

  return res.status(200).json(result);
};

export const GetFoodsIn30Min = async (req: Request, res: Response) => {
  const pincode = req.params.pincode;

  const result = await Vandor.find({
    pincode: pincode,
    serviceAvailable: true
  }).populate('foods');

  if (result.length === 0) {
    return res.status(400).json({ message: 'Data not found!' });
  }

  const foodResult: FoodDoc[] = [];

  result.map((vandor) => {
    const foods = vandor.foods as FoodDoc[];
    foodResult.push(...foods.filter((food) => food.readyTime <= 30));
  });
  return res.status(200).json(foodResult);
};

export const SearchFoods = async (req: Request, res: Response) => {
  const pincode = req.params.pincode;

  const result = await Vandor.find({
    pincode: pincode,
    serviceAvailable: true
  }).populate('foods');

  if (result.length === 0) {
    return res.status(400).json({ message: 'Data not found!' });
  }

  const foodResult: FoodDoc[] = [];

  result.map((vandor) => {
    const foods = vandor.foods as FoodDoc[];
    foodResult.push(...foods);
  });

  return res.status(200).json(foodResult);
};

export const RestaurantById = async (req: Request, res: Response) => {
  const id = req.params.id;

  const result = await Vandor.findById(id).populate('foods');

  if (!result) {
    return res.status(400).json({ message: 'Data not found!' });
  }

  return res.status(200).json(result);
};
