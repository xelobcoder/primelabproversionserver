import { Request, Response } from "express";

export interface ITax {
  addTax(request: Request, response: Response): Promise<void>;
  getTax(request: Request, response: Response): Promise<void>;
  updateTax(request: Request, response: Response): Promise<void>;
  changeTaxStatus(request: Request, response: Response): Promise<void>;
  deleteTax(request: Request, response: Response): Promise<void>;
}
