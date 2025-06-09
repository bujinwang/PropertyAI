"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
class ApplicationController {
    async getAllApplications(req, res) {
        try {
            const applications = await prisma.application.findMany();
            res.status(200).json(applications);
        }
        catch (error) {
            res.status(500).json({ error: error.message });
        }
    }
    async createApplication(req, res) {
        try {
            const application = await prisma.application.create({ data: req.body });
            res.status(201).json(application);
        }
        catch (error) {
            res.status(500).json({ error: error.message });
        }
    }
    async getApplicationById(req, res) {
        try {
            const application = await prisma.application.findUnique({
                where: { id: req.params.id },
            });
            if (application) {
                res.status(200).json(application);
            }
            else {
                res.status(404).json({ message: 'Application not found' });
            }
        }
        catch (error) {
            res.status(500).json({ error: error.message });
        }
    }
    async updateApplication(req, res) {
        try {
            const application = await prisma.application.update({
                where: { id: req.params.id },
                data: req.body,
            });
            res.status(200).json(application);
        }
        catch (error) {
            res.status(500).json({ error: error.message });
        }
    }
    async deleteApplication(req, res) {
        try {
            await prisma.application.delete({ where: { id: req.params.id } });
            res.status(204).send();
        }
        catch (error) {
            res.status(500).json({ error: error.message });
        }
    }
}
exports.default = new ApplicationController();
//# sourceMappingURL=applicationController.js.map