import { v2 as cloudinary } from "cloudinary";
import { CloudinaryStorage } from "multer-storage-cloudinary";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: "restaurantapp",
    format: async (req, file) => "jpg",
    public_id: (req, file) => file.originalname,
    transformation: [{ width: 800, height: 800, crop: "limit" }],
  },
});

module.exports = { cloudinary, storage };
