import { Router } from "express";
import {createFood } from "../controllers/addFood.controller.js";
import authFoodPartnerMiddleware from "../../middleware/auth.middleware.js";
const router = Router();
import multer from "multer";

const storage = multer.memoryStorage();
const upload = multer({ storage });

// ! Adding Food Item Controller  :- It is protected route , only food partners can add food items
router.post('/addFoodItem', authFoodPartnerMiddleware, upload.single('video'), createFood);

export default router;