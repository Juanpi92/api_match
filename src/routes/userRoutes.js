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
  app.post("/post_photo/:id_user", upload.single("image"), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).send({ error: "Nenhuma imagem fornecida" });
      }

      let imagen = await sharp(req.file.buffer)
        .resize({ heigth: 1920, width: 1080, fit: "contain" })
        .toBuffer();

      //Send the image to S3
      let id_photo = `${uuidv4()}-${req.params.id_user}`;
      const params = {
        Bucket: process.env.BUCKET_NAME,
        Key: id_photo,
        Body: imagen,
        ContentType: req.file.mimetype,
      };

      const command = new PutObjectCommand(params);
      await s3.send(command);

      //Update the User
      await User.findByIdAndUpdate(req.params.id_user, {
        $push: { photos: id_photo },
      });

      //Creating the temporal URL for the bucket object and send to the client
      let getObjectParams = {
        Bucket: process.env.BUCKET_NAME,
        Key: id_photo,
      };

      let command2 = new GetObjectCommand(getObjectParams);
      let photo = {
        url: await getSignedUrl(s3, command2, {
          expiresIn: 10800,
        }),
        id: id_photo,
      };

      res.status(201).send(photo);
    } catch (error) {
      res.status(500).send(error);
    }
  });
  app.delete("/del_photo/:id_user", async (req, res) => {
    try {
      let id_photo = req.body.id_photo;
      let id_user = req.params.id_user;

      res.status(200).send({ id_photo, id_user });
    } catch (error) {
      console.log(error);
      res.status(500).send(error);
    }
  });
};
