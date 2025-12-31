require("dotenv").config();
const mongoose = require("mongoose");
const dbUrl = process.env.DB_URL;
const dbName = process.env.DB_NAME;

async function connectDB(req, res, next) {
    try {
        await mongoose.connect(dbUrl, { dbName });
        console.log("Database connected!");
        next();
    } catch (error) {
        console.error(error);
        res.status(500).send("Database connection failed");
    }
}

module.exports = connectDB;