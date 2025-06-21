import express from 'express';
import { upload, checkSeller, checkAuth } from '../middleware/user.js';
import { customerGetHandler, customerPostHandler, logoutHandler,customerHelpGetHandler,customerHelpPostHandler, apiPostProductHandler } from '../controllers/customer.js';
import { productsGetHandler, productPostHandler, productDeleteHandler, productPatchHandler } from '../controllers/seller.js';
import { cartGetHandler, cartPostHandler,cartPatchHandler, checkoutPostHandler, checkoutGetHandler, productShowGetHandler, buyProductGetHandller, buyProductPostHandller } from '../controllers/cart.js';

const homeRouter = express.Router();

homeRouter.route('/')
    .get(customerGetHandler)

homeRouter.route('/help/:productID')
    .all(checkAuth)
    .get(customerHelpGetHandler) // render help page
    // .post(customerHelpPostHandler) // help(api)

homeRouter.route('/customer')
    .get(customerGetHandler) // send product page to customer
    .post(customerPostHandler) // receive product details and add to cart(api)
    .delete(logoutHandler) // logout user(api)

homeRouter.route('/seller')
    .all(checkSeller, checkAuth)
    .get(productsGetHandler) // send all seller's product
    .post(upload.fields([{ name: 'image', maxCount: 1 }, { name: 'eimage', maxCount: 5 }]), productPostHandler) // receive product details and store it
    .delete(productDeleteHandler) // delete seller's product(api)
    .patch(upload.fields([{ name: 'image', maxCount: 1 }, { name: 'eimage', maxCount: 5 }]), productPatchHandler) // update some details of product(api)

homeRouter.route('/customer/cart')
    .get(cartGetHandler) // render cart page
    .post(cartPostHandler) // send all cart products(api)
    .patch(cartPatchHandler) // remove the products from the cart(api)

homeRouter.route('/customer/cart/checkout/', checkAuth)
    .get(checkoutGetHandler)
    .post(checkoutPostHandler) // checkout all products (api)

homeRouter.route('/api/customers/products')
    .post(apiPostProductHandler) // send only limited products(api)

homeRouter.route('/customer/product/:id')
    .get(productShowGetHandler) // show specific product details

homeRouter.route('/customer/buy/:id')
    .all(checkAuth)
    .get(buyProductGetHandller) // show buy specific product page
    .post(buyProductPostHandller) // buy specific product(api)

export default homeRouter;