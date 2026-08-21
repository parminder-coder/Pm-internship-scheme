const jwt = require("jsonwebtoken");

function auth (req, res, next) {
    try {
        let token = null;

        if (req.headers.cookie) {
            const cookies = req.headers.cookie.split(";").reduce((acc, cookie) => {
                const [key, ...v] = cookie.trim().split("=");
                acc[key] = v.join("=");
                return acc;
            }, {});
            if (cookies.token) {
                token = cookies.token;
            }
        }

        if (!token) {
            const authHeader = req.header("Authorization");
            if (authHeader) {
                token = authHeader.startsWith("Bearer ")
                    ? authHeader.slice(7)
                    : authHeader;
            }
        }

        if (!token) {
            return res.status(401).json({
                success: false,
                message: "Token Missing"
            });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        req.user = decoded;
        next();

    } catch (err) {
        return res.status(401).json({
            success: false,
            message: "Invalid Token"
        });
    }
}

module.exports = auth;