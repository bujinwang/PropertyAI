"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
class TransactionController {
    async getAllTransactions(req, res) {
        try {
            const transactions = await prisma.transaction.findMany();
            res.status(200).json(transactions);
        }
        catch (error) {
            res.status(500).json({ error: error.message });
        }
    }
    async createTransaction(req, res) {
        try {
            const transaction = await prisma.transaction.create({ data: req.body });
            res.status(201).json(transaction);
        }
        catch (error) {
            res.status(500).json({ error: error.message });
        }
    }
    async getTransactionById(req, res) {
        try {
            const transaction = await prisma.transaction.findUnique({
                where: { id: req.params.id },
            });
            if (transaction) {
                res.status(200).json(transaction);
            }
            else {
                res.status(404).json({ message: 'Transaction not found' });
            }
        }
        catch (error) {
            res.status(500).json({ error: error.message });
        }
    }
    async updateTransaction(req, res) {
        try {
            const transaction = await prisma.transaction.update({
                where: { id: req.params.id },
                data: req.body,
            });
            res.status(200).json(transaction);
        }
        catch (error) {
            res.status(500).json({ error: error.message });
        }
    }
    async deleteTransaction(req, res) {
        try {
            await prisma.transaction.delete({ where: { id: req.params.id } });
            res.status(204).send();
        }
        catch (error) {
            res.status(500).json({ error: error.message });
        }
    }
}
exports.default = new TransactionController();
//# sourceMappingURL=transactionController.js.map