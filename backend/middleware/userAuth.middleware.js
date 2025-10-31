import jwt from "jsonwebtoken";
import User from "../src/modal/user.modal.js"; 

const userAuthValidation = async (req, res, next) => {
  //Basic Validation

  // Accept token from cookie or Authorization header (Bearer) to ease testing from Postman
  let token = req.cookies && req.cookies.userToken;
  if (!token && req.headers && req.headers.authorization) {
    const parts = req.headers.authorization.split(" ");
    if (parts.length === 2 && parts[0] === "Bearer") {
      token = parts[1];
    }
  }

  if (!token) {
    return res.status(401).json({ message: "Unauthorized Access - No Token" });
  }

  // Logical Call for verifying token
  try {
    // Verifying token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    // Fetching User details from db using id from token
    const user = await User.findById(decoded.id);
    if (!user) {
      return res.status(401).json({ message: "Unauthorized Access - User not found" });
    }

    // Sending data except password
    const hiddenPasswordUser = user.toObject();
    delete hiddenPasswordUser.password;
    req.user = hiddenPasswordUser;
    next(); // Proceed to next middleware or route handler
  } catch (error) {
    return res.status(401).json({ message: "Unauthorized Access - Invalid Token" });
  }
};

export default userAuthValidation;