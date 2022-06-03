const mongoose = require("mongoose");

const userSchema = mongoose.Schema({
    email:{
        type:String,
        required:true
    },
    phone:{
        type:String, // do not change this type number.
        required:true
    },
    password:{
        type:String,
        required:true
    },
    name:{
        type:String,
        required:true,
    },
    role:{
        type:String,
        required:true,
        default:'border'
    }

},{timestmps:true});


module.exports = mongoose.model('User', userSchema);