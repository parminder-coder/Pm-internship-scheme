const mongoose = require('mongoose');
async function connectDB() {
    try {
    const mongoUrl = (process.env.MONGODB_URI || process.env.mongo_url || '').trim();
       if (!mongoUrl) {
        throw new Error('MongoDB connection string is missing. Set MONGODB_URI or mongo_url in .env');
       }

       await mongoose.connect(mongoUrl, {
        serverSelectionTimeoutMS: 10000,
       });
        console.log("Database Connected Successfully");
        return true;
    }
    catch (error) {
        console.log("Error in DB Connection", error);
        return false;
    }
}

module.exports = connectDB;