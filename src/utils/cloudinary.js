import {v2 as cloudinary} from "cloudinary"
import fs from "fs"


    // Configuration
    cloudinary.config({ 
        cloud_name: process.env.CLOUDINARY_CLOUD_NAME, 
        api_key: process.env.CLOUDINARY_API_KEY, 
        api_secret: process.env.CLOUDINARY_API_SECRET 
    });

    const uploadOnCloudinary = async (localFilePath) =>{
        try{
            if(!localFilePath) return null
            //Now upload 
            const response = await cloudinary.uploader.upload(localFilePath,{
                resource_type:"auto"
            })
            //File has been Uploaded
            console.log("File is Uploaded on Cloudinary", response.url);
            return response;
        } catch(error){

            fs.unlinkSync(localFilePath) //Remove the locally Saved temp file as the upload is failed
            return null

        }
    }

    export {uploadOnCloudinary}

