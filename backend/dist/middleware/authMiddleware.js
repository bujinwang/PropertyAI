"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authMiddleware = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const database_1 = require("../config/database");
exports.authMiddleware = {
    protect: async (req, res, next) => {
        let token;
        if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
            try {
                token = req.headers.authorization.split(' ')[1];
                const decoded = jsonwebtoken_1.default.verify(token, process.env.JWT_SECRET);
                if (!decoded) {
                    return res.status(401).json({ message: 'Not authorized, token failed' });
                }
                const user = await database_1.prisma.user.findUnique({
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
    },
    admin: (req, res, next) => {
        if (req.user && req.user.role === 'ADMIN') {
            next();
        }
        else {
            res.status(403).json({ message: 'Not authorized as an admin' });
        }
    },
    checkRole: (roles) => {
        return (req, res, next) => {
            if (!req.user) {
                return res.status(401).json({ message: 'Not authorized, no user' });
            }
            const userRole = req.user.role;
            if (roles.includes(userRole)) {
                next();
            }
            else {
                res.status(403).json({ message: `Not authorized, requires one of the following roles: ${roles.join(', ')}` });
            }
        };
    }
};
//# sourceMappingURL=authMiddleware.js.map