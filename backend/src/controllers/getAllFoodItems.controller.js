import FoodItem from "../modal/foodItem.modal.js";

// Returns authenticated user details and the list of all food items
export const getAllFoodItems = async (req, res) => {
    try {
        const user = req.user || null;

        const foodItems = await FoodItem.find({})
            .populate({ path: "foodPartner", select: "fullName email _id" })
            .lean();

        return res.status(200).json({
            success: true,
            user: user ? { email: user.email, fullName: user.fullName } : null,
            foodItems: foodItems.map(item => ({
                name: item.name,
                description: item.description,
                videoUrl: item.video
            })),
        });
    } catch (err) {
        console.error("getAllFoodItems error:", err);
        return res.status(500).json({ success: false, message: "Failed to fetch food items", error: err.message });
    }
};