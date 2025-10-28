import { Router } from "express";   
import { registerFoodPartner, loginFoodPartner , logoutFoodPartner } from "../controllers/foodPartner.controller.js";

const router = Router();

router.post("/register", registerFoodPartner);
router.post("/login", loginFoodPartner);
router.get("/logout", logoutFoodPartner);

export default router;
