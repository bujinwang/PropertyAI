"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
class MaintenanceController {
    async getAllMaintenanceRequests(req, res) {
        try {
            const maintenanceRequests = await prisma.maintenanceRequest.findMany();
            res.status(200).json(maintenanceRequests);
        }
        catch (error) {
            res.status(500).json({ error: error.message });
        }
    }
    async createMaintenanceRequest(req, res) {
        try {
            const maintenanceRequest = await prisma.maintenanceRequest.create({
                data: req.body,
            });
            res.status(201).json(maintenanceRequest);
        }
        catch (error) {
            res.status(500).json({ error: error.message });
        }
    }
    async getMaintenanceRequestById(req, res) {
        try {
            const maintenanceRequest = await prisma.maintenanceRequest.findUnique({
                where: { id: req.params.id },
            });
            if (maintenanceRequest) {
                res.status(200).json(maintenanceRequest);
            }
            else {
                res.status(404).json({ message: 'Maintenance request not found' });
            }
        }
        catch (error) {
            res.status(500).json({ error: error.message });
        }
    }
    async updateMaintenanceRequest(req, res) {
        try {
            const maintenanceRequest = await prisma.maintenanceRequest.update({
                where: { id: req.params.id },
                data: req.body,
            });
            res.status(200).json(maintenanceRequest);
        }
        catch (error) {
            res.status(500).json({ error: error.message });
        }
    }
    async deleteMaintenanceRequest(req, res) {
        try {
            await prisma.maintenanceRequest.delete({
                where: { id: req.params.id },
            });
            res.status(204).send();
        }
        catch (error) {
            res.status(500).json({ error: error.message });
        }
    }
}
exports.default = new MaintenanceController();
//# sourceMappingURL=maintenanceController.js.map