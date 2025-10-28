import mongoose from "mongoose";
import bcrypt from "bcrypt";


const foodPartnerSchema = mongoose.Schema({
    fullName:{
        type:String,
        required:true,
        trim:true
    },
    email:{
        type:String,
        required:true,
        unique:true,
        trim:true,
        lowercase:true 
    },
    password:{
        type:String,
        required:true
    }
},{timestamps:true});


foodPartnerSchema.pre("save", async function (next) {
    if (!this.isModified("password")) {
        return next();
    }
    try {
        const salt = await bcrypt.genSalt(10);
        this.password = await bcrypt.hash(this.password, salt);
        next();
    } catch (error) {
        next(error);
    }
});

const FoodPartner = mongoose.model('FoodPartner',foodPartnerSchema);

export default FoodPartner;