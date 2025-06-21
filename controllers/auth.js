import User from '../models/users.js';
import { setUser } from '../utils/service.js';

export function loginGetHandler(request, response) {
    return response.render('login', { errorCreated: "" });
}
export function signupGetHandler(request, response) {
    return response.render('signup');
}

export async function loginPostHandler(request, response) {
    const email = (String(request.body.email)).toLowerCase();
    const password = (String(request.body.password)).toLowerCase();
    const role = String(request.body.role);    
    const signUser = await findUser(email,password,role);
    if (!signUser) {
        return response.render('login', { errorCreated: `${role} Doesn't Exists` });
    }
    const token = setUser(signUser);  // getting token
    response.cookie("uid",token);   // client side storing token
    response.cookie('role',signUser?.role);
    response.cookie('userID',String(signUser?._id));
        
    if(role === 'User'){
        return response.redirect('/customer');
    }
    return response.redirect('/seller');
}

export async function signupPostHandler(request, response) {
    const email = (String(request.body.email)).toLowerCase();
    const password = (String(request.body.password)).toLowerCase();
    const role = String(request.body.role);    
    const signUser = await findUser(email,password,role).lean();
    if (signUser) {
        return response.render('login', { errorCreated: "User Already Exists" });
    }
    await User.create({
        email:email,
        password:password,
        role:role
    });
    return response.redirect('/auth/login');
}

async function findUser(email,password,role){
    const result = await User.findOne({
        email:email,
        password:password,
        role:role
    }).lean();
    // console.log(result);
    return result;
}