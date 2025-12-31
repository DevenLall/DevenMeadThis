const mongoose = require("mongoose");
//const { encodePassword } = require("../../shared/password-utils");

const userSchema = new mongoose.Schema(
    {
        name: String,
        email: { type: String, required: true, unique: true },
        emailVerified: { type: Boolean, required: true, default: false },

        password: { type: String, required: true },

        role: {
            type: String,
            enum: ["admin", "user"],
            default: "user",
            required: true,
        },

        createdAt: { type: mongoose.Schema.Types.Date, default: Date.now() },
    },
    { versionKey: false }
);

userSchema.pre("save", async function () {
    if (this.isModified("password")) {
        this.password = encodePassword(this.password);
    }
});

const UserModel = mongoose.model("User", userSchema);

module.exports = UserModel;
