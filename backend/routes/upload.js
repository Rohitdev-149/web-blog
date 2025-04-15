const express = require("express");
const router = express.Router();
const upload = require("../middleware/upload");
const { protect } = require("../middleware/auth");
const path = require("path");
const fs = require("fs");

// Upload image
router.post("/image", protect, upload.single("image"), (req, res) => {
  try {
    console.log("Upload request received:", req.file);

    if (!req.file) {
      console.log("No file in request");
      return res.status(400).json({ message: "No file uploaded" });
    }

    // Verify file exists in uploads directory
    const filePath = path.join(__dirname, "..", "uploads", req.file.filename);
    if (!fs.existsSync(filePath)) {
      console.error("File not found in uploads directory:", filePath);
      return res.status(500).json({ message: "File was not saved properly" });
    }

    // Return the full URL for the uploaded image
    const imageUrl = `${req.protocol}://${req.get("host")}/uploads/${
      req.file.filename
    }`;
    console.log("File uploaded successfully:", imageUrl);

    res.json({
      message: "File uploaded successfully",
      imageUrl: imageUrl,
    });
  } catch (error) {
    console.error("Upload error details:", {
      message: error.message,
      stack: error.stack,
      code: error.code,
    });
    res.status(500).json({
      message: "Server error",
      error: error.message,
      details: error.code,
    });
  }
});

module.exports = router;
