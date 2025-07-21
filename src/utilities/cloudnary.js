import { v2 as cloudinary } from 'cloudinary';
import fs from "fs";
import { CLOUD_KEY, CLOUD_NAME, CLOUD_SECRET_KEY } from '../../config/env.js';
import { CloudinaryStorage } from 'multer-storage-cloudinary';



    cloudinary.config({ 
        cloud_name: CLOUD_NAME, 
        api_key: CLOUD_KEY, 
        api_secret: CLOUD_SECRET_KEY
    });
  
  const storage = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: {
      folder: 'products', // cloudinary folder name
      allowed_formats: ['jpg', 'png', 'jpeg', 'webp'],
      transformation: [{ width: 800, height: 800, crop: 'limit' }]
    }
  });
  
  export { cloudinary, storage };

// // Configuration
// cloudinary.config({ 
//     cloud_name: CLOUD_NAME, 
//     api_key: CLOUD_KEY, 
//     api_secret: CLOUD_SECRET_KEY
// });

// const uploadFile = async (file) => {   
//     try {
//         if (!file) return null;
//         const response = await cloudinary.uploader.upload(file);
//         return response.url;    
//     } catch (error) {
//         // Check if the file exists before trying to delete it
//         if (fs.existsSync(file)) {
//             try {
//                 fs.unlinkSync(file);
              
//             } catch (unlinkError) {
//                 console.error('Error deleting file:', unlinkError);
//             }
//         } else {
//             console.error('File does not exist, cannot delete');
//         }
//     }
// };

// const uploadFiles = async (files) => {
//     console.log('filessssss0', files);
    
//     try {
//         if (!files || files.length === 0) return null;
//         const urls = [];
//         for (const file of files) {
//             try {
//                 const result = await cloudinary.uploader.upload(file.path);
//                 console.log('result url', result);
                
//                 urls.push(result.url);
//                 // Delete local file after successful upload
//                 if (fs.existsSync(file.path)) {
//                     fs.unlinkSync(file.path);
//                 }
//             } catch (uploadError) {
//                 console.error(`Error uploading file ${file.originalname}:`, uploadError);
//             }
//         }

//         return urls.length > 0 ? urls : null;
//     } catch (error) {
//         console.error('Error in uploadFiles:', error);
//         return null;
//     }
// };
// export { uploadFile, uploadFiles };