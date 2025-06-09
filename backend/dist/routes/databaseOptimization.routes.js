"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const databaseOptimization_controller_1 = require("../controllers/databaseOptimization.controller");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
/**
 * @swagger
 * /api/v1/database/slow-queries:
 *   get:
 *     summary: Analyze and retrieve slow PostgreSQL queries
 *     tags: [Database Optimization]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Successfully retrieved and analyzed slow queries.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *       401:
 *         description: Unauthorized, token is missing or invalid
 *       403:
 *         description: Forbidden, user does not have admin rights
 *       500:
 *         description: Internal server error
 */
router.get('/slow-queries', auth_1.protect, auth_1.admin, databaseOptimization_controller_1.analyzeSlowQueries);
exports.default = router;
//# sourceMappingURL=databaseOptimization.routes.js.map