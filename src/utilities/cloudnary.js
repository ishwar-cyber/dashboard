import { v2 as cloudinary } from 'cloudinary';
import fs from "fs"

import { CLOUD_KEY, CLOUD_NAME, CLOUD_SECRET_KEY } from '../../config/env.js';

  // Configuration
  cloudinary.config({ 
    cloud_name: CLOUD_NAME, 
    api_key: CLOUD_KEY, 
    api_secret: CLOUD_SECRET_KEY// Click 'View API Keys' above to copy your API secret
 });

const uploadFile = async (localFilePath) => {
    try {
        if(!loadFilePath) return null

        const response = await cloudinary.uploader.upload(localFilePath, {
            resource_type: "auto"
        })

        console.log("file has been uploaded", response.url);
        return response;    
    
    } catch (error) {
        fs.unlinkSync(localFilePath)
    }
}

export { uploadFile }