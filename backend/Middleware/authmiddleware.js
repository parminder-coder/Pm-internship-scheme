const jwt = require("jsonwebtoken");

function auth(req, res, next) {
    try {
        let token = null;
        const authHeader = req.header("Authorization");

        if (authHeader) {
            token = authHeader.startsWith("Bearer ")
                ? authHeader.slice(7)
                : authHeader;
        } else if (req.cookies && req.cookies.token) {
            token = req.cookies.token;
        } else if (req.headers && req.headers.cookie) {
            const match = req.headers.cookie.match(/(?:^|;\s*)token=([^;]*)/);
            if (match) {
                token = decodeURIComponent(match[1]);
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