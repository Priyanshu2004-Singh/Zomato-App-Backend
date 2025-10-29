import { Router } from "express";
import { createFood } from "../controllers/addFood.controller.js";
import authFoodPartnerMiddleware from "../../middleware/auth.middleware.js";
const router = Router();
import multer from "multer";
import fs from "fs";
import path from "path";

// Use disk storage for uploads to avoid holding large files in memory
const uploadDir = path.resolve(process.cwd(), "uploads");
if (!fs.existsSync(uploadDir)) {
	fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
	destination: (req, file, cb) => cb(null, uploadDir),
	filename: (req, file, cb) => {
		const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
		const safe = file.originalname.replace(/[^a-zA-Z0-9._-]/g, "_");
		cb(null, `${unique}-${safe}`);
	},
});

// Accept only video files and limit size to 200MB
const upload = multer({ 
	storage,
	limits: { fileSize: 200 * 1024 * 1024 }, // 200 MB
	fileFilter: (req, file, cb) => {
		if (file.mimetype && file.mimetype.startsWith('video/')) {
			cb(null, true);
		} else {
			cb(new Error('Only video files are allowed'), false);
		}
	}
});

// ! Adding Food Item Controller  :- It is protected route , only food partners can add food items
router.post('/addFoodItem', authFoodPartnerMiddleware, upload.single('video'), createFood);

export default router;