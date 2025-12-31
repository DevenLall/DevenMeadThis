const { decodeToken } = require("../jwt-utils");

const adminStrategy = (authData) => {
    const { role } = authData;
    return role && role === "admin";
};

const userStrategy = (authData) => {
    const isAdmin = adminStrategy(authData);
    if (isAdmin) return true;
    const { role } = authData;
    return role && role === "user";
};

const authStrategies = {
    admin: adminStrategy,
    user: userStrategy,
};

function authorize(requiredRoles = ["user"]) {
    function authorizeMiddleware(req, res, next) {
        try {
            const encoded = req.cookies["Authorization"];
            const decoded = decodeToken(encoded);

            if (!decoded || !decoded.role) {
                return res.status(401).json({
                    errorMessage:
                        "You don't have permission to access this resource",
                });
            }

            for (const role of requiredRoles) {
                if (authStrategies[role](decoded)) {
                    req.user = decoded;
                    req.user.id = decoded._id;
                    return next();
                }
            }

            return res.status(401).json({
                errorMessage:
                    "You don't have permission to access this resource",
            });
        } catch (error) {
            console.log(error);
            return res.status(401).json({
                errorMessage:
                    "You don't have permission to access this resource",
                action: "login",
            });
        }
    }
    return authorizeMiddleware;
}

module.exports = authorize;
