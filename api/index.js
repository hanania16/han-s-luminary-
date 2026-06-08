import { PrismaClient } from "@prisma/client";
import express from "express";
import multer from "multer";
import sharp from "sharp";
import { v2 as cloudinary } from "cloudinary";
import { randomUUID } from "crypto";
import { unlinkSync } from "fs";
import { extname } from "path";
import { tmpdir } from "os";

const HAS_CLOUDINARY = !!(process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_API_KEY && process.env.CLOUDINARY_API_SECRET);
if (HAS_CLOUDINARY) {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  });
}

const prisma = new PrismaClient();
const app = express();
const PASSWORD = process.env.PASSWORD || "lemlemMeseret";
const UPLOAD_DIR = tmpdir();

const storage = multer.diskStorage({
  destination: UPLOAD_DIR,
  filename: (req, file, cb) => {
    const ext = extname(file.originalname);
    cb(null, `${randomUUID()}${ext}`);
  },
});
const upload = multer({ storage, limits: { fileSize: 50 * 1024 * 1024 } });

app.use(express.json());

// Backward compat for old photo URLs still stored as /api/uploads/... in DB
app.get("/api/uploads/:filename", (req, res) => {
  res.status(404).json({ error: "Local file serving not available on Vercel. Photos must use Cloudinary URLs. Run the migration script to update old URLs." });
});

function now() { return new Date().toISOString(); }

app.post("/api/auth/login", (req, res) => {
  const { password } = req.body;
  if (password === PASSWORD) return res.json({ success: true });
  return res.status(401).json({ success: false, error: "Incorrect password" });
});

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
      if (!HAS_CLOUDINARY) throw new Error("Cloudinary not configured. Set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET.");
      const webpPath = f.path.replace(extname(f.path), ".webp");
      await sharp(f.path).webp({ quality: 85 }).toFile(webpPath);
      unlinkSync(f.path);

      const result = await cloudinary.uploader.upload(webpPath, {
        folder: "luminary",
        resource_type: "image",
      });
      unlinkSync(webpPath);
      const uploadUrl = result.secure_url;

      const id = "p" + Date.now() + i;
      return prisma.photo.create({
        data: {
          id,
          title: f.originalname.replace(/\.[^.]+$/, ""),
          albumId,
          url: uploadUrl,
          thumb: uploadUrl,
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

    if (photo.url && photo.url.includes("res.cloudinary.com")) {
      const publicId = photo.url.split("/").pop().replace(/\.\w+$/, "");
      try { await cloudinary.uploader.destroy(`luminary/${publicId}`); } catch {}
    }

    res.json({ success: true, album: updatedAlbum });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

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

app.post("/api/guests", async (req, res) => {
  try {
    const { guestId, name, whereTheyKnowHan } = req.body;
    if (!name || !whereTheyKnowHan) {
      return res.status(400).json({ error: "Name and whereTheyKnowHan required" });
    }
    const id = guestId || randomUUID();
    const guest = await prisma.guest.upsert({
      where: { id },
      update: { name, whereTheyKnowHan, lastSeenAt: new Date() },
      create: { id, name, whereTheyKnowHan },
    });
    res.json({ guest });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.get("/api/guests/:id/requests", async (req, res) => {
  try {
    const requests = await prisma.request.findMany({
      where: { guestId: req.params.id },
      orderBy: { createdAt: "desc" },
    });
    res.json({ requests });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.get("/api/guests/:id/approved", async (req, res) => {
  try {
    const requests = await prisma.request.findMany({
      where: { guestId: req.params.id, status: "approved", expiresAt: { gt: new Date() } },
      orderBy: { createdAt: "desc" },
    });
    const photoIds = requests.flatMap(r => r.photoIds.length > 0 ? r.photoIds : [r.photoId]);
    const photos = await prisma.photo.findMany({ where: { id: { in: photoIds } } });
    res.json({ requests, photos });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

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
    const { photoIds, photoTitles, photoId, photoTitle, name, from, message, social, guestId } = req.body;
    const ids = photoIds || (photoId ? [photoId] : []);
    const titles = photoTitles || (photoTitle ? [photoTitle] : []);
    if (!ids.length || !name || !from || !message) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    const request = await prisma.request.create({
      data: {
        id: "r" + Date.now(),
        guestId: guestId || null,
        photoId: ids[0],
        photoTitle: titles[0],
        photoIds: ids,
        photoTitles: titles,
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

app.get("/api/messages", async (req, res) => {
  try {
    const messages = await prisma.message.findMany({ orderBy: { createdAt: "desc" } });
    res.json({ messages });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

export default app;
