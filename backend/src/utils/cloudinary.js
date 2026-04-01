import { v2 as cloudinary } from 'cloudinary';
import dotenv from 'dotenv';

dotenv.config();

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME || 'your_cloud_name',
  api_key: process.env.CLOUDINARY_API_KEY || 'your_api_key',
  api_secret: process.env.CLOUDINARY_API_SECRET || 'your_api_secret',
});

/**
 * Uploads an image to Cloudinary in a branch-specific folder
 * @param {string} fileStr - base64 string
 * @param {string} folder - target subfolder (e.g., 'cakes', 'decorations')
 * @param {string} rootFolder - branch-specific root folder (e.g., 'f-m-elr', 'f-m-bvrm')
 * @returns {Promise<string>}
 */
export const uploadToCloudinary = async (fileStr, folder = 'general', rootFolder = 'friends-memories') => {
  try {
    const uploadResponse = await cloudinary.uploader.upload(fileStr, {
      folder: `${rootFolder}/${folder}`,
      use_filename: true,
      unique_filename: true,
    });
    return uploadResponse.secure_url;
  } catch (error) {
    console.error('Cloudinary upload error:', error);
    throw new Error('Failed to upload image to cloud');
  }
};


export default cloudinary;
