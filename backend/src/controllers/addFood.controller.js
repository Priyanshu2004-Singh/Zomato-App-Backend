import authFoodPartnerMiddleware from "../../middleware/auth.middleware.js";
import FoodItem from "../modal/foodItem.modal.js";


export const createFood = async (req, res) => {
    // console.log(req.foodPartner); // return undefined
    //!  Using multer we can access form data in req.body video

    console.log(req.body);
    // chekiing file
    console.log(req.file); // to access video file
    res.json({ message: "Food item added successfully" });
};

