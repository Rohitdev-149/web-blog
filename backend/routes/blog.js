const express = require("express");
const router = express.Router();
const Blog = require("../models/Blog");
const Comment = require("../models/Comment");
const { protect } = require("../middleware/auth");

// Get all blogs
router.get("/", async (req, res) => {
  try {
    const blogs = await Blog.find()
      .populate("author", "username avatar")
      .sort({ createdAt: -1 });
    res.json(blogs);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// Get blogs by user ID
router.get("/user/:userId", async (req, res) => {
  try {
    const blogs = await Blog.find({ author: req.params.userId })
      .populate("author", "username avatar")
      .sort({ createdAt: -1 });
    res.json(blogs);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// Get single blog
router.get("/:id", async (req, res) => {
  try {
    const blog = await Blog.findById(req.params.id)
      .populate("author", "username avatar")
      .populate({
        path: "comments",
        populate: { path: "author", select: "username avatar" },
      });

    if (!blog) {
      return res.status(404).json({ message: "Blog not found" });
    }
    res.json(blog);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// Create blog
router.post("/", protect, async (req, res) => {
  try {
    const { title, content, image, tags } = req.body;
    const blog = new Blog({
      title,
      content,
      image,
      tags,
      author: req.user.id,
    });

    await blog.save();
    res.status(201).json(blog);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// Update blog
router.put("/:id", protect, async (req, res) => {
  try {
    const blog = await Blog.findById(req.params.id);

    if (!blog) {
      return res.status(404).json({ message: "Blog not found" });
    }

    // Check if user is the author
    if (blog.author.toString() !== req.user.id) {
      return res
        .status(401)
        .json({ message: "Not authorized to update this blog" });
    }

    const { title, content, image, tags } = req.body;
    blog.title = title || blog.title;
    blog.content = content || blog.content;
    blog.image = image || blog.image;
    blog.tags = tags || blog.tags;

    await blog.save();
    res.json(blog);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// Delete blog
router.delete("/:id", protect, async (req, res) => {
  try {
    const blog = await Blog.findById(req.params.id);

    if (!blog) {
      return res.status(404).json({ message: "Blog not found" });
    }

    // Check if user is the author
    if (blog.author.toString() !== req.user.id) {
      return res
        .status(401)
        .json({ message: "Not authorized to delete this blog" });
    }

    // Delete all comments associated with this blog
    await Comment.deleteMany({ blog: req.params.id });

    // Delete the blog
    await Blog.findByIdAndDelete(req.params.id);

    res.json({ message: "Blog and associated comments removed" });
  } catch (error) {
    console.error("Delete blog error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// Like/Unlike blog
router.put("/:id/like", protect, async (req, res) => {
  try {
    const blog = await Blog.findById(req.params.id);

    if (!blog) {
      return res.status(404).json({ message: "Blog not found" });
    }

    const likeIndex = blog.likes.indexOf(req.user.id);
    if (likeIndex === -1) {
      blog.likes.push(req.user.id);
    } else {
      blog.likes.splice(likeIndex, 1);
    }

    await blog.save();
    res.json(blog);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

module.exports = router;
