import mongoose from "mongoose";
import { DB_name } from "../constants.js";

import dns from 'dns';
dns.setServers(['8.8.8.8','8.8.4.4']);

const connectDB = async () => {
    try{
        const connectionInstance = await mongoose.connect(`${process.env.MONGODB_URI}/${DB_name}`)
        
        console.log(`\n MongoDB connected!! DB HOST : ${connectionInstance.connection.host}`);
    }
    catch(error){
        console.log("MongoDB Connection Error",error);
        process.exit(1); 

    }
    
}

export default connectDB
