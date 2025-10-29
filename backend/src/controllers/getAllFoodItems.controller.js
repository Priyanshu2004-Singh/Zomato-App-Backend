export const getAllFoodItems = async (req, res) => {
    res.json({
        message:"All food items fetched successfully",
        success:true,
        data: [
            {
                id: "fooditem1",
                name: "Pizza",
                description: "Delicious cheese pizza",
                videoUrl: "http://example.com/videos/pizza.mp4"
            }
        ] // Placeholder for actual food items data
    })
};