import { v2 as cloudinary } from 'cloudinary';
import fs from "fs";
import { CLOUD_KEY, CLOUD_NAME, CLOUD_SECRET_KEY } from '../../config/env.js';


// Configuration
cloudinary.config({ 
    cloud_name: CLOUD_NAME, 
    api_key: CLOUD_KEY, 
    api_secret: CLOUD_SECRET_KEY,
    secure: true
});

const uploadFile = async (file) => {   
    try {  
        if (!file) return null;
        const response = await cloudinary.uploader.upload(file,{
            folder: "products",
            transformation: [{ quality: "auto", fetch_format: "auto" }],
        });
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

const uploadFiles = async (files) => {    
    try {
        if (!files || files.length === 0) return null;
        const urls = [];
        for (const file of files) {
            try {
                const result = await cloudinary.uploader.upload(file.path);
                let imageRes = {
                    url: result.url,
                    public_id: result.public_id
                }
                urls.push(imageRes);
                // Delete local file after successful upload
                if (fs.existsSync(file.path)) {
                    fs.unlinkSync(file.path);
                }
            } catch (uploadError) {
                console.error(`Error uploading file ${file.originalname}:`, uploadError);
            }
        }

        return urls.length > 0 ? urls : null;
    } catch (error) {
        console.error('Error in uploadFiles:', error);
        return null;
    }
};


const deleteFile = async(publicId) =>{    
    try {
        return await cloudinary.uploader.destroy(publicId);
    } catch (error) {
        throw new Error(`File deleting failed:${error.message}`);
    }
}
export { uploadFile, uploadFiles, deleteFile };
