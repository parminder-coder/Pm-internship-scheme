const jwt = require("jsonwebtoken");

function auth (req, res, next) {
    try {
        const authHeader = req.header("Authorization");

        if (!authHeader) {
            return res.status(401).json({
                success: false,
                message: "Token Missing"
            });
        }
        
        const token = authHeader.startsWith("Bearer ") 
            ? authHeader.slice(7) 
            : authHeader;
        
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