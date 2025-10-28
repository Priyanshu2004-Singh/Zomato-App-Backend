import mongoose from "mongoose";

/**
 * Connect to MongoDB using the MONGOOSE_URL environment variable.
 * Returns a promise that resolves when the connection is established.
 */
export async function connectDB() {
    const uri = process.env.MONGOOSE_URL;
    if (!uri) {
        const msg = 'MONGOOSE_URL environment variable is not set';
        console.error('❌', msg);
        throw new Error(msg);
    }

    try {
        await mongoose.connect(uri, {
            dbName: "ChatAppDB",
        });
        console.log("✅ Connected to MongoDB database");
    } catch (error) {
        console.error("❌ Error connecting to MongoDB database:", error);
        throw error;
    }
}

export default connectDB;