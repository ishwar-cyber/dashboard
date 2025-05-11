import { v2 as cloudinary } from 'cloudinary';
import fs from "fs";
import { CLOUD_KEY, CLOUD_NAME, CLOUD_SECRET_KEY } from '../../config/env.js';

// Configuration
cloudinary.config({ 
    cloud_name: CLOUD_NAME, 
    api_key: CLOUD_KEY, 
    api_secret: CLOUD_SECRET_KEY
});

const uploadFile = async (file) => {
    console.log('file', file);
    
    try {
        if (!file) return null;
        
        const response = await cloudinary.uploader.upload(file);

        console.log('response', response.url);
        
        return response.url;    
    } catch (error) {
        console.log('error 12456', error);
        
        // Check if the file exists before trying to delete it
        if (fs.existsSync(file)) {
            try {
                fs.unlinkSync(file);
                console.log('File deleted successfully');
            } catch (unlinkError) {
                console.error('Error deleting file:', unlinkError);
            }
        } else {
            console.log('File does not exist, cannot delete');
        }
    }
};

const uploadFiles = async (files) => {
    try {
        if (!files || files.length === 0) return null;

        const urls = [];
        // Upload files sequentially
        // console.log('get cloudnary files', files);
        
        for (const file of files) {
            console.log('get cloudnary single file', file);
            
            try {
                const result = await cloudinary.uploader.upload(file.path);
                console.log('result fiile',result);
                
                urls.push(result.url);
                
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
export { uploadFile, uploadFiles };