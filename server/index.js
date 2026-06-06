import "dotenv/config";
import express from "express";
import cors from "cors";
import multer from "multer";
import sharp from "sharp";
import { PrismaClient } from "@prisma/client";
import { existsSync, mkdirSync, unlinkSync } from "fs";
import { join, extname } from "path";
import { randomUUID } from "crypto";

const prisma = new PrismaClient();
const app = express();

const PORT = process.env.PORT || 3001;
const PASSWORD = process.env.PASSWORD || "lemlemMeseret";
const UPLOAD_DIR = join(import.meta.dirname, "uploads");

if (!existsSync(UPLOAD_DIR)) mkdirSync(UPLOAD_DIR, { recursive: true });

app.use(cors({ origin: true }));
app.use(express.json());

app.get("/api/uploads/:filename", (req, res) => {
  const filePath = join(UPLOAD_DIR, req.params.filename);
  if (!existsSync(filePath)) return res.status(404).json({ error: "File not found" });
  res.sendFile(filePath);
});

const storage = multer.diskStorage({
  destination: UPLOAD_DIR,
  filename: (req, file, cb) => {
    const ext = extname(file.originalname);
    cb(null, `${randomUUID()}${ext}`);
  },
});
const upload = multer({ storage, limits: { fileSize: 50 * 1024 * 1024 } });

function now() { return new Date().toISOString(); }

// Auth
app.post("/api/auth/login", (req, res) => {
  const { password } = req.body;
  if (password === PASSWORD) return res.json({ success: true });
  return res.status(401).json({ success: false, error: "Incorrect password" });
});

// Photos
app.get("/api/photos", async (req, res) => {
  try {
    const photos = await prisma.photo.findMany({ orderBy: { createdAt: "desc" } });
    res.json({ photos });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.post("/api/photos", upload.array("files"), async (req, res) => {
  try {
    const { albumId } = req.body;
    const files = req.files;
    if (!files || files.length === 0) return res.status(400).json({ error: "No files" });

    const newPhotos = await Promise.all(files.map(async (f, i) => {
      let filename = f.filename;
      try {
        const webpName = filename.replace(extname(filename), ".webp");
        await sharp(f.path).webp({ quality: 85 }).toFile(join(UPLOAD_DIR, webpName));
        unlinkSync(f.path);
        filename = webpName;
      } catch (convErr) {
        console.error("Image conversion failed for", f.originalname, convErr.message);
      }
      const id = "p" + Date.now() + i;
      const relativePath = `/api/uploads/${filename}`;
      return prisma.photo.create({
        data: {
          id,
          title: f.originalname.replace(/\.[^.]+$/, ""),
          albumId,
          url: relativePath,
          thumb: relativePath,
          date: now().slice(0, 10),
          tags: [],
          likes: 0,
          stored: true,
        },
      });
    }));

    await prisma.album.update({
      where: { id: albumId },
      data: {
        count: { increment: files.length },
        cover: newPhotos[0].thumb,
      },
    });

    res.json({ photos: newPhotos });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.delete("/api/photos/:id", async (req, res) => {
  try {
    const photo = await prisma.photo.findUnique({ where: { id: req.params.id } });
    if (!photo) return res.status(404).json({ error: "Photo not found" });

    await prisma.request.deleteMany({ where: { photoId: photo.id } });
    await prisma.photo.delete({ where: { id: photo.id } });

    const remaining = await prisma.photo.findFirst({
      where: { albumId: photo.albumId },
      orderBy: { createdAt: "desc" },
    });
    const updatedAlbum = await prisma.album.update({
      where: { id: photo.albumId },
      data: {
        count: { decrement: 1 },
        ...(remaining ? { cover: remaining.thumb } : { cover: "https://images.unsplash.com/photo-1490806843957-31f4c9a91c65?w=400" }),
      },
    });

    if (photo.stored && (photo.url.startsWith("/uploads/") || photo.url.startsWith("/api/uploads/"))) {
      const filePath = join(UPLOAD_DIR, photo.url.split("/").pop());
      if (existsSync(filePath)) unlinkSync(filePath);
    }

    res.json({ success: true, album: updatedAlbum });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Albums
app.get("/api/albums", async (req, res) => {
  try {
    const albums = await prisma.album.findMany({ orderBy: { createdAt: "desc" } });
    res.json({ albums });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.post("/api/albums", async (req, res) => {
  try {
    const { name } = req.body;
    if (!name) return res.status(400).json({ error: "Name required" });

    const album = await prisma.album.create({
      data: {
        id: "a" + Date.now(),
        name,
        cover: "https://images.unsplash.com/photo-1490806843957-31f4c9a91c65?w=400",
        count: 0,
      },
    });
    res.json({ album });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Requests
app.get("/api/requests", async (req, res) => {
  try {
    const requests = await prisma.request.findMany({ orderBy: { createdAt: "desc" } });
    res.json({ requests });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.post("/api/requests", async (req, res) => {
  try {
    const { photoId, photoTitle, name, from, message, social } = req.body;
    if (!photoId || !name || !from || !message) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    const request = await prisma.request.create({
      data: {
        id: "r" + Date.now(),
        photoId,
        photoTitle,
        name,
        from,
        message,
        social: social || "",
        status: "pending",
        date: now(),
      },
    });

    const createdMessage = await prisma.message.create({
      data: {
        id: "m" + Date.now(),
        name,
        text: message,
        from,
        date: now().slice(0, 10),
      },
    });

    res.json({ request, message: createdMessage });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.patch("/api/requests/:id/approve", async (req, res) => {
  try {
    const request = await prisma.request.update({
      where: { id: req.params.id },
      data: {
        status: "approved",
        approvedAt: new Date(),
        expiresAt: new Date(Date.now() + 24 * 3600000),
      },
    });
    res.json({ request });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.patch("/api/requests/:id/reject", async (req, res) => {
  try {
    const request = await prisma.request.update({
      where: { id: req.params.id },
      data: { status: "rejected" },
    });
    res.json({ request });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Messages
app.get("/api/messages", async (req, res) => {
  try {
    const messages = await prisma.message.findMany({ orderBy: { createdAt: "desc" } });
    res.json({ messages });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.listen(PORT, () => {
  console.log(`Luminary server running on http://localhost:${PORT}`);
});
