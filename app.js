require('dotenv').config();
const path = require('path');
const mongoose = require('mongoose');
const express = require('express');
const app = express();
const bodyParser = require('body-parser');
const PUPPETEER_SKIP_DOWNLOAD = 'true';

/// cloudinary

const cloudinary = require('cloudinary').v2;
cloudinary.config({
  cloud_name: 'dvvfuzf5o',
  api_key: '418419731134456',
  api_secret: '5h5YuOhL02op04C4F5snQ0iLLSg',
});

//const helmet = require('helmet');
const compression = require('compression');
const morgan = require('morgan');

MONGODB_URL = `mongodb+srv://${process.env.MONGO_USER}:${process.env.MONGO_PASSWORD}@cluster0.nhvb2.mongodb.net/${process.env.MONGO_DEFAULT_DATABASE}`;
// require all Routes

const authRoutes = require('./routes/auth');
const messRoutes = require('./routes/mess');
const monthRoutes = require('./routes/month');
const userRoutes = require('./routes/user');

// img uplod
// const date = new Date();
// const fileStorage = multer.diskStorage({

//     destination:(req, file, cb) =>{
//         cb(null, 'images');
//     },
//     filename:(req, file, cb) =>{
//     cb(null,
//         `${process.env.APP_NAME}-${date.getFullYear()}-${date.getMonth()}-${date.getDate()}-${date.getTime()}-${file.originalname}`

//         );
//     }
// });

// const fileFilter = (req, file, cb) =>{
//     if(file.mimetype === 'image/png' ||
//         file.mimetype === 'image/jpg' ||
//         file.mimetype === 'image/jpeg'
//         ){
//             cb(null, true)
//         }else{
//             cb(null, false);
//         }
// };

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

  error.customErr = error.errors || handleError(error.data);
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
