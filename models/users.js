import mongoose from 'mongoose';

const userSchema = mongoose.Schema(
    {
        email: {
            type: String,
            required: true,
            unique: true
        },
        password: {
            type: String,
            required: true,
        },
        role:{
            type:String,
            enum:['User','Seller'],
            default:'User'
        },
        socketID:{
            type:String
        },
        cart:[
            {
                _id: {
                    type: mongoose.Schema.Types.ObjectId,
                    ref: 'products',
                    required: true
                },
                count: {
                    type: Number,
                    required: true,
                    default: 1,
                    min: 1
                }
            }
        ],
        address:{
            type:String,
            default:""
        }
    },
    {
        timestamps: true,
    }
);

const User = mongoose.model('users', userSchema);

export default User;