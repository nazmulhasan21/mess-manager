require('dotenv').config();
const path = require('path');
const mongoose = require('mongoose');
const express = require('express');
const app = express();
const bodyParser = require('body-parser');
const PUPPETEER_SKIP_DOWNLOAD = 'true';

/// cloudinary

//const helmet = require('helmet');
const compression = require('compression');
const morgan = require('morgan');

MONGODB_URL = `mongodb+srv://${process.env.MONGO_USER}:${process.env.MONGO_PASSWORD}@cluster0.nhvb2.mongodb.net/${process.env.MONGO_DEFAULT_DATABASE}`;
// require all Routes

const authRoutes = require('./routes/auth');
const messRoutes = require('./routes/mess');
const monthRoutes = require('./routes/month');
const userRoutes = require('./routes/user');

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
//app.use(multer({storage:fileStorage, fileFilter:fileFilter}).single('image'));

app.use('/images', express.static(path.join(__dirname, 'images')));
app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader(
    'Access-Control-Allow-Methods',
    'OPTIONS, GET, POST, PUT, PATCH, DELETE'
  );
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  next();
});

// use all routes

app.use('/auth', authRoutes);
app.use('/mess', messRoutes);
app.use('/month', monthRoutes);
app.use('/user', userRoutes);

//// errors handeler middleware

const handleError = (erros) => {
  const arrObj = {};
  erros.forEach((error) => {
    arrObj[error.param] = error.msg;
  });
  return arrObj;
};

app.use((error, req, res, next) => {
  // console.log({ error: error });
  // const status = error.statusCode || 500;
  // const message = error.message;
  // const path = error.path;
  // const errData = { msg: message, param: path };
  const errors = error.errors || handleError(error.data);
  error.customErr = errors || error;
  // console.log('m', error);
  res.status(error.statusCode || 500).json({ error: error.customErr });
});

mongoose
  .connect(MONGODB_URL)
  .then((resul) => {
    console.log('mongodb connected');
    app.listen(process.env.PORT || 8000);
  })
  .catch((err) => console.log(err));
