const mongoose=require('mongoose')

const limitSchema= new mongoose.Schema({
    number:Number
})

module.exports=mongoose.model("Limit",limitSchema)