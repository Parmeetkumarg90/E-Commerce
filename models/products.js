import mongoose from 'mongoose';

const productSchema = mongoose.Schema(
    {
        sellerID: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'users',
            required: true,
        },
        name: {
            type: String,
            required: true,
        },
        description: {
            type: String,
            required: true,
        },
        imageSrc: {
            type: String,
            required: true,
        },
        sideImages: {
            type: [String]
        },
        price: {
            type: Number,
            required: true,
        },
        shipping: {
            type: Number,
            required: true,
            default: 0,
        },
        category: {
            type: String
        },
        stock: {
            type: Number,
            required: true,
        },
        maxbuy: {
            type: Number,
            default: 1
        },
        queryies: {
            type: [
                {
                    name: {
                        type: String,
                    },
                    userID: {
                        type: String,
                        required: true,
                    },
                    productID: {
                        type: String,
                        required: true,
                    },
                    help: {
                        type: String,
                        required: true,
                    },
                    userEmail: {
                        type: String,
                    }
                }
            ],
            required: true
        }
    },
    {
        timestamps: true,
    }
);

const Product = mongoose.model('products', productSchema);

export default Product;