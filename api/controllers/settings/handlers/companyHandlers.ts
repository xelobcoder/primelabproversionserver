import { Request, Response } from 'express';
import { AddCompanyInfo, getCompanyInfo, getCompanyImage } from '../settings/companydata';
import { upload } from '../settings/companyimage';

export const handleAddCompanyInfo = (req: Request, res: Response) => {
  AddCompanyInfo(req, res);
};

export const handleGetCompanyInfo = (req: Request, res: Response) => {
  getCompanyInfo(req, res);
};

export const handleGetCompanyImage = (req: Request, res: Response) => {
  getCompanyImage(req, res);
};

export const handleUploadCompanyImage = upload.single('file'), (req: Request, res: Response) => {
  if (!req.file) {
    res.status(400).json({ error: 'No file uploaded' });
  } else {
    res.status(200).json({ message: 'File uploaded successfully' });
  }
};
