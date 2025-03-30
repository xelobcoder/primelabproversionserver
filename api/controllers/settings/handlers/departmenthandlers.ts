import { Request, Response } from "express";
import { addNewDepartment, updateDepartment, getDepartments, deleteDepartment, getSpecificDepartment } from "../models/settings";

export const handleGetDepartments = async (req: Request, res: Response) => {
  await getDepartments(req, res);
};

export const handleAddNewDepartment = async (req: Request, res: Response) => {
  await addNewDepartment(req, res);
};

export const handleUpdateDepartment = async (req: Request, res: Response) => {
  await updateDepartment(req, res);
};

export const handleDeleteDepartment = async (req: Request, res: Response) => {
  await deleteDepartment(req, res);
};

// export const handleGetSpecificDepartment = async (req: Request, res: Response) => {
//   await getSpecificDepartment(req, res);
// };
