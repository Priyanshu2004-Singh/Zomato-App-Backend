export const getAllFoodItems = async (req, res) => {
    console.log(req.user);
    res.json({
        success:true,
    })
};