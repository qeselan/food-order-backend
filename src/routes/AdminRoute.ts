import express from 'express';
import { CreateVandor, GetVandors, GetVandorByID } from '../controllers';

const router = express.Router();

router.post('/vandor', CreateVandor);

router.get('/vandors', GetVandors);

router.get('/vandor/:id', GetVandorByID);

export { router as AdminRoute };
