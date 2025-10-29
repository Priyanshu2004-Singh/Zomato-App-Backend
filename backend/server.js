import 'dotenv/config';

// Starting server from here:
import connectDB from "./src/database/db.js";
import app from "./src/app.js";

// Startup-time Cloudinary credentials check (fatal)
const hasCloudinaryUrl = !!process.env.CLOUDINARY_URL;
const hasCloudinaryParts = !!(
  process.env.CLOUDINARY_CLOUD_NAME &&
  process.env.CLOUDINARY_API_KEY &&
  process.env.CLOUDINARY_API_SECRET
);

if (!hasCloudinaryUrl && !hasCloudinaryParts) {
  console.error(
    'Fatal: Cloudinary credentials are missing. Set CLOUDINARY_URL or CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY and CLOUDINARY_API_SECRET in your environment.'
  );
  process.exit(1);
}


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


