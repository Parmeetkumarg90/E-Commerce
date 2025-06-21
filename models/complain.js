import mongoose from "mongoose";

const helpSchema = mongoose.Schema(
    {
        userID:{
            type:mongoose.Schema.Types.ObjectId,
            ref:'users',
            required:true,
        },        
        sellerID:{
            type:mongoose.Schema.Types.ObjectId,
            ref:'users',
            required:true,
        },
        userSocketID:{
            type:String,
            required:true,
        },
        sellerSocketID:{
            type:String,
            required:true,
        },
        productID:{
            type:mongoose.Schema.Types.ObjectId,
            required:true
        },
        messages:{
            type:[String],
            default:[]
        },
        resolve:{
            type:Boolean,
            enum:[true,false],
            default:false
        },
        date:{
            type:Date
        }
    }
);

const Chat = mongoose.model('complain',helpSchema);

export default Chat;