import express from 'express';
import {
  AddFood,
  GetFoods,
  GetVandorProfile,
  UpdateVandorCoverImage,
  UpdateVandorProfile,
  UpdateVandorService,
  VandorLogin
} from '../controllers';
import { Authenticate } from '../middlewares';
import multer from 'multer';

const router = express.Router();

const imageStorage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'images');
  },
  filename: function (req, file, cb) {
    cb(null, new Date().toISOString() + '_' + file.originalname);
  }
});

const images = multer({ storage: imageStorage }).array('images', 10);

router.post('/login', VandorLogin);

router.use(Authenticate);
router.get('/profile', GetVandorProfile);
router.patch('/profile', UpdateVandorProfile);
router.patch('/coverimage', images, UpdateVandorCoverImage);
router.patch('/service', UpdateVandorService);

router.post('/food', images, AddFood);
router.get('/food', GetFoods);

export { router as VandorRoute };
