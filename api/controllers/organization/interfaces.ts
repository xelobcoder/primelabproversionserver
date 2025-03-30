import { Request, Response } from "express";
export interface IRequest extends Request {
  file: any; 
}

export interface IResponse extends Response {}
