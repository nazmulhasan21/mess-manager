
require('dotenv').config();
const path = require('path');
const mongoose = require('mongoose');
const express = require('express');
const app = express();
const bodyParser = require('body-parser');
const multer = require('multer');
//const helmet = require('helmet');
const compression = require('compression');
const morgan = require('morgan');



const MONGODB_URL = `mongodb+srv://${process.env.MONGO_USER}:${process.env.MONGO_PASSWORD}@cluster0.nhvb2.mongodb.net/${process.env.MONGO_DEFAULT_DATABASE}`



// require all Routes

const authRoutes = require('./routes/auth');




// img uplod 
const date = new Date();
const fileStorage = multer.diskStorage({
    
    destination:(req, file, cb) =>{
        cb(nul, 'images');
    },
    filename:(req, file, cb) =>{
    cb(null,
        `${process.env.APP_NAME}-${date.getFullYear()}-${date.getMonth()}-${date.getDate()}-${date.getTime()}-${file.originalname}`
        
        );
    }
});

const fileFilter = (req, file, cb) =>{
    if(file.mimetype === 'image/png' ||
        file.mimetype === 'image/jpg' ||
        file.mimetype === 'image/jpeg'
        ){
            cb(null, true)
        }else{
            cb(null, false);
        }
};




//app.use(bodyParser.urlencoded());
app.use(bodyParser.json());
app.use(multer({storage:fileStorage, fileFilter:fileFilter}).single('image'));
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

app.use('/auth',authRoutes);


    //// errors handeler middleware

app.use((error, req, res, next) =>{
    console.log({error:error, messagess:'miderlor'});
    const status =error.stastusCode || 500;
    const message = error.message;
    const data = error.data;
    res.status(status).json({message,data});
});


mongoose.connect(MONGODB_URL)
        .then(resul =>{
            console.log('mongodb connected');
        app.listen(process.env.PORT || 8000);
        })
        .catch(err => console.log(err));
