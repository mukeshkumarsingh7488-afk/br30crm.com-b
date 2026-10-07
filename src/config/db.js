const mongoose = require("mongoose");
const env = require("./env");

const connectDB = async () => {
  try {
    console.log("MongoDB connection attempt started.");

    const connection = await mongoose.connect(env.mongodbUri, {
      serverSelectionTimeoutMS: 10000,
      connectTimeoutMS: 10000,
      socketTimeoutMS: 20000,
    });

    console.log(`MongoDB connected successfully to ${connection.connection.name}.`);

    return connection;
  } catch (error) {
    console.error("MongoDB connection failed.");
    console.error("MongoDB error:", error);

    throw error;
  }
};

const disconnectDB = async () => {
  try {
    await mongoose.connection.close();
    console.log("MongoDB connection closed.");
  } catch (error) {
    console.error("MongoDB disconnect error:", error);
  }
};

module.exports = {
  connectDB,
  disconnectDB,
};
