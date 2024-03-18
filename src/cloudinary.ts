import dotenv from "dotenv";
import { v2 as cloudinary } from "cloudinary";

dotenv.config();

// Configure Cloudinary
cloudinary.config({
	secure: true,
});

/**
 * Uploads an image to Cloudinary.
 * @param imagePath The path or URL of the image to upload.
 * @returns The public ID of the uploaded image.
 */
export const uploadImage = async (imagePath: string) => {
	const options = {
		use_filename: true,
		unique_filename: false,
		overwrite: true,
	};

	try {
		const result = await cloudinary.uploader.upload(imagePath, options);
		return result && result.public_id || null;
	} catch (error) {
		console.error("Error uploading image:", error);
		return null
	}
};

export const deleteImage = async (publicId: string) => {
	try {
		const result = await cloudinary.uploader.destroy(publicId);
		return result;
	} catch (error) {
		console.error("Error deleting image:", error);
		throw error;
	}
};