const express = require('express');
const router = express.Router();
const { getMetrics, predictMaintenance, predictChurn } = require('../services/analyticsService');
const marketDataService = require('../services/marketDataService');
const authMiddleware = require('../middleware/authMiddleware');
const exportService = require('../utils/exportService');
const fs = require('fs').promises;
const path = require('path');