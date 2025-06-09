"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
class LeaseController {
    async getAllLeases(req, res) {
        try {
            const leases = await prisma.lease.findMany();
            res.status(200).json(leases);
        }
        catch (error) {
            res.status(500).json({ error: error.message });
        }
    }
    async createLease(req, res) {
        try {
            const lease = await prisma.lease.create({ data: req.body });
            res.status(201).json(lease);
        }
        catch (error) {
            res.status(500).json({ error: error.message });
        }
    }
    async getLeaseById(req, res) {
        try {
            const lease = await prisma.lease.findUnique({
                where: { id: req.params.id },
            });
            if (lease) {
                res.status(200).json(lease);
            }
            else {
                res.status(404).json({ message: 'Lease not found' });
            }
        }
        catch (error) {
            res.status(500).json({ error: error.message });
        }
    }
    async updateLease(req, res) {
        try {
            const lease = await prisma.lease.update({
                where: { id: req.params.id },
                data: req.body,
            });
            res.status(200).json(lease);
        }
        catch (error) {
            res.status(500).json({ error: error.message });
        }
    }
    async deleteLease(req, res) {
        try {
            await prisma.lease.delete({ where: { id: req.params.id } });
            res.status(204).send();
        }
        catch (error) {
            res.status(500).json({ error: error.message });
        }
    }
}
exports.default = new LeaseController();
//# sourceMappingURL=leaseController.js.map