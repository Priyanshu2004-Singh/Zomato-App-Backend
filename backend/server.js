// Starting server from here:
import connectDB from "./src/database/db.js";
import app from "./src/app.js";
import { configDotenv } from 'dotenv';
configDotenv({debug: true});


connectDB()
  .then(() => {
    // Start the Express app server
    app.listen(process.env.PORT, () => {
      console.log(`Server is running on port ${process.env.PORT}`);
    });
  })
  .catch((error) => {
    console.error("Failed to start server:", error);
    // Critical failure: exit the process
    process.exit(1);
  });


