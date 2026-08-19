const mongoose = require('mongoose');
async function connectDB() {
    try {
       await mongoose.connect(process.env.mongo_url);
        console.log("Database Connected Successfully");
        return true;
    }
    catch (error) {
        console.log("Error in DB Connection", error);
        return false;
    }
}

module.exports = connectDB;