import { v2 as cloudinary } from 'cloudinary';
import fs from "fs";
import { CLOUD_KEY, CLOUD_NAME, CLOUD_SECRET_KEY } from '../../config/env.js';

// Configuration
cloudinary.config({ 
    cloud_name: CLOUD_NAME, 
    api_key: CLOUD_KEY, 
    api_secret: CLOUD_SECRET_KEY
});

const uploadFile = async (localFilePath) => {
    try {
        if (!localFilePath) return null;
        
        const response = await cloudinary.uploader.upload(localFilePath, {
            resource_type: "auto"
        });
        console.log('response', response);
        
        return response;    
    } catch (error) {
        console.log('error 12456', error);
        
        // Check if the file exists before trying to delete it
        if (fs.existsSync(localFilePath)) {
            try {
                fs.unlinkSync(localFilePath);
                console.log('File deleted successfully');
            } catch (unlinkError) {
                console.error('Error deleting file:', unlinkError);
            }
        } else {
            console.log('File does not exist, cannot delete');
        }
    }
};

export { uploadFile };