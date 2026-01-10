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

const uploadFile = async (file) => {   
    try {  
        console.log('fileeeeeeeeeesssss ');
        
        if (!file) return null;
        console.log('fileeeeeeeeeesssss afterrrrrrr', file);

        const response = await cloudinary.uploader.upload(file,{
            folder: "products",
            transformation: [{ quality: "auto", fetch_format: "auto" }],
        });

        console.log('productdddddd', response);
        
         // Generate transformation URLs
        const thumbnail = cloudinary.url(response.public_id, {
        width: 200,
        height: 200,
        crop: "fill",
        quality: "auto",
        fetch_format: "auto",
        });
        return {
            url: response.url,
            public_id: response.public_id,
            thumbnail: thumbnail
        }; 
    } catch (error) {
        // Check if the file exists before trying to delete it
        if (fs.existsSync(file)) {
            try {
                fs.unlinkSync(file);
              
            } catch (unlinkError) {
                console.error('Error deleting file:', unlinkError);
            }
        } else {
            console.error('File does not exist, cannot delete');
        }
    }
};

/* ----------------------------------
3. Upload MULTIPLE files
---------------------------------- */
const uploadFiles = async (files = []) => {
	if (!Array.isArray(files) || files.length === 0) return [];
	return urls.length > 0 ? urls : null;
}
const deleteFile = async (publicId) => {
	try {
		return await cloudinary.uploader.destroy(publicId);
	} catch (error) {
		throw new Error(`File deleting failed:${error.message}`);
	}
};

export { uploadFile, uploadFiles, deleteFile };
