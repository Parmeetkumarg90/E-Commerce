import User from "../models/users.js";
import Product from '../models/products.js';
import CheckOut from "../models/checkOutProducts.js";
import { isObjectIdOrHexString } from "mongoose";

async function cartGetHandler(request, response) {
    return response.render('cart');
}

async function cartPostHandler(request, response) {
    let user = await User.findOne({ _id: request.cookies?.userID }).lean();
    let cartIDs = [], cartCounts = [], flag = '';

    if (!user || !user.cart.length) {
        cartIDs = request.body.cartIds;
        cartCounts = request.body.cartCounts;
        flag = 'NO';
    }
    else {
        let localID = request.body.cartIds;
        let localCount = request.body.cartCounts;

        for (let i = 0; i < localID.length && i < localCount.length; i++) {
            const exist = user.cart.find(item => item._id.toString() === localID[i]);
            if (exist) {
                await User.findOneAndUpdate(
                    { _id: user._id, 'cart._id': localID[i] },
                    { $inc: { 'cart.$.count': localCount[i] } }
                );
            }
            else {
                await User.findOneAndUpdate(
                    { _id: user._id },
                    { $push: { cart: { _id: localID[i], count: localCount[i] } } }
                );
            }
        }
        user = await User.findOne({ _id: user._id }).lean();
        cartIDs = user.cart.map(item => item._id); // get all _id of product in array
        // cartIDs = cartIDs.concat(request.body.cartIds);

        cartCounts = user.cart.map(item => item.count); // get count of all products in array
        // cartCounts = cartCounts.concat(request.body.cartCounts);
        flag = 'YES';
    }

    let cartItems = await Product.find({ _id: { $in: cartIDs } }).lean(); // find all products using arrays of _id's
    // cartItems = cartItems.map(item => item.toObject()); // convert cartitems to plain text for avoiding mutations

    cartItems.forEach(product => {
        for (let i = 0; i < cartIDs.length; i++) {
            if (cartIDs[i].toString() === product._id.toString()) {
                product.count = cartCounts[i];
            }
        }
    });

    return response.status(200).send({ cartItems, clearLocal: flag });
}

async function cartPatchHandler(request, response) {
    const userID = request.cookies?.userID;
    let { productID, count } = request.body;
    count = Number(count);
    if (!userID) {
        return response.status(404).send({ Result: 'Login To Buy Them' });
    }
    if (!productID) {
        return response.status(400).send({ Result: 'Imcomplete Data' });
    }
    const checkUser = await User.findOne({ _id: userID, 'cart._id': productID }).lean();
    if (!checkUser) {
        return response.status(400).send({ Result: "User Not found" });
    }
    if (count <= 0) {
        // console.log(productID, count);
        await User.findOneAndUpdate(
            {
                _id: userID,
                'cart._id': productID
            },
            {
                $pull: {
                    cart: {
                        _id: productID
                    }
                }
            }
        );
    }
    else {
        await User.findOneAndUpdate(
            {
                _id: userID,
                'cart._id': productID
            },
            {
                $set: {
                    'cart.$.count': count
                }
            }
        );
    }
    return response.status(200).send({ Result: `Product with quantity ${count} Removed from your Cart` });
}

async function checkoutGetHandler(request, response) {
    let ordersummary = {}, userID = request.cookies?.userID;

    if (!request.cookies?.userID) {
        return response.redirect('/auth/login');
    }

    ordersummary = await CheckOut.find({ customerID: userID }).lean();
    ordersummary = JSON.parse(JSON.stringify(ordersummary)); // all orders

    let allProducts = await Product.find({}).lean();
    allProducts = JSON.parse(JSON.stringify(allProducts)); // all products

    const productMap = new Map();
    allProducts.forEach(prod => productMap.set(prod._id.toString(), prod));

    for (let i = 0; i < ordersummary.length; i++) {
        for (let j = 0; j < ordersummary[i].products.length; j++) {
            const product = productMap.get(ordersummary[i].products[j]._id.toString());
            if (product) {
                ordersummary[i].products[j] = {
                    ...ordersummary[i].products[j],
                    name: product.name,
                    imageSrc: product.imageSrc,
                    description: product.description,
                    price: product.price,
                    shipping: product.shipping
                }
            }
        }
    }

    return response.render('checkout', { ordersummary });
}

async function checkoutPostHandler(request, response) {
    const userID = request.cookies?.userID;
    if (!userID) {
        return response.status(401).send({ Result: "Invalid User Credentials" });
    }

    let { name, address, email, payment, checkoutProducts } = request.body;

    const orderDate = Date.now();

    let productObj = await Product.find(
        {
            _id: {
                $in: checkoutProducts,
            }
        },
    ).lean();

    if (!productObj.length) {
        return response.status(404).send({ Result: "Product Not Found" });
    }

    let userObj = await User.findOneAndUpdate({ _id: userID }, { address: address }, { new: true }).lean();

    let productCountMap = {};
    userObj.cart.forEach(product => {
        if (checkoutProducts.includes(product._id.toString())) {
            productCountMap[product._id.toString()] = product?.count;
        }
    });

    let amount = 0;
    for (let obj of productObj) {
        if (obj.stock < productCountMap[obj._id.toString()]) {
            return response.status(404).send({ Result: `${`${obj.name} -> ${obj.stock}`} are not in Stock` });
        }
        else if (obj.maxbuy < productCountMap[obj._id.toString()]) {
            return response.status(404).send({ Result: `${`${obj.name} -> ${obj.maxbuy}`} have maximum limit` });
        }
        else {
            amount += productCountMap[obj._id.toString()] * obj.price + obj.shipping;
            await Product.findOneAndUpdate({ _id: obj._id }, { $inc: { stock: -productCountMap[obj._id.toString()] } });
        }
    }

    checkoutProducts = Object.keys(productCountMap).map(id => ({
        _id: id,
        count: productCountMap[id]
    }));

    await CheckOut.create({
        customerID: userID,
        name: name,
        email: email,
        payment: payment,
        orderDate: orderDate,
        products: checkoutProducts,
        totalAmount: amount,
        address: address
    });

    return response.status(200).send({ Result: "Order Completed" });
}

async function productShowGetHandler(request, response) {
    const product_id = request.params.id;
    const product = await Product.findOne({ _id: product_id }).lean();
    if (!product) {
        return response.status(404).send({ Result: "Product not found" });
    }
    let categoryProducts = await Product.find({ category: product.category }).lean();
    categoryProducts = categoryProducts.filter(item => item._id != product_id);

    let allBuy = await CheckOut.find({'products._id':product_id}).lean(); // not working
    let frequentlyBuy = new Set();

    frequentlyBuy = allBuy.flatMap(item=>item.products); // get all checkout products
    
    frequentlyBuy = frequentlyBuy.flatMap(item=>item._id); // get id's of all checkout products

    frequentlyBuy = frequentlyBuy.filter(item=>item!=product_id); // removing main product

    frequentlyBuy = await Product.find({_id:{$in:frequentlyBuy}}); // getting all products
    
    return response.render('productPage', { userID:request.cookies.userID ,product, categoryProducts,frequentlyBuy });
}

async function buyProductGetHandller(request, response) {
    const userID = request.cookies?.userID;
    let product = await Product.findOne({ _id: request.params?.id }).lean();
    product.quantity = request.query.count;
    return response.render('buy', { product, userID });
}

async function buyProductPostHandller(request, response) {
    const userID = request.cookies?.userID;
    if (!userID) {
        return response.status(401).send({ Result: "Invalid User Credentials" });
    }

    const { name, email, address, payment, products } = request.body;
    const orderDate = Date.now();

    if (!request.body) {
        return response.status(400).json({ Result: "Invalid Product" })
    }
    let productObj = await Product.findOne(
        {
            _id: products._id,
        },
    ).lean();

    if (!productObj) {
        return response.status(404).send({ Result: "Product Not Found" });
    }
    let totalAmount = 0;
    if (productObj.stock < products.count) {
        return response.status(404).send({ Result: `${`${productObj.name} -> ${productObj.stock}`} are not in Stock` });
    }
    else if (productObj.maxbuy < products.count) {
        return response.status(404).send({ Result: `${`${productObj.name} -> ${productObj.maxbuy}`} have maximum limit` });
    }
    else {
        totalAmount += products.count * productObj.price + productObj.shipping;
        await Product.findOneAndUpdate({ _id: products._id }, { $inc: { stock: -products.count } });
    }

    await CheckOut.create({
        customerID: userID,
        name: name,
        email: email,
        payment: payment,
        orderDate: orderDate,
        products: [products],
        totalAmount: totalAmount,
        address: address
    });

    return response.status(200).json({ Result: "Order Completed" })
}

export { cartGetHandler, cartPostHandler, cartPatchHandler, checkoutPostHandler, checkoutGetHandler, productShowGetHandler, buyProductGetHandller, buyProductPostHandller };