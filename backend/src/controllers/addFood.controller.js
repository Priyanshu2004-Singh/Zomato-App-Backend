import authFoodPartnerMiddleware from "../../middleware/auth.middleware.js";
import FoodItem from "../modal/foodItem.modal.js";

export const createFood = async (req, res) => {
    console.log(req.foodPartner); // return undefined
    res.json({ message: "Food item added successfully" });
};