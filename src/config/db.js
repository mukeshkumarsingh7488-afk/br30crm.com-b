const mongoose = require("mongoose");
const env = require("./env");

const connectDB = async () => {
  try {
    const connection = await mongoose.connect(env.mongodbUri, { serverSelectionTimeoutMS: 10000, connectTimeoutMS: 10000, socketTimeoutMS: 20000 });

    console.log(`MongoDB connected: ${connection.connection.host}/${connection.connection.name}`);
  } catch (error) {
    console.error("MongoDB connection failed:", error.message);
    process.exit(1);
  }
};

const disconnectDB = async () => {
  try {
    await mongoose.connection.close();
    console.log("MongoDB connection closed");
  } catch (error) {
    console.error("MongoDB disconnect failed:", error.message);
  }
};

module.exports = {
  connectDB,
  disconnectDB,
};
