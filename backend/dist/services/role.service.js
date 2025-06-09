"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getPermissions = exports.deleteRole = exports.updateRole = exports.createRole = exports.getRoles = void 0;
const database_1 = require("../config/database");
const getRoles = async () => {
    return database_1.prisma.role.findMany({
        include: { permissions: true },
    });
};
exports.getRoles = getRoles;
const createRole = async (data) => {
    return database_1.prisma.role.create({
        data: {
            name: data.name,
            permissions: {
                connect: data.permissions.map((id) => ({ id })),
            },
        },
    });
};
exports.createRole = createRole;
const updateRole = async (id, data) => {
    return database_1.prisma.role.update({
        where: { id },
        data,
    });
};
exports.updateRole = updateRole;
const deleteRole = async (id) => {
    return database_1.prisma.role.delete({
        where: { id },
    });
};
exports.deleteRole = deleteRole;
const getPermissions = async () => {
    return database_1.prisma.permission.findMany();
};
exports.getPermissions = getPermissions;
//# sourceMappingURL=role.service.js.map