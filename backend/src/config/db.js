const mongoose = require('mongoose');
async function connectDB() {
    try {
        const mongoURI = process.env.MONGO_URI || process.env.mongo_url;
        await mongoose.connect(mongoURI);
        console.log("Database Connected Successfully");
        return true;
    }
    catch (error) {
        console.log("Error in DB Connection", error);
        return false;
    }
}

module.exports = connectDB;