const express = require("express");
const router = express.Router();
const prisma = require("../lib/prisma");

const VALID_TYPES = ["DVD", "BLURAY", "DIGITAL"];

// GET /api/movies?q=&type=&sort=
router.get("/", async (req, res) => {
  try {
    const q = (req.query.q || "").toString().trim();
    const type = (req.query.type || "").toString().trim().toUpperCase();
    const sort = (req.query.sort || "new").toString().trim().toLowerCase();

    const where = {};
    if (q) {
      // NOTE: no "mode: 'insensitive'" — not supported on SQLite
      where.OR = [
        { title: { contains: q } },
        { notes: { contains: q } }
      ];
    }
    if (VALID_TYPES.includes(type)) where.discType = type;

    let orderBy;
    if (sort === "old") orderBy = { createdAt: "asc" };
    else if (sort === "title") orderBy = { title: "asc" };
    else orderBy = { createdAt: "desc" };

    const movies = await prisma.movie.findMany({ where, orderBy });
    res.json(movies);
  } catch (e) {
    console.error("GET /api/movies failed:", e);
    res.status(500).json({ error: "Failed to fetch movies" });
  }
});

// POST /api/movies -> create
router.post("/", async (req, res) => {
  try {
    let { title, discType = "DVD", notes = "" } = req.body;
    title = (title || "").trim();
    discType = (discType || "DVD").toString().trim().toUpperCase();
    notes = (notes || "").toString().trim();

    if (!title) return res.status(400).json({ error: "Title is required" });
    if (!VALID_TYPES.includes(discType)) discType = "DVD";

    const movie = await prisma.movie.create({
      data: { title, discType, notes: notes || null },
    });

    res.status(201).json(movie);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Failed to create movie" });
  }
});

// PUT /api/movies/:id -> update
router.put("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const updates = {};

    if (typeof req.body.title === "string") {
      const t = req.body.title.trim();
      if (!t) return res.status(400).json({ error: "Title cannot be empty" });
      updates.title = t;
    }
    if (typeof req.body.notes === "string") updates.notes = req.body.notes.trim() || null;
    if (typeof req.body.discType === "string") {
      const v = req.body.discType.trim().toUpperCase();
      if (!VALID_TYPES.includes(v)) return res.status(400).json({ error: "Invalid discType" });
      updates.discType = v;
    }

    const movie = await prisma.movie.update({ where: { id }, data: updates });
    res.json(movie);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Failed to update movie" });
  }
});

// DELETE /api/movies/:id -> delete
router.delete("/:id", async (req, res) => {
  try {
    await prisma.movie.delete({ where: { id: req.params.id } });
    res.json({ ok: true });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Failed to delete movie" });
  }
});

module.exports = router;