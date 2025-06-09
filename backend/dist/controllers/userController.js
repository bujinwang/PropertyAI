"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const dbManager_1 = require("../utils/dbManager");
class UserController {
    async getAllUsers(req, res) {
        try {
            const users = await dbManager_1.prisma.user.findMany();
            res.status(200).json(users);
        }
        catch (error) {
            res.status(500).json({ error: error.message });
        }
    }
    async createUser(req, res) {
        try {
            const user = await dbManager_1.prisma.user.create({ data: req.body });
            res.status(201).json(user);
        }
        catch (error) {
            res.status(500).json({ error: error.message });
        }
    }
    async getUserById(req, res) {
        try {
            const user = await dbManager_1.prisma.user.findUnique({
                where: { id: req.params.id },
            });
            if (user) {
                res.status(200).json(user);
            }
            else {
                res.status(404).json({ message: 'User not found' });
            }
        }
        catch (error) {
            res.status(500).json({ error: error.message });
        }
    }
    async updateUser(req, res) {
        try {
            const user = await dbManager_1.prisma.user.update({
                where: { id: req.params.id },
                data: req.body,
            });
            res.status(200).json(user);
        }
        catch (error) {
            res.status(500).json({ error: error.message });
        }
    }
    async deleteUser(req, res) {
        try {
            await dbManager_1.prisma.user.delete({ where: { id: req.params.id } });
            res.status(204).send();
        }
        catch (error) {
            res.status(500).json({ error: error.message });
        }
    }
}
exports.default = new UserController();
//# sourceMappingURL=userController.js.map