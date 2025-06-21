import mongoose from 'mongoose';
// CheckOut schema => customerID,name,email,products,quantity,totalAmount,payment,orderDate
const checkoutproductSchema = mongoose.Schema(
    {
        customerID: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'users',
            required: true,
        },
        name: {
            type: String,
            required: true,
        },
        email: {
            type: String,
        },
        address:{
            type:String,
        },
        products: {
            type: [
                {
                    _id: {
                        type: mongoose.Schema.Types.ObjectId,
                        ref: 'products',
                        required: true,
                    },
                    count: {
                        type: Number,
                        required: true,
                        min: 1,
                    },
                }
            ],
            required: true
        },
        totalAmount: {
            type: Number,
            required: true,
        },
        payment: {
            type: String
        },
        orderDate: {
            type: Date,
            unique:true,
            required:true,
        }
    },
    {
        timestamps: true,
    }
);

const CheckOut = mongoose.model('checkoutProducts', checkoutproductSchema);

export default CheckOut;