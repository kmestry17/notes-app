require("dotenv").config();

const config = require("./config.json");
const mongoose = require("mongoose");

mongoose
  .connect(config.connectionString, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log("Database connected successfully"))
  .catch((err) => console.error("Database connection error:", err));

const User = require("./models/user.model");

const express = require("express");
const cors = require("cors");
const app = express();

const jwt = require("jsonwebtoken");
const { authenticateToken } = require("./utilities");

app.use(express.json());

app.use(
  cors({
    origin: "*",
  })
);

app.get("/", (req, res) => {
  res.json({ data: "hello" });
});

// Create Account
app.post("/create-account", async (req, res) => {
  const { fullname, email, password } = req.body;

  if (!email) {
    return res.status(400).json({ error: true, message: "Email is required" });
  }

  if (!password) {
    return res
      .status(400)
      .json({ error: true, message: "Password is required" });
  }

  try {
    const isUser = await User.findOne({ email });

    if (isUser) {
      return res.json({ error: true, message: "Email is already taken" });
    }

    const user = new User({
      fullname,
      email,
      password,
    });

    await user.save();

    const accessToken = jwt.sign(
      { user: user._id },
      process.env.ACCESS_TOKEN_SECRET,
      {
        expiresIn: "30m",
      }
    );

    return res.json({
      error: false,
      user,
      accessToken,
      message: "Registration Successful",
    });
  } catch (error) {
    console.error("Error during account creation:", error);
    return res
      .status(500)
      .json({ error: true, message: "Internal Server Error" });
  }
});

// Login
app.post("/login", async (req, res) => {
  const { email, password } = req.body;

  if (!email) {
    return res.status(400).json({ error: true, message: "Email is required" });
  }

  if (!password) {
    return res
      .status(400)
      .json({ error: true, message: "Password is required" });
  }

  try {
    const userInfo = await User.findOne({ email: email });

    if (!userInfo) {
      return res.status(400).json({ message: "User not found" });
    }

    if (userInfo.email === email && userInfo.password === password) {
      const user = { user: userInfo };
      const accessToken = jwt.sign({ user }, process.env.ACCESS_TOKEN_SECRET, {
        expiresIn: "36000m",
      });

      return res.json({
        error: false,
        userInfo,
        email,
        accessToken,
        message: "Login Successful",
      });
    } else {
      return res
        .status(400)
        .json({ error: true, message: "Invalid credentials" });
    }
  } catch (error) {
    console.error("Error during login:", error);
    return res
      .status(500)
      .json({ error: true, message: "Internal Server Error" });
  }
});

app.listen(8000, () => {
  console.log("Server is running on port 8000");
});

module.exports = app;
