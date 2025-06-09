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
exports.deleteLanguage = exports.updateLanguage = exports.createLanguage = exports.getLanguages = void 0;
const languageService = __importStar(require("../services/language.service"));
const getLanguages = async (req, res) => {
    try {
        const languages = await languageService.getLanguages();
        res.status(200).json(languages);
    }
    catch (error) {
        res.status(500).json({ message: error.message });
    }
};
exports.getLanguages = getLanguages;
const createLanguage = async (req, res) => {
    try {
        const language = await languageService.createLanguage(req.body);
        res.status(201).json(language);
    }
    catch (error) {
        res.status(500).json({ message: error.message });
    }
};
exports.createLanguage = createLanguage;
const updateLanguage = async (req, res) => {
    try {
        const { id } = req.params;
        const language = await languageService.updateLanguage(id, req.body);
        res.status(200).json(language);
    }
    catch (error) {
        res.status(500).json({ message: error.message });
    }
};
exports.updateLanguage = updateLanguage;
const deleteLanguage = async (req, res) => {
    try {
        const { id } = req.params;
        await languageService.deleteLanguage(id);
        res.status(204).send();
    }
    catch (error) {
        res.status(500).json({ message: error.message });
    }
};
exports.deleteLanguage = deleteLanguage;
//# sourceMappingURL=language.controller.js.map