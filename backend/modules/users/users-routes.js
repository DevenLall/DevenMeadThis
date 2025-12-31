const { Router } = require("express");
const registerRules = require("./middlewares/register-rules");
const loginRules = require("./middlewares/login-rules");

const UserModel = require("./users-model");
const { matchPassword } = require("../../shared/password-utils");
const { encodeToken } = require("../../shared/jwt-utils");
const { randomNumberOfNDigits } = require("../../shared/compute-utils");
const authorize = require("../../shared/middlewares/authorize");
const verifyLoginRules = require("./middlewares/verify-login-rules");
const updateUserRules = require("./middlewares/update-user-rules");
const sendEmail = require("../../shared/email-utils");

const OTPModel = require("./otp-model");

const usersRoute = Router();

/**
 * Register Route
 */
usersRoute.post("/users/register", registerRules, async (req, res) => {
    try {
        const newUser = req.body;

        // 1. Check if user exists
        const existingUser = await UserModel.findOne({ email: newUser.email });
        if (existingUser) {
            return res.status(409).json({
                errorMessage: `User with ${newUser.email} already exists`,
            });
        }

        // 2. Create user
        const addedUser = await UserModel.create(newUser);
        if (!addedUser) {
            return res.status(500).json({
                errorMessage: `Oops! User couldn't be added!`,
            });
        }

        // 3. Generate OTP
        const otp = randomNumberOfNDigits(6);
        await OTPModel.create({ email: newUser.email, otp });

        // 4. Send OTP email
        await sendEmail(
            newUser.email,
            "Your OutSource Registration OTP",
            `Hello! Your One Time Password is: ${otp}`
        );

        // 5. Return user without password
        const user = { ...addedUser.toJSON(), password: undefined };
        res.json({ user, message: "User created. OTP sent to email." });
    } catch (err) {
        console.error("Register error:", err); // Logs the exact reason for 500
        res.status(500).json({ errorMessage: "Internal Server Error" });
    }
});

/**
 * Login Route
 */
usersRoute.post("/users/login", loginRules, async (req, res) => {
    const { email, password } = req.body;
    const foundUser = await UserModel.findOne({ email }).lean();
    if (!foundUser) {
        return res.status(404).send({
            errorMessage: `User with ${email} doesn't exist`,
        });
    }
    const passwordMatched = matchPassword(password, foundUser.password);
    if (!passwordMatched) {
        return res.status(401).send({
            errorMessage: `Email and password didn't matched`,
        });
    }

    // login successful and email is verified
    if (foundUser.emailVerified) {
        // generate access token
        const token = encodeToken(foundUser);
        res.cookie("Authorization", "Bearer " + token, {
            httpOnly: true,
            secure: true,
            sameSite: "none",
            path: "/",
        });
        return res.json({ user: foundUser, token });
    }

    // email not verified, check if they have otp generated
    const foundOtp = await OTPModel.findOne({ email });

    if (foundOtp) {
        return res.status(200).send("Email already sent");
    }

    // no otp, generate one
    const otp = randomNumberOfNDigits(6);

    try {
        await OTPModel.create({
            email,
            otp,
        });

        await sendEmail(
            email,
            "OutSource Login OTP",
            "Hello! Your One Time Password to login is: " + otp
        );
        return res.status(200).send("Email sent");
    } catch (e) {
        console.error("Error while sending email: " + e);
        return res.status(500).send("Error while sending email");
    }
});

usersRoute.post("/users/logout", async (req, res) => {
    res.clearCookie("Authorization");
    res.json({ success: true });
});

/**
 * Verify Login Route
 */
usersRoute.post("/users/verify-login", verifyLoginRules, async (req, res) => {
    const { email, otp } = req.body;

    const foundOtp = await OTPModel.findOne({ email, otp });

    if (!foundOtp) {
        return res.status(401).send({
            errorMessage: `Verification failed`,
        });
    }

    // Use lean to turn model into plain object for storage in JWT
    // without it, it complains about needing a plain object
    const user = await UserModel.findOne({ email }).lean();
    console.log("USER", user);

    await UserModel.findByIdAndUpdate(user._id, {
        emailVerified: true,
    });

    // generate access token
    const token = encodeToken(user);
    res.cookie("Authorization", "Bearer " + token, {
        httpOnly: true,
        secure: true,
        sameSite: "none",
        path: "/",
    });
    res.json({ user, token });
});

/**
 * Get all users Route
 */
usersRoute.get("/users", authorize(["admin"]), async (req, res) => {
    const allUsers = await UserModel.find().select("-password");
    if (!allUsers) res.send([]);
    res.json(allUsers);
});

/**
 * Get logged in user details
 */
usersRoute.get("/users/me", authorize(["admin", "user"]), async (req, res) => {
    const userId = req.user.id;
    console.log("me id:", userId, req.cookies);

    const foundUser = await UserModel.findById(userId);
    if (!foundUser) {
        return res
            .status(404)
            .json({ errorMessage: "Unable to get account details" });
    }
    res.json(foundUser);
});

/**
 * Get user by id Route
 */
usersRoute.get("/users/:id", authorize(["admin", "user"]), async (req, res) => {
    const userID = req.params.id;
    const isAdmin = req.user.role === "admin";

    // If not admin, don't allow to access others account
    if (!isAdmin && userID !== req.user.id) {
        return res.status(401).send({
            errorMessage: `You cannot access other user's information`,
        });
    }

    const foundUser = await UserModel.findById(userID);
    if (!foundUser) {
        return res
            .status(404)
            .json({ errorMessage: `User with ${userID} doesn't exist` });
    }
    res.json(foundUser);
});

/**
 * Update user Route
 */
usersRoute.put(
    "/users/:id",
    [updateUserRules, authorize(["admin", "user"])],
    async (req, res) => {
        const userID = req.params.id;
        const isAdmin = req.user.role === "admin";

        // If not admin, don't allow to update others account
        if (!isAdmin && req.params.id !== req.user.id) {
            return res.status(401).json({
                errorMessage:
                    "You don't have permission to update other user's accounts.",
            });
        }

        const newUser = req.body;
        if (!newUser) {
            return res.status(421).json({ errorMessage: "Nothing to update" });
        }

        // Only allow admin to change the roles
        if (!isAdmin && newUser.roles) {
            return res.status(401).json({
                errorMessage:
                    "You don't have permission to update your role. Please contact the support team for the assistance!",
            });
        }

        const foundUser = await UserModel.findById(userID);
        if (!foundUser) {
            return res
                .status(404)
                .send({ errorMessage: `User with ${userID} doesn't exist` });
        }

        const updatedUser = await UserModel.findByIdAndUpdate(
            userID,
            {
                $set: newUser,
            },
            { new: true }
        ).select("-password");

        if (!updatedUser) {
            return res
                .status(500)
                .send({ errorMessage: `Oops! User couldn't be updated!` });
        }
        res.json(updatedUser);
    }
);

/**
 * Delete user Route
 */
usersRoute.delete("/users/:id", authorize(["admin"]), async (req, res) => {
    const userID = req.params.id;
    const foundUser = await UserModel.findById(userID);

    if (!foundUser) {
        return res
            .status(404)
            .send({ errorMessage: `User with ${userID} doesn't exist` });
    }

    const deletedUser =
        await UserModel.findByIdAndDelete(userID).select("-password");

    if (!deletedUser) {
        return res
            .status(500)
            .send({ errorMessage: `Oops! User couldn't be deleted!` });
    }

    res.json(deletedUser);
});

module.exports = { usersRoute };
