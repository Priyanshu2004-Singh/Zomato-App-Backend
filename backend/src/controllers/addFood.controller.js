import FoodItem from "../modal/foodItem.modal.js"; // Assuming foodItem.modal.js is in the parent directory
import uploadVideo from "../../utils/uploadVideo.util.js";
import { unlink } from "fs/promises";

export const createFood = async (req, res) => {
    // req.file contains the metadata for the file saved on disk by multer
    const { name, description } = req.body;

    // The temporary path where Multer saved the file
    let tempFilePath = req.file?.path;
    

    try {
        // --- 1. Basic Validation ---
        if (!req.foodPartner || !req.foodPartner._id) {
            // This should ideally be caught by authFoodPartnerMiddleware, but is a good safeguard
            return res.status(401).json({ message: "Unauthorized - food partner identity is missing." });
        }

        if (!name || !tempFilePath) {
            // Clean up if a file was partially uploaded but required body fields are missing
            if (tempFilePath) await unlink(tempFilePath).catch(() => {});
            const missing = !name ? "`name`" : !tempFilePath ? "video file" : "";
            return res.status(400).json({ message: `${missing} is required.` });
        }

        // Optional: Ensure the file is a video before starting the expensive upload
        if (!req.file.mimetype.startsWith("video/")) {
            await unlink(tempFilePath).catch(() => {});
            return res.status(400).json({ message: "Uploaded file must be a video." });
        }
        
        // --- 2. Cloudinary Upload ---
        let videoUrl = null;
        let public_id = null;
        
        // Use the food partner's ID to categorize the videos in Cloudinary
        const folder = `food_videos/${req.foodPartner._id}`;

        try {
            // Use the disk-based uploader, which is optimized for large files (upload_large)
            const uploadResult = await uploadVideo(tempFilePath, folder);
            
            if (uploadResult && uploadResult.url) {
                videoUrl = uploadResult.url;
                public_id = uploadResult.public_id; // Store public_id for future deletion if needed
            } else {
                throw new Error("Video upload failed to return a URL.");
            }
        } catch (uploadErr) {
            // Log error and return failure response
            console.error("Cloudinary upload error:", uploadErr.message || uploadErr);
            return res.status(502).json({ 
                message: "Video upload service failed.", 
                error: uploadErr.message || String(uploadErr) 
            });
        } finally {
            // --- 3. Cleanup ---
            // IMPORTANT: Remove the temporary file created by multer regardless of upload success
            await unlink(tempFilePath).catch((e) => console.warn("Failed to remove temp file:", e.message));
        }


        // --- 4. Create Database Record ---
        if (!videoUrl) {
            // This case should be caught above, but safety check for schema requirement
            return res.status(500).json({ message: "Internal upload error: Video URL missing." });
        }

        const foodItemData = {
            name,
            video: videoUrl,
            foodPartner: req.foodPartner._id,
            description: description || "No description provided",
        };

        const newFood = await FoodItem.create(foodItemData);

        return res.status(201).json({ 
            message: "Food item added successfully", 
            food: newFood,
            videoId: public_id // Optionally return the Cloudinary ID
        });
    } catch (err) {
        // Final fallback error handler
        console.error("createFood unhandled error:", err);
        
        // Attempt to clean up temp file if the error happened before the finally block
        if (tempFilePath) {
             await unlink(tempFilePath).catch(() => {});
        }
        
        return res.status(500).json({ message: "Server error during food item creation.", error: err.message });
    }
};
