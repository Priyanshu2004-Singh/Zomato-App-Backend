import FoodPartner from "../modal/foodPartner.modal.js";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";

export const registerFoodPartner = async (req, res) => {
    const { fullName, email, password } = req.body;
    // Basic validation
    if (!fullName || !email || !password) {
        return res.status(400).json({ message: "All fields are required" });
    }

    // Check if food partner already exists
    const partnerExist = await FoodPartner.findOne({ email });
    if (partnerExist) {
        return res.status(400).json({ message: "Food Partner already exists" });
    }

    // Create new food partner
    const newPartner = new FoodPartner({
        fullName,
        email,
        password,
    });

    // Generating Token and creating cookie

    const foodPartnerToken = jwt.sign({
        id: newPartner._id,
    }, process.env.JWT_SECRET, { expiresIn: "1d" });
    res.cookie("foodPartnerToken", foodPartnerToken);


    //Saving to db: 
    await newPartner.save();

    res.status(201).json({
        message: "Food Partner Registered Successfully",
        success: true,
        data: {
            fullname: newPartner.fullName,
            email: newPartner.email,
            id: newPartner._id,
        },
    });
};
export const loginFoodPartner = async (req, res) => {
    const { email, password } = req.body;

    // basic validation
    if (!email || !password) {
        return res.status(400).json({ message: "All fields are required" });
    }
    // check if food partner exists
    const partner = await FoodPartner.findOne({ email });
    if (!partner) {
        return res.status(400).json({ message: "Food Partner or Password is invalid" });
    }
    // checking password
    const isPasswordValid = await bcrypt.compare(password, partner.password);
    if (!isPasswordValid) {
        return res.status(400).json({ message: "Food Partner or Password is invalid" });
    }
    //Successful login do whatever you want to do here like generating token etc
    const foodPartnerToken = jwt.sign({
        id: partner._id,
    }, process.env.JWT_SECRET, { expiresIn: "1d" });
    // creating cookie to send token
    res.cookie("foodPartnerToken", foodPartnerToken);

    res.status(200).json({
        message: "Food Partner logged in successfully",
        success: true,
        data: {
            fullname: partner.fullName,
            email: partner.email,
            id: partner._id,
        },
    });
};
export const logoutFoodPartner = async (req, res) => {
    res.cookie("foodPartnerToken", "", {
        expires: new Date(0),
    });
    res.status(200).json({
        message: "Food Partner logged out successfully",
        success: true,
    });
};