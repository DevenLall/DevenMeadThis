const { google } = require("googleapis");
// Import and configure the 'dotenv' package at the top of server.js to load environment variables.
const path = require("path");
console.log({ path: path.resolve(__dirname + "/../.env") });
console.log(process.env.TOKEN_SECRET);
console.log(process.env.GOOGLE_client_secret);

const CLIENT_ID = process.env.GOOGLE_client_id;
const CLIENT_SECRET = process.env.GOOGLE_client_secret;
const REFRESH_TOKEN = process.env.GOOGLE_REFRESH_TOKEN;
const SENDER_EMAIL = process.env.GOOGLE_SENDER_EMAIL;
const REDIRECT_URI = "http://localhost:3000/google/oauth/callback";

// MUST include redirect URI
const oAuth2Client = new google.auth.OAuth2(
    CLIENT_ID,
    CLIENT_SECRET,
    REDIRECT_URI
);

oAuth2Client.setCredentials({ refresh_token: REFRESH_TOKEN });

const gmail = google.gmail({ version: "v1", auth: oAuth2Client });

async function sendEmail(to, subject, message) {
    console.log("sending emaail to", to, CLIENT_ID);
    try {
        const rawEmail = [
            `From: ${SENDER_EMAIL}`,
            `To: ${to}`,
            `Subject: ${subject}`,
            "Content-Type: text/html; charset=UTF-8",
            "",
            `<p>${message}</p>`,
        ];

        const composedEmail = rawEmail.join("\n");

        const encodedEmail = Buffer.from(composedEmail)
            .toString("base64")
            .replace(/\+/g, "-")
            .replace(/\//g, "_")
            .replace(/=+$/, "");

        await gmail.users.messages.send({
            userId: "me",
            requestBody: { raw: encodedEmail },
        });

        return true;
    } catch (error) {
        console.error("Error sending email:", error.response?.data || error);
        return false;
    }
}

module.exports = sendEmail;
