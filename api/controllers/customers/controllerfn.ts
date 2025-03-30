import { Request, Response } from "express";
import Registration from "../../models/registration/registration";
import { PatientRecords } from "../../models/registration/types";

export async function getCustomers(request: Request, response: Response) {
  try {
    const query = request.query as unknown as PatientRecords;
    const data = await new Registration().getCustomersRecords(query);
    response.send(data);
  } catch (err) {
    response.send([]);
  }
}
