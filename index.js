require("dotenv").config();
const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const cookieParser = require("cookie-parser");
const Task = require("./models/Task");
const authRoutes = require("./authRoutes");
const authMiddleware = require("./authMiddleware");

const app = express();
const PORT = 5000;

mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("MongoDB connected"))
  .catch((err) => console.error("MongoDB connection error:", err));

app.use(
  cors({
    origin: process.env.FRONTEND_URL,
    credentials: true,
  }),
);
// Middleware to parse JSON
app.use(express.json());
app.use(cookieParser());

// Auth routes
app.use("/auth", authRoutes);

// Test route
app.get("/", (req, res) => {
  res.send("Backend is running!");
});

// Get all tasks for logged in user
app.get("/tasks", authMiddleware, async (req, res) => {
  try {
    const tasks = await Task.find({ userId: req.userId });
    res.json(tasks);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch tasks" });
  }
});

// Add a new task
app.post("/tasks", authMiddleware, async (req, res) => {
  try {
    const { title } = req.body;

    if (!title) {
      return res.status(400).json({ error: "Title is required" });
    }

    const newTask = new Task({ title, userId: req.userId });
    await newTask.save();

    res.status(201).json(newTask);
  } catch (err) {
    res.status(500).json({ error: "Failed to create task" });
  }
});

// Delete a task
app.delete("/tasks/:id", authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;

    const task = await Task.findOneAndDelete({ _id: id, userId: req.userId });

    if (!task) {
      return res.status(404).json({ error: "Task not found" });
    }

    res.status(200).json({ message: "Task deleted" });
  } catch (err) {
    res.status(500).json({ error: "Failed to delete task" });
  }
});

// Edit a task
app.put("/tasks/:id", authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const { title } = req.body;

    if (!title) {
      return res.status(400).json({ error: "Title is required" });
    }

    const updatedTask = await Task.findOneAndUpdate(
      { _id: id, userId: req.userId },
      { title },
      { returnDocument: "after" },
    );

    if (!updatedTask) {
      return res.status(404).json({ error: "Task not found" });
    }

    res.json(updatedTask);
  } catch (err) {
    res.status(500).json({ error: "Failed to update task" });
  }
});

// Start server
app.listen(PORT, "0.0.0.0", () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
