const mongoose=require('mongoose')
const bookSchema = new mongoose.Schema({
    title : String,
    stock : Number,
    author : String,
    description : String,
    category : String, 
 });
 
 module.exports =  mongoose.model("Book", bookSchema);