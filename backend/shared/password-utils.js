const bcrypt = require("bcrypt");


// Function to encode a raw password
const encodePassword = (raw) => {
    try {
        const salt = bcrypt.genSaltSync(10);
        return bcrypt.hashSync(raw, salt);
    } catch (error) {
        console.log(error);
    }
};


//
const matchPassword = (raw, encoded) => {
    console.log("trying to match password", raw, encoded);
    try {
        return bcrypt.compareSync(raw, encoded);
    } catch (error) {
        console.log(error);
        return undefined;
    }
};

module.exports = { encodePassword, matchPassword };