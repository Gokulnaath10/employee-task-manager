const serverless = require("serverless-http");
const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const employeeRoutes = require("../../backend/routes/employeeRoutes");
const taskRoutes = require("../../backend/routes/taskRoutes");

const app = express();

app.use(cors());
app.use(express.json());

app.use("/api/employees", employeeRoutes);
app.use("/api/employees/:employeeId/tasks", taskRoutes);

let isConnected = false;

module.exports.handler = async (event, context) => {
  context.callbackWaitsForEmptyEventLoop = false;

  if (!isConnected) {
    await mongoose.connect(process.env.MONGO_URI);
    isConnected = true;
  }

  return serverless(app)(event, context);
};
