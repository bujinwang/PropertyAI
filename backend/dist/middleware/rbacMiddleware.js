"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.rbacMiddleware = void 0;
const rbacMiddleware = (roles) => {
    return (req, res, next) => {
        const user = req.user;
        if (user && roles.includes(user.role)) {
            next();
        }
        else {
            res.status(403).json({ message: 'Forbidden' });
        }
    };
};
exports.rbacMiddleware = rbacMiddleware;
//# sourceMappingURL=rbacMiddleware.js.map