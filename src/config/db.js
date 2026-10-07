const mongoose = require("mongoose");
const env = require("./env");

const connectDB = async () => {
  try {
    const connection = await mongoose.connect(env.mongodbUri, {
      serverSelectionTimeoutMS: 15000,
      connectTimeoutMS: 15000,
      socketTimeoutMS: 30000,
      maxPoolSize: 20,
      minPoolSize: 1,
      maxIdleTimeMS: 60000,
      serverSelectionTryOnce: false,
    });
  } catch (error) {
    process.exit(1);
  }
};

const disconnectDB = async () => {
  try {
    await mongoose.connection.close();
  } catch (error) {}
};

module.exports = {
  connectDB,
  disconnectDB,
};
