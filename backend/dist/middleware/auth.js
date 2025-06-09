"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.admin = exports.protect = void 0;
const tokenService_1 = require("../services/tokenService");
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
const protect = async (req, res, next) => {
    let token;
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        try {
            token = req.headers.authorization.split(' ')[1];
            const decoded = (0, tokenService_1.verifyToken)(token);
            if (!decoded) {
                return res.status(401).json({ message: 'Not authorized, token failed' });
            }
            const user = await prisma.user.findUnique({
                where: { id: decoded.id },
            });
            if (!user) {
                return res.status(401).json({ message: 'User not found' });
            }
            req.user = user;
            next();
        }
        catch (error) {
            console.error(error);
            return res.status(401).json({ message: 'Not authorized, token failed' });
        }
    }
    if (!token) {
        return res.status(401).json({ message: 'Not authorized, no token' });
    }
};
exports.protect = protect;
const admin = (req, res, next) => {
    if (req.user && req.user.role === 'ADMIN') {
        next();
    }
    else {
        res.status(403).json({ message: 'Not authorized as an admin' });
    }
};
exports.admin = admin;
//# sourceMappingURL=auth.js.map