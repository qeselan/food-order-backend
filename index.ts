import express from 'express';
import bodyParser from 'body-parser';
import mongoose from 'mongoose';
import path from 'path';

import { AdminRoute, VandorRoute } from './routes';
import { MONGO_URI } from './config';

const app = express();

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use('/images', express.static(path.join(__dirname, 'images')));

app.use('/admin', AdminRoute);
app.use('/vandor', VandorRoute);

mongoose
  .connect(MONGO_URI, {})
  .then((result) => {
    // console.log(result);
    console.log('DB connected');
  })
  .catch((err) => console.log('error: ' + err));

app.listen(8000, () => {
  console.clear();
  console.log('App is listening to the port 8000');
});
