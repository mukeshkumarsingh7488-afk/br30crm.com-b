const { randomUUID } = require("crypto");

const generateId = () => randomUUID();

module.exports = generateId;
