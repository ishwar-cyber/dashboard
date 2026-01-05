import { v2 as cloudinary } from 'cloudinary';
import fs from "fs";
import { CLOUD_KEY, CLOUD_NAME, CLOUD_SECRET_KEY } from '../../config/env.js';

/* ----------------------------------
1. Cloudinary Configuration
---------------------------------- */
cloudinary.config({
    cloud_name: CLOUD_NAME, 
    api_key: CLOUD_KEY, 
    api_secret: CLOUD_SECRET_KEY,
    secure: true
});

/* ----------------------------------
2. Upload SINGLE file
---------------------------------- */
const uploadFile = async (file) => {
	if (!file?.path) return null;

	try {
		const result = await cloudinary.uploader.upload(file.path, {
			folder: "products",
			resource_type: "image",

			// compression at upload
			transformation: [
				{
					width: 2000, // max width
					height: 2000,
					crop: "limit",
					quality: 70, // HARD compression
					fetch_format: "auto",
				},
			],
		});

		// delete temp file
		await fs.unlink(file.path);

		return {
			public_id: result.public_id,
			url: result.secure_url,

			// optimized delivery URLs
			thumbnail: cloudinary.url(result.public_id, {
				width: 200,
				height: 200,
				crop: "fill",
				quality: "auto",
				fetch_format: "auto",
			}),

			optimized: cloudinary.url(result.public_id, {
				quality: "auto:best",
				fetch_format: "auto",
			}),
		};
	} catch (err) {
		if (file?.path) await fs.unlink(file.path).catch(() => {});
		throw err;
	}
};

/* ----------------------------------
3. Upload MULTIPLE files
---------------------------------- */
const uploadFiles = async (files = []) => {
	if (!Array.isArray(files) || files.length === 0) return [];

	const uploads = [];

	for (const file of files) {
		if (!file?.path) continue;

		try {
			const result = await cloudinary.uploader.upload(file.path, {
				folder: "products",
				resource_type: "image",
				transformation: [
					{
						width: 2000, // max width
						height: 2000,
						crop: "limit",
						quality: 70, // HARD compression
						fetch_format: "auto",
					},
				],
			});

			uploads.push({
				public_id: result.public_id,
				url: result.secure_url,
				optimized: cloudinary.url(result.public_id, {
					quality: "auto:best",
					fetch_format: "auto",
				}),
			});

			await fs.unlink(file.path);
		} catch (err) {
			await fs.unlink(file.path).catch(() => {});
			console.error(`Upload failed: ${file.originalname}`, err.message);
		}
	}

	return uploads;
};

const deleteFile = async (publicId) => {
	try {
		return await cloudinary.uploader.destroy(publicId);
	} catch (error) {
		throw new Error(`File deleting failed:${error.message}`);
	}
};

export { uploadFile, uploadFiles, deleteFile };
