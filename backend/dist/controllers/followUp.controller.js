"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getFollowUps = exports.scheduleFollowUp = void 0;
const followUp_service_1 = require("../services/followUp.service");
const scheduleFollowUp = async (req, res) => {
    try {
        const { messageId, followUpAt } = req.body;
        const followUp = await followUp_service_1.followUpService.scheduleFollowUp(messageId, followUpAt);
        res.status(201).json(followUp);
    }
    catch (error) {
        res.status(500).json({ message: error.message });
    }
};
exports.scheduleFollowUp = scheduleFollowUp;
const getFollowUps = async (req, res) => {
    try {
        const followUps = await followUp_service_1.followUpService.getFollowUps();
        res.status(200).json(followUps);
    }
    catch (error) {
        res.status(500).json({ message: error.message });
    }
};
exports.getFollowUps = getFollowUps;
//# sourceMappingURL=followUp.controller.js.map