require("dotenv").config();

const { oauthRoutes } = require("./modules/auth/GoogAuth-routes");

const express = require("express");
const port = 3000;
const hostname = "localhost";
const server = express();

const app = express();

app.use(express.json());

server.use(oauthRoutes);

server.use((error, req, res, next) => {
    console.log(error);
    res.status(500).send("Oops! Internal server error!");
});

server.use((req, res, next) => {
    res.status(404).send(`404! ${req.method} ${req.path} Not Found.`);
});

server.listen(port, hostname, (error) => {
    if (error) console.log(error.message);
    else console.log(`Server running on http://${hostname}:${port}`);
});
