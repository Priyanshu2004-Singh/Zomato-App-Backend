//Creating Server using Express JS

import cookieParser from 'cookie-parser';
import express from 'express';


const app = express();

// Middleware to parse JSON and URL-encoded bodies
// Middleware goes here:
app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

//importing routes
import authRoutes from './routes/auth.route.js';
import FoodPartnerRoutes from './routes/foodPartner.route.js';
import foodItemRoutes from './routes/food.routes.js';


//Calling routes: for User Auth
app.use('/api/auth/user',authRoutes);

//For foodPartner Auth
app.use('/api/auth/foodPartner',FoodPartnerRoutes);

//Food adding:
app.use('/api/food', foodItemRoutes);

app.get('/', (req, res) => {
  res.json({
    message: "Hello World Priyanshu",
  });
});

export default app;