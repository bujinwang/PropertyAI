"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteLanguage = exports.updateLanguage = exports.createLanguage = exports.getLanguages = void 0;
const database_1 = require("../config/database");
const getLanguages = async () => {
    return database_1.prisma.language.findMany();
};
exports.getLanguages = getLanguages;
const createLanguage = async (data) => {
    return database_1.prisma.language.create({
        data,
    });
};
exports.createLanguage = createLanguage;
const updateLanguage = async (id, data) => {
    return database_1.prisma.language.update({
        where: { id },
        data,
    });
};
exports.updateLanguage = updateLanguage;
const deleteLanguage = async (id) => {
    return database_1.prisma.language.delete({
        where: { id },
    });
};
exports.deleteLanguage = deleteLanguage;
//# sourceMappingURL=language.service.js.map