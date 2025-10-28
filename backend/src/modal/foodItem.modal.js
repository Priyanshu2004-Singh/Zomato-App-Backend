import mongoose from "mongoose";



const foodItemSchema = mongoose.Schema({
    name:{
        type:String,
        required:true,
        trim:true
    },
    video:{
        type:String,
        required:true
    },
    foodPartner:{
        type:mongoose.Schema.Types.ObjectId,
        ref:'FoodPartner',
        required:true
    },
    description:{
        type:String,
    }
},{timestamps:true});


const FoodItem = mongoose.model('FoodItem',foodItemSchema);

export default FoodItem;