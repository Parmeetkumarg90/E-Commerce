// authentication using session login,signup,home
import http from 'http';
import express from 'express';
import homeRouter from "./routes/home.js";
import authRoute from "./routes/auth.js";
import { afterLogin } from './middleware/user.js';
import cookieParser from 'cookie-parser';
import connectDB from './connection.js';
import { dirname } from 'path';
import { fileURLToPath } from 'url';
import { Server } from 'socket.io';
import Chat from './models/complain.js';
import Product from './models/products.js';
import User from './models/users.js';
import cookie from "cookie";
import { getUser } from './utils/service.js';

const __dirname = dirname(fileURLToPath(import.meta.url)); // find our path from of our project the operating system

const app = express();
const httpServer = http.createServer(app);

app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(express.json());
// app.use(express.static('uploads')); // add / before image name
app.use('/uploads', express.static('uploads')); //add /uploads/ before image name(used for specifying different route for static)

connectDB("mongodb://localhost:27017/ecommerce")

const onlineUsers = new Map(); // store all online users
let currentUser;
const io = new Server(httpServer, {
    connectionStateRecovery: {
        maxDisconnectionDuration: 10 * 1000, // 10seconds
    },
});

// // socket middleware
// io.use((socket,next)=>{
//     // console.log(socket.handshake.query);
//     const { userID,sellerID,role } = socket.handshake.query;
//     const token = cookie.parse(socket.handshake.headers.cookie || '').uid; // getting JWT token
//     const user = getUser(token);
//     if(user._id.toString() === userID.toString()){
//         if(role !== 'customer'){
//             return next(new Error('Unauthorized: user is not a customer'));
//         }
//     }
//     if(user._id.toString() === sellerID.toString()){
//         if(role !== 'seller'){
//             return next(new Error('Unauthorized: user is not a seller'));
//         }
//     }
    
//     next();
// });

// socket connection with all events
io.on('connection', (socket) => {
    socket.on('eachConnect', async (productID, userID, sellerID, role) => {
        try {
            
            const seller = await User.findOne({ _id: sellerID }).lean(); // find seller
            const user = await User.findOne({ _id: userID }).lean(); // find user 
            
            let allChats;
            if (role === 'customer') {
                currentUser = userID;
                onlineUsers.set(userID, socket.id);
                allChats = await Chat.findOneAndUpdate( // update socket id in ChatDB
                    { userID: user._id, sellerID: seller._id, productID: productID },
                    { userSocketID: socket.id, sellerSocketID: seller.socketID,resolve:false },
                    { upsert: true }
                ).lean();
                await User.findOneAndUpdate({ _id: userID }, { socketID: socket.id }).lean();
                socket.emit("status", { online: onlineUsers.has(sellerID) });
            }
            else {
                currentUser = sellerID;
                onlineUsers.set(sellerID, socket.id);
                allChats = await Chat.findOneAndUpdate( // update socket id in ChatDB
                    { userID: user._id, sellerID: seller._id, productID: productID },
                    { userSocketID: user.socketID, sellerSocketID: socket.id,resolve:false },
                    { upsert: true }
                ).lean();
                await User.findOneAndUpdate({ _id: sellerID }, { socketID: socket.id }).lean();
                socket.emit("status", { online: onlineUsers.has(userID) });
            }
            socket.emit("allChats", allChats.messages || []);
        }
        catch (error) {
            console.log("Socket Error: Error while connecting Customer and Seller", error);
        }
    });

    socket.on('client_messages', async (productID, userID, sellerID, role, message) => {
        try {
            const product = await Product.findOne({ _id: productID }).lean(); // find product

            const seller = await User.findOne({ _id: sellerID }).lean(); // find seller
            const user = await User.findOneAndUpdate({ _id: userID }).lean(); // find user

            const email = role === 'seller' ? seller.email : user.email;
            message = `${email}: ${message}`;

            await Chat.findOneAndUpdate(
                { userID: user._id, sellerID: seller._id, productID: product._id },
                {
                    date: Date.now(), $push: {
                        messages: message
                    }
                },
            );
            message = [message];
            if(role==='seller'){
                io.to(user.socketID).emit('allChats',message);
            }
            else{
                io.to(seller.socketID).emit('allChats',message);
            }
        }
        catch (error) {
            console.log("Error while sending message", error);
        }
    });

    socket.on('resolve', async (productID, userID, sellerID,role) => {
        try {
            const allChats = await Chat.findOneAndUpdate(
                { userID: userID, sellerID: sellerID, productID: productID },
                { resolve: true }
            ).lean();
            role === 'seller' ? io.to(allChats.userSocketID).emit('allChats',[`<b align="center">Problem is considered as Resolved By ${role}</b>`]) : io.to(allChats.sellerSocketID).emit('allChats',[`<b align="center">Problem is considered as Resolved By ${role}</b>`]);
        }
        catch {
            console.log('Error in resolving client help');
        }
    });

    socket.on("disconnect", () => {
        for (const [id, sockId] of onlineUsers) {
            if (sockId === socket.id) {
                onlineUsers.delete(id);
                break;
            }
        }        
    });
});

app.set('view engine', 'ejs');
app.set("views", "./views");

app.get('/favicon.ico', (request, response) => response.status(204).end());
app.use('/auth', afterLogin, authRoute);
app.use('/', homeRouter);

httpServer.listen(8000, () => {
    console.log("Server Started Successfully");
});

export default __dirname;