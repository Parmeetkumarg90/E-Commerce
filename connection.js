import mongoose from "mongoose";

async function connectDB(url){
    mongoose.connect(url)
    .then(()=>{
        console.log("MongoDB connected successfully");
    })
    .catch((error)=>{
        console.log("Database connection failed");
    })
}

export default connectDB;