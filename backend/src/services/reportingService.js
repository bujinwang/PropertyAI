const { PrismaClient, Prisma } = require('@prisma/client');
const fs = require('fs').promises;
const path = require('path');

const prisma = new PrismaClient();
const { getMetrics, getAdvancedMetrics, predictMaintenance, predictChurn } = require('./analyticsService');
const riskAssessmentService = require('./riskAssessmentService');
const marketDataService = require('../services/marketDataService');
const notificationService = require('./notificationService');
const auditService = require('./auditService');