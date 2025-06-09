import { prisma } from '../config/database';

export const getRoles = async () => {
  return prisma.role.findMany({
    include: { permissions: true },
  });
};

export const createRole = async (data: {
  name: string;
  permissions: string[];
}) => {
  return prisma.role.create({
    data: {
      name: data.name,
      permissions: {
        connect: data.permissions.map((id) => ({ id })),
      },
    },
  });
};

export const updateRole = async (id: string, data: any) => {
  return prisma.role.update({
    where: { id },
    data,
  });
};

export const deleteRole = async (id: string) => {
  return prisma.role.delete({
    where: { id },
  });
};

export const getPermissions = async () => {
  return prisma.permission.findMany();
};
