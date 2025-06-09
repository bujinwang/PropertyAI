import { prisma } from '../config/database';

export const getLanguages = async () => {
  return prisma.language.findMany();
};

export const createLanguage = async (data: {
  code: string;
  name: string;
}) => {
  return prisma.language.create({
    data,
  });
};

export const updateLanguage = async (id: string, data: any) => {
  return prisma.language.update({
    where: { id },
    data,
  });
};

export const deleteLanguage = async (id: string) => {
  return prisma.language.delete({
    where: { id },
  });
};
