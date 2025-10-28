import { Router } from "express";
import {createFood } from "../controllers/addFood.controller.js";
import authFoodPartnerMiddleware from "../../middleware/auth.middleware.js";
const router = Router();

// ! Adding Food Item Controller  :- It is protected route , only food partners can add food items
router.post('/addFoodItem', authFoodPartnerMiddleware, createFood);

export default router;