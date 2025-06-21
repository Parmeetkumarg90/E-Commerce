import fs from 'fs/promises';
import fsSync from 'fs';
import Product from '../models/products.js';
import Chat from '../models/complain.js';
import User from '../models/users.js';

async function productsGetHandler(request, response) { // view all
    const sellerID = request.cookies?.userID;
    const productFile = await Product.find({ sellerID: sellerID }).lean();
    let complains = await Chat.find({ sellerID: sellerID }).lean();
    complains = complains.filter(complain => complain.resolve != true);
    for (let complain of complains) {
        complain.productName = (await Product.findOne({ _id: complain.productID }).lean()).name;
        complain.userEmail = (await User.findOne({ _id: complain.userID }).lean()).email;
    }

    return response.render('sellerHome', { errorCreated: "", productFile: productFile, complains });
}

async function productPostHandler(request, response) { // upload 
    const file = request.files;
    const data = request.body;
    const sellerID = request.cookies?.userID;
    if (!file || !data) {
        return response.redirect('/seller');
    }
    const extra_images = file.eimage.map(item => item.filename);
    const shipping = Number(data.price) < 500 ? 50 : 0;
    await Product.create({
        imageSrc: file.image[0].filename,
        sideImages: extra_images || [],
        description: data.description,
        name: data.name,
        sellerID: sellerID,
        price: Number(data.price),
        shipping: shipping,
        category: data.category,
        stock: data.stock,
        maxbuy: data.maxbuy
    });
    return response.redirect('/seller');
}

async function productDeleteHandler(request, response) { // delete
    const { _id } = request.body;

    const productObj = await Product.findOne({ _id: _id }).lean();
    await Product.deleteOne({ _id: _id });

    await fs.unlink(`./uploads/${productObj.imageSrc}`);

    for (let image in productObj.sideImages) {
        await fs.unlink(`./uploads/${productObj.sideImages[image]}`);
    }
    return response.send({ result: "Deleted successfully" });
}

async function productPatchHandler(request, response) { // update
    try {
        const sellerID = request.cookies?.userID;
        const { name, description, price, _id, category, stock, maxbuy } = request.body;
        const file = request.files;
        const updateFields = {};

        const productObj = await Product.findOne({ _id: _id }).lean();

        if (file?.image?.[0] && fsSync.existsSync(`./uploads/${productObj.imageSrc}`)) {
            updateFields.imageSrc = file.image[0].filename;
            await fs.unlink(`./uploads/${productObj.imageSrc}`);
        }
        if (file?.eimage?.[0].length > 0) {
            updateFields.sideImages = file?.eimage.map(item => item.filename);
            if (productObj?.sideImages) {
                for (let image of productObj?.sideImages) {
                    await fs.unlink(`./uploads/${image}`);
                }
            }
        }

        if (name || description || file || Number(price) || maxbuy || stock || updateFields) {

            if (description) updateFields.description = description;
            if (name) updateFields.name = name;
            if (category) updateFields.category = category;
            if (Number(price)) updateFields.price = Number(price);
            if (Number(stock)) updateFields.stock = Number(stock);
            if (Number(maxbuy)) updateFields.maxbuy = Number(maxbuy);
            updateFields.shipping = (Number(price) || Number(productObj.price)) < 500 ? 50 : 0;

            await Product.findOneAndUpdate(
                {
                    _id: _id,
                    sellerID: sellerID,
                },
                updateFields
            );
        }
        return response.send({ result: "Edit successfully" });
    }
    catch (e) {
        console.log(e);
        return response.status(500).send({ error: "Internal server error" });
    }
}

export { productsGetHandler, productPostHandler, productDeleteHandler, productPatchHandler };