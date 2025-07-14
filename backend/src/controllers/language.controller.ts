import { Request, Response } from 'express';
import * as languageService from '../services/language.service';

export const getLanguages = async (req: Request, res: Response) => {
  try {
    const languages = await languageService.getLanguages();
    res.status(200).json(languages);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const createLanguage = async (req: Request, res: Response) => {
  try {
    const language = await languageService.createLanguage(req.body);
    res.status(201).json(language);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const updateLanguage = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const language = await languageService.updateLanguage(id, req.body);
    res.status(200).json(language);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const deleteLanguage = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    await languageService.deleteLanguage(id);
    res.status(204).send();
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};
