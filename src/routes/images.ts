import { Router } from "express";
import multer from "multer";
import { existsSync } from "fs";
import { logger, prisma } from "..";
import { get } from "../utils/files";

export const router = Router();
export const path = "/";

const upload = multer({ dest: "uploads/" });

router.get("/:id", async (req, res) => {
  const { id } = req.params;

  const image = await prisma.image.findUnique({
    where: {
      id,
    },
  });

  if (!image) {
    return res.status(404).json({
      error: "Image not found",
    });
  }

  if (!existsSync(image.path)) {
    return res.status(404).json({
      error: "Image not found",
    });
  }

  const buffer = get(image.path);

  res.writeHead(200, {
    "Content-Type": image.path.endsWith(".png") ? "image/png" : "image/jpeg",
    "Content-Disposition": `attachment; filename=${image.name}`,
    "Content-Length": buffer.length,
  });

  res.end(buffer);
});

router.post("/upload", upload.array("files"), async (req, res) => {
  if (req.headers.authorization !== process.env.SECRET) {
    return res.status(401).json({
      error: "Unauthorized",
    });
  }

  const files = req.files as Express.Multer.File[];

  if (!files || files.length === 0) {
    return res.status(400).json({
      error: "No files were uploaded",
    });
  }

  const images = await Promise.all(
    files.map(async (file) => {
      const image = await prisma.image.create({
        data: {
          path: file.path,
          name: file.originalname,
        },
      });

      logger.info(`Uploaded image ${image.id} (${image.name})`);

      return image;
    })
  );

  res.json({
    images,
  });
});
