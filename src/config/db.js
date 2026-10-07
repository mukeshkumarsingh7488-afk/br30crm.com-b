const mongoose = require("mongoose");
const env = require("./env");

const connectDB = async () => {
  try {
    const connection = await mongoose.connect(env.mongodbUri, { serverSelectionTimeoutMS: 10000, connectTimeoutMS: 10000, socketTimeoutMS: 20000 });
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
