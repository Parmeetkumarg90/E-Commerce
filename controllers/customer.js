import User from '../models/users.js';
import Product from '../models/products.js';
// import sendMail from '../utils/mail.js';

async function customerGetHandler(request, response) {
    return response.render('customerHome');
}

async function customerPostHandler(request, response) {
    const { product_id, count } = request.body;
    if (!request.cookies?.userID) {
        return response.send({ Result: "User Doesn't Exist" });
    }
    if (!request.body) {
        return response.status(400).send({ Result: "Product not added to Cart" });
    }
    const user = await User.findOne({
        _id: request.cookies?.userID,
        'cart._id': product_id
    }).lean();
    if (!user) {
        await User.findOneAndUpdate(
            {
                _id: request.cookies?.userID,
            },
            {
                $push: {
                    cart: {
                        _id: product_id,
                        count: count,
                    }
                }
            }
        );
    }
    else {
        await User.findOneAndUpdate({
            _id: request.cookies?.userID,
            'cart._id': product_id
        },
            {
                $inc: {
                    'cart.$.count': count,
                }
            }
        )
    }
    return response.status(200).send({ Result: "Product Added to Cart" });
}

async function logoutHandler(request, response) {
    response.clearCookie('uid'); // deleting from cookie(client)
    response.clearCookie('role'); // deleting from cookie(client)
    response.clearCookie('userID'); // deleting from cookie(client)
    return response.end('logout');
}

async function apiPostProductHandler(request, response) {
    const userID = request.cookies?.userID;
    const totalProducts = await Product.countDocuments().lean();
    let { start, end } = request.body;
    if (totalProducts <= start) {
        return response.send({ Result: "No more products" }); // no more documents in database
    }
    const limitedProducts = await Product.find({}).skip(start).limit(Math.min(end - start, totalProducts - start)).lean();
    if (userID) {
        let cart = await User.findOne({ _id: userID }).lean();
        cart = cart.cart;
        cart.forEach(product => {
            for (let i = 0; i < limitedProducts.length; i++) {
                if (limitedProducts[i]._id.toString() === product._id.toString()) {
                    limitedProducts[i].count = product.count;
                    break;
                }
            }
        });
    }

    return response.send({ Result: limitedProducts });
}

async function customerHelpGetHandler(request, response) {
    return response.render('help');
}

// queryies: [{userID, productID,name, help, userEmail }]

async function customerHelpPostHandler(request, response) {
    // const productID = request.params.productID;
    // const { name, helpQues, email } = request.body;
    // let seller = await Product.findOne(
    //     { _id: productID }
    // ).lean();

    // seller = await User.findOne({_id:seller.sellerID});

    // if (!seller) {
    //     return response.status(404).send({ Result: "Product was either removed or invalid" });
    // }

    // // // customer mail configuration
    // // sendMail('FlipBuy','forunimportant99@gmail.com',email,'Request Registered','Your Request has been Registered',`<h1 align='center'>Your Request has been registered.</h1><h3>Your Request => ${helpQues}</h3>`);
    // // //seller mail configuration
    // // sendMail('FlipBuy', 'forunimportant99@gmail.com', seller.email, 'Product Complain', helpQues, `<h1 align='center'>Complain/Request</h1><h3>User Email => ${email} </h3><h3>User Name => ${name} </h3><h3>Request => ${helpQues} </h3>`);

    // return response.status(200).send({ Result: "Your query has been sent to the seller." });
}

export { customerGetHandler, customerPostHandler, logoutHandler, apiPostProductHandler, customerHelpGetHandler, customerHelpPostHandler };