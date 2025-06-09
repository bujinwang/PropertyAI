"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const morgan_1 = __importDefault(require("morgan"));
const client_1 = require("@prisma/client");
const dotenv_1 = __importDefault(require("dotenv"));
// Load environment variables
dotenv_1.default.config();
// Import routes
const authRoutes_1 = __importDefault(require("./routes/authRoutes"));
const userRoutes_1 = __importDefault(require("./routes/userRoutes"));
const propertyRoutes_1 = __importDefault(require("./routes/propertyRoutes"));
const listingRoutes_1 = __importDefault(require("./routes/listingRoutes"));
const maintenanceRoutes_1 = __importDefault(require("./routes/maintenanceRoutes"));
const aiContentRoutes_1 = __importDefault(require("./routes/aiContentRoutes"));
const modelTraining_routes_1 = __importDefault(require("./routes/modelTraining.routes"));
const dataPreprocessing_routes_1 = __importDefault(require("./routes/dataPreprocessing.routes"));
const modelRegistry_routes_1 = __importDefault(require("./routes/modelRegistry.routes"));
// Initialize Prisma client
const prisma = new client_1.PrismaClient();
// Initialize Express app
const app = (0, express_1.default)();
// Middleware
app.use((0, helmet_1.default)()); // Security headers
app.use((0, cors_1.default)()); // Enable CORS
app.use(express_1.default.json()); // Parse JSON bodies
app.use(express_1.default.urlencoded({ extended: true })); // Parse URL-encoded bodies
app.use((0, morgan_1.default)('dev')); // Logging
// API routes
app.use('/api/auth', authRoutes_1.default);
app.use('/api/users', userRoutes_1.default);
app.use('/api/properties', propertyRoutes_1.default);
app.use('/api/listings', listingRoutes_1.default);
app.use('/api/maintenance', maintenanceRoutes_1.default);
app.use('/api/ai-content', aiContentRoutes_1.default);
app.use('/api/model-training', modelTraining_routes_1.default);
app.use('/api/data-preprocessing', dataPreprocessing_routes_1.default);
app.use('/api/model-registry', modelRegistry_routes_1.default);
// Health check endpoint
app.get('/health', (req, res) => {
    res.status(200).json({ status: 'ok', message: 'Server is running' });
});
// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({
        status: 'error',
        message: 'Internal server error',
    });
});
// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
    console.error('Unhandled Promise Rejection:', err);
    // Close server & exit process
    // server.close(() => process.exit(1));
});
exports.default = app;
//# sourceMappingURL=app.js.map