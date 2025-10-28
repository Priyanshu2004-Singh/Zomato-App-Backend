import bcrypt from "bcrypt";
import User from "../modal/user.modal.js";
import jwt from "jsonwebtoken";

export const registerUser = async (req, res) => {
  const { fullName, email, password } = req.body;

  // Basic validation
  if (!fullName || !email || !password) {
    return res.status(400).json({ message: "All fields are required" });
  }

  // Check if user already exists
  const userExist = await User.findOne({ email });
  if (userExist) {
    return res.status(400).json({ message: "User already exists" });
  }

  // Create new user
  const newUser = new User({
    fullName,
    email,
    password,
  });

  const token = jwt.sign(
    {
      id: newUser._id,
    },
    process.env.JWT_SECRET,
    { expiresIn: "1d" }
  );
  res.cookie("token", token);

  await newUser.save();

  res.status(201).json({
    message: "User Registered Successfully",
    success: true,
    data: {
      fullname: newUser.fullName,
      email: newUser.email,
      id: newUser._id,
    },
  });
};

export const loginUser = async (req, res) => {
  const { email, password } = req.body;

  // basic validation
  if (!email || !password) {
    return res.status(400).json({ message: "All fields are required" });
  }

  // check if user exists
  const user = await User.findOne({ email });
  if (!user) {
    return res.status(400).json({ message: "User or Password is invalid" });
  }

  const isPasswordValid = await bcrypt.compare(password, user.password);
  if (!isPasswordValid) {
    return res.status(400).json({ message: "Email or Password is incorrect" });
  }

  //Successful login do whatever you want to do here like generating token etc
  const token = jwt.sign(
    {
      id: user._id,
    },
    process.env.JWT_SECRET,
    { expiresIn: "1d" }
  );
    // creating cookie to send token
    res.cookie("token", token);

  res.status(200).json({
    message: "User logged in successfully",
    success: true,
    data: {
      fullname: user.fullName,
      email: user.email,
      id: user._id,
    },
  });
};

export const logoutUser = async(req, res) => {
    res.clearCookie("token");
    res.status(200).json({
        message: "User logged out successfully",
        success: true
    });
}
