require("dotenv").config();

const express = require("express");
const cors = require("cors");
const connectDB = require("./shared/middlewares/connect-db");

const { oauthRoutes } = require("./modules/auth/GoogAuth-routes");
const { usersRoute } = require("./modules/users/users-routes");

const port = 3000;
const hostname = "localhost";
const server = express();

const app = express();

app.use(express.json());
app.use(cors());

// Add the connectDB middleware in application-level, before defining routes.
server.use(connectDB);

// Mount all the routes
server.use(usersRoute);
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
