const mongoose = require("mongoose");
const env = require("./env");

const connectDB = async () => {
  try {
    console.log("MongoDB connection attempt started.");

    const connection = await mongoose.connect(env.mongodbUri, {
      serverSelectionTimeoutMS: 15000,
      connectTimeoutMS: 15000,
      socketTimeoutMS: 30000,
      maxPoolSize: 20,
      minPoolSize: 1,
      maxIdleTimeMS: 60000,
      serverSelectionTryOnce: false,
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
