import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { v4 as uuidv4 } from "uuid";
import sharp from "sharp";
import { User } from "../models/User.js";
import multer from "multer";

export const userRoutes = (app) => {
  const upload = multer({ storage: multer.memoryStorage() });
  const s3 = new S3Client({
    credentials: {
      accessKeyId: process.env.ACCESS_KEY,
      secretAccessKey: process.env.SECRET_ACCESS_KEY,
    },
    region: process.env.BUCKET_REGION,
  });
  app.post("/post_photo/:id", upload.single("image"), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).send({ error: "Nenhuma imagem fornecida" });
      }

      let imagen = await sharp(req.file.buffer)
        .resize({ heigth: 1920, width: 1080, fit: "contain" })
        .toBuffer();
      //Send the image to S3
      const params = {
        Bucket: process.env.BUCKET_NAME,
        Key: `profile${req.params.id}`,
        Body: imagen,
        ContentType: req.file.mimetype,
      };
      const command = new PutObjectCommand(params);
      await s3.send(command);
    } catch (error) {
      res.status(500).send(error);
    }
  });
};
