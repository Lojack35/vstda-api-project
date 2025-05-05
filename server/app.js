// Load environment variables from .env file
require("dotenv").config();

// Import core modules and libraries
const express = require("express");
const morgan = require("morgan");
const fs = require("fs");
const path = require("path");

// Track server uptime
const startTime = Date.now();

// Initialize Express app
const app = express();

// Middleware: log HTTP requests to the console
app.use(morgan("dev"));

// Middleware: parse incoming JSON in request bodies
app.use(express.json());

// ----------------------
// Utility Functions
// ----------------------

/**
 * Logs error messages to /logs/error.log with timestamps.
 * Used for 500 and 404-level errors.
 */
function logError(error) {
  const logDir = path.join(__dirname, "../logs");
  const logFile = path.join(logDir, "error.log");

  if (!fs.existsSync(logDir)) {
    fs.mkdirSync(logDir);
  }

  const timestamp = new Date().toISOString();
  const message = `[${timestamp}] ${error}\n`;

  fs.appendFileSync(logFile, message, "utf8");
}

/**
 * Validates and sanitizes a todo item.
 * Ensures correct types and strips HTML/SQL-injection keywords.
 */
function validateAndSanitize(
  { todoItemId, name, priority, completed },
  { requireId = true } = {}
) {
  const errors = [];

  if (requireId && typeof todoItemId !== "number") {
    errors.push("Invalid ID format");
  }

  if (typeof name !== "string" || name.trim() === "") {
    errors.push("Invalid name format");
  }

  if (!Number.isInteger(priority)) {
    errors.push("Invalid priority format");
  }

  if (typeof completed !== "boolean") {
    errors.push("Invalid completed format");
  }

  let sanitizedName = name;

  if (typeof name === "string") {
    sanitizedName = name
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll("'", "&#39;")
      .replaceAll('"', "&quot;");

    const lowerCaseWords = sanitizedName.toLowerCase().split(/\s+/);
    const sqlKeywords = ["select", "insert", "update", "delete", "drop"];

    for (const word of sqlKeywords) {
      if (lowerCaseWords.includes(word)) {
        errors.push(`Invalid name format: contains SQL keyword "${word}"`);
        break;
      }
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    sanitized: {
      todoItemId,
      name: sanitizedName,
      priority,
      completed,
    },
  };
}

// ----------------------
// In-memory Mock Data
// ----------------------

let todoItems = [
  { todoItemId: 0, name: "an item", priority: 3, completed: false },
  { todoItemId: 1, name: "another item", priority: 2, completed: false },
  { todoItemId: 2, name: "a done item", priority: 1, completed: true },
];

// ----------------------
// Routes
// ----------------------

/**
 * Root route — returns app status and uptime in seconds.
 */
app.get("/", (req, res) => {
  const uptimeSeconds = Math.floor((Date.now() - startTime) / 1000);
  res.status(200).json({ status: "ok", uptime: `${uptimeSeconds} seconds` });
});

/**
 * GET all todo items, or filter by completed status with ?completed=true/false.
 */
app.get("/api/TodoItems", (req, res) => {
  const { completed } = req.query;

  if (completed === "true") {
    return res.status(200).json(todoItems.filter((item) => item.completed));
  }

  if (completed === "false") {
    return res.status(200).json(todoItems.filter((item) => !item.completed));
  }

  if (completed !== undefined) {
    return res.status(400).json({
      status: "error",
      message: "Invalid query parameter",
    });
  }

  res.status(200).json(todoItems);
});

/**
 * GET a single todo item by ID.
 */
app.get("/api/TodoItems/:number", (req, res) => {
  const todoItemId = parseInt(req.params.number, 10);

  if (isNaN(todoItemId)) {
    return res
      .status(400)
      .json({ status: "error", message: "Invalid ID format" });
  }

  const todoItem = todoItems.find((item) => item.todoItemId === todoItemId);

  if (!todoItem) {
    logError(`404: Todo item with ID ${todoItemId} not found`);
    return res
      .status(404)
      .json({ status: "error", message: "Todo item not found" });
  }

  res.status(200).json(todoItem);
});

/**
 * POST a new todo item.
 */
app.post("/api/TodoItems", (req, res) => {
  const { isValid, errors, sanitized } = validateAndSanitize(req.body);

  if (!isValid) {
    return res
      .status(400)
      .json({ status: "error", message: errors.join("; ") });
  }

  todoItems.push(sanitized);
  res.status(201).json(sanitized);
});

/**
 * DELETE a todo item by ID.
 */
app.delete("/api/TodoItems/:number", (req, res) => {
  const todoItemId = parseInt(req.params.number, 10);

  if (isNaN(todoItemId)) {
    return res
      .status(400)
      .json({ status: "error", message: "Invalid ID format" });
  }

  const index = todoItems.findIndex((item) => item.todoItemId === todoItemId);

  if (index === -1) {
    logError(`404: Todo item with ID ${todoItemId} not found`);
    return res
      .status(404)
      .json({ status: "error", message: "Todo item not found" });
  }

  const deletedItem = todoItems.splice(index, 1)[0];
  res.status(200).json(deletedItem);
});

/**
 * PUT (replace) a todo item.
 */
app.put("/api/TodoItems/:number", (req, res) => {
  const todoItemId = parseInt(req.params.number, 10);

  if (isNaN(todoItemId)) {
    return res
      .status(400)
      .json({ status: "error", message: "Invalid ID format" });
  }

  const index = todoItems.findIndex((item) => item.todoItemId === todoItemId);

  if (index === -1) {
    logError(`404: Todo item with ID ${todoItemId} not found`);
    return res
      .status(404)
      .json({ status: "error", message: "Todo item not found" });
  }

  const { isValid, errors, sanitized } = validateAndSanitize(
    { ...req.body, todoItemId },
    { requireId: false }
  );

  if (!isValid) {
    return res
      .status(400)
      .json({ status: "error", message: errors.join("; ") });
  }

  todoItems[index] = sanitized;
  res.status(200).json(sanitized);
});

/**
 * PATCH (partially update) a todo item.
 */
app.patch("/api/TodoItems/:number", (req, res) => {
  const todoItemId = parseInt(req.params.number, 10);

  if (isNaN(todoItemId)) {
    return res
      .status(400)
      .json({ status: "error", message: "Invalid ID format" });
  }

  const index = todoItems.findIndex((item) => item.todoItemId === todoItemId);

  if (index === -1) {
    logError(`404: Todo item with ID ${todoItemId} not found`);
    return res
      .status(404)
      .json({ status: "error", message: "Todo item not found" });
  }

  const { name, priority, completed } = req.body;
  const errors = [];

  if (name !== undefined && typeof name !== "string") {
    errors.push("Invalid name format");
  }

  if (priority !== undefined && !Number.isInteger(priority)) {
    errors.push("Invalid priority format");
  }

  if (completed !== undefined && typeof completed !== "boolean") {
    errors.push("Invalid completed format");
  }

  if (errors.length > 0) {
    return res
      .status(400)
      .json({ status: "error", message: errors.join("; ") });
  }

  let sanitizedName = name;

  if (name !== undefined) {
    const lowerCaseWords = name.toLowerCase().split(/\s+/);
    const sqlKeywords = ["select", "insert", "update", "delete", "drop"];
    for (const word of sqlKeywords) {
      if (lowerCaseWords.includes(word)) {
        return res.status(400).json({
          status: "error",
          message: `Invalid name format: contains SQL keyword "${word}"`,
        });
      }
    }

    sanitizedName = name
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll("'", "&#39;")
      .replaceAll('"', "&quot;");
  }

  const updatedTodoItem = { ...todoItems[index] };

  if (sanitizedName !== undefined) updatedTodoItem.name = sanitizedName;
  if (priority !== undefined) updatedTodoItem.priority = priority;
  if (completed !== undefined) updatedTodoItem.completed = completed;

  todoItems[index] = updatedTodoItem;

  res.status(200).json(updatedTodoItem);
});

// ----------------------
// Global Error Handler (500 errors)
// ----------------------

app.use((err, req, res, next) => {
  logError(`500 Internal Error: ${err.stack}`);
  res.status(500).json({
    status: "error",
    message: "Internal Server Error",
  });
});

// Export the app for use in index.js
module.exports = app;
