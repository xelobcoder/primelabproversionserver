import { Request, Response } from "express";
export interface IRequest extends Request {
  body: any; 
}
export interface IResponse extends Response {}
