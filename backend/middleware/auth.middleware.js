import FoodPartner from "../src/modal/foodPartner.modal.js";
import jwt from "jsonwebtoken";

const authFoodPartnerMiddleware = async (req, res, next) => {
  //Basic Validation

  const token = req.cookies.foodPartnerToken; // Getting token from cookies
  if (!token) {
    return res.status(401).json({ message: "Unauthorized Access - No Token" });
  }

  // Logical Call for verifying token
  try {
    // Verifying token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    // Fetching food partner details from db using id from token

    // Sending data except password: 
  const foodPartner = await FoodPartner.findById(decoded.id);
  const hiddenPasswordPartner = foodPartner.toObject();

  delete hiddenPasswordPartner.password;
  req.foodPartner = hiddenPasswordPartner;
    next(); // Proceed to next middleware or route handler
  } catch (error) {
    return res.status(401).json({ message: "Unauthorized Access - Invalid Token" });
  }
};

export default authFoodPartnerMiddleware;