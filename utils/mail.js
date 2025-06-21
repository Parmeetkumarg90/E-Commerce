import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 465,
    secure: true, // true for 465, false for other ports
    auth: {
        user: "forunimportant99@gmail.com", // your Gmail address
        pass: "evdkirpgyvmssask", // your Gmail password or app password
    },
});

async function sendMail(name, from, to, subject, text, html) {
    await transporter
        .sendMail({
            from: `${name} ${from}`,
            to: `${to}`, // recipient's email address
            subject: `${subject}`,
            text: `${text}`,
            html: `${html}`
        })
        .then((info) => {
            console.log("Message sent: ", info.messageId);
            // Preview the sent message in the console
            console.log("Preview URL: ", nodemailer.getTestMessageUrl(info));
        })
        .catch(console.error);
}

export default sendMail;