import jwt from 'jsonwebtoken';
const secretKey = "$Parmeet$";

export function getUser(token) {
    // console.log(sessionMap);
    try{
    return jwt.verify(token,secretKey);
    }
    catch(e){
        return null;
    }
}

export function setUser(signUser) {
    return jwt.sign(
        {
            _id:signUser._id,
            email:signUser.email,
            role:signUser.role
        },secretKey);
    // console.log(sessionID,userID);
}