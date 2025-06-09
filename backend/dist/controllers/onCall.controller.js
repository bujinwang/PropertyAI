"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteOnCallRotation = exports.updateOnCallRotation = exports.createOnCallRotation = exports.deleteOnCallSchedule = exports.updateOnCallSchedule = exports.createOnCallSchedule = exports.getOnCallSchedulesByPropertyId = void 0;
const onCallService = __importStar(require("../services/onCall.service"));
const getOnCallSchedulesByPropertyId = async (req, res) => {
    try {
        const { propertyId } = req.params;
        const onCallSchedules = await onCallService.getOnCallSchedulesByPropertyId(propertyId);
        res.status(200).json(onCallSchedules);
    }
    catch (error) {
        res.status(500).json({ message: error.message });
    }
};
exports.getOnCallSchedulesByPropertyId = getOnCallSchedulesByPropertyId;
const createOnCallSchedule = async (req, res) => {
    try {
        const onCallSchedule = await onCallService.createOnCallSchedule(req.body);
        res.status(201).json(onCallSchedule);
    }
    catch (error) {
        res.status(500).json({ message: error.message });
    }
};
exports.createOnCallSchedule = createOnCallSchedule;
const updateOnCallSchedule = async (req, res) => {
    try {
        const { id } = req.params;
        const onCallSchedule = await onCallService.updateOnCallSchedule(id, req.body);
        res.status(200).json(onCallSchedule);
    }
    catch (error) {
        res.status(500).json({ message: error.message });
    }
};
exports.updateOnCallSchedule = updateOnCallSchedule;
const deleteOnCallSchedule = async (req, res) => {
    try {
        const { id } = req.params;
        await onCallService.deleteOnCallSchedule(id);
        res.status(204).send();
    }
    catch (error) {
        res.status(500).json({ message: error.message });
    }
};
exports.deleteOnCallSchedule = deleteOnCallSchedule;
const createOnCallRotation = async (req, res) => {
    try {
        const onCallRotation = await onCallService.createOnCallRotation(req.body);
        res.status(201).json(onCallRotation);
    }
    catch (error) {
        res.status(500).json({ message: error.message });
    }
};
exports.createOnCallRotation = createOnCallRotation;
const updateOnCallRotation = async (req, res) => {
    try {
        const { id } = req.params;
        const onCallRotation = await onCallService.updateOnCallRotation(id, req.body);
        res.status(200).json(onCallRotation);
    }
    catch (error) {
        res.status(500).json({ message: error.message });
    }
};
exports.updateOnCallRotation = updateOnCallRotation;
const deleteOnCallRotation = async (req, res) => {
    try {
        const { id } = req.params;
        await onCallService.deleteOnCallRotation(id);
        res.status(204).send();
    }
    catch (error) {
        res.status(500).json({ message: error.message });
    }
};
exports.deleteOnCallRotation = deleteOnCallRotation;
//# sourceMappingURL=onCall.controller.js.map