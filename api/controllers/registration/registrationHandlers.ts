import { Request, Response } from "express";
import { customError, convertKeysToLowerCase } from "../../helper";
import database_queries from "../database/queries";
import Registration from "../models/registration";
import EmailService from "../EmailServices/EmailCore";

const emailService = new EmailService();

export const addNewPatient = async (req: Request, res: Response) => {
  try {
    const register = new Registration();
    const outcome = await register.addNewPatient(req, res);

    if (typeof outcome === "number") {
      res.send({
        statusCode: 200,
        status: "success",
        message: "Patient registered successfully",
        patientid: outcome,
      });
      await emailService.fireClientAuthentication(outcome);
    }
  } catch (error) {
    console.error(error);
    customError("Error registering patient", 500, res);
  }
};

export const updatePersonalInformation = async (req: Request, res: Response) => {
  const { patientid } = req.query;
  if (!patientid) {
    customError("patientid not included in the request", 400, res);
  } else {
    try {
      await new Registration(patientid).UpdatePersonalInformation(req, res);
    } catch (error) {
      console.error(error);
      customError("Error updating personal information", 500, res);
    }
  }
};

export const updateEmergencyContactInformation = async (req: Request, res: Response) => {
  const { patientid } = req.query;
  if (!patientid) {
    customError("patientid not included in the request", 400, res);
  } else {
    try {
      const result = await new Registration(patientid).emmergencyInformation(patientid, req.body);
      if (result === true) {
        res.send({
          message: "record updated successfully",
          statusCode: 200,
          status: "success",
        });
      } else {
        res.send({
          message: "No record updated",
          statusCode: 200,
          status: "error",
        });
      }
    } catch (error) {
      console.error(error);
      customError("Error updating emergency contact information", 500, res);
    }
  }
};

export const updateAddressingInformation = async (req: Request, res: Response) => {
  const { patientid } = req.query;
  if (!patientid || patientid == "undefined") {
    customError("patientid not included in the request", 400, res);
  } else {
    try {
      const records = req.body;
      const info = await new Registration(patientid).addressingInformation(patientid, records);
      if (info === true) {
        res.send({
          message: "record updated successfully",
          statusCode: 200,
          status: "success",
        });
      } else {
        res.send({
          message: "No record updated",
          statusCode: 200,
          status: "success",
        });
      }
    } catch (error) {
      console.error(error);
      customError("Error updating addressing information", 500, res);
    }
  }
};

export const getPersonalInformation = async (req: Request, res: Response) => {
  const { patientid } = req.query;
  if (!patientid || patientid == "undefined" || patientid == "null") {
    customError("patientid not included in the request", 400, res);
  } else {
    try {
      const data = await database_queries.getsingleid(patientid, "new_patients", "PATIENTID");
      if (data.length > 0) {
        const dataOne = convertKeysToLowerCase(data[0]);
        dataOne.maritalstatus = dataOne.marital_status;
        dataOne.mobile = parseInt(dataOne.mobile_number);
        dataOne.patientOrganization = dataOne.organization;
        const date = new Date(dataOne.dob);
        delete dataOne.marital_status;
        delete dataOne.mobile_number;
        delete dataOne.organization;
        dataOne.years = date.getFullYear();
        dataOne.months = date.getMonth() + 1;
        dataOne.days = date.getDate();
        dataOne.ageType = dataOne["agetype"];
        delete dataOne.agetype;
        res.send({ statusCode: 200, status: "success", result: dataOne });
      } else {
        res.send({ statusCode: 200, status: "success", result: [] });
      }
    } catch (error) {
      console.error(error);
      customError("Error fetching personal information", 500, res);
    }
  }
};

export const checkMobileNumber = async (req: Request, res: Response) => {
  const { mobileno } = req.query;
  if (!mobileno) {
    customError("mobileno not included in the request", 400, res);
  } else {
    try {
      const data = await database_queries.getsingleid(mobileno, "new_patients", "mobile_number");
      res.send({ statusCode: 200, status: "success", exist: data.length > 0 });
    } catch (error) {
      console.error(error);
      customError("Error checking mobile number", 500, res);
    }
  }
};

export const getAddressingInformation = async (req: Request, res: Response) => {
  const { patientid } = req.query;
  if (!patientid) {
    customError("patientid not included in the request", 400, res);
  } else {
    try {
      const data = await database_queries.getsingleid(patientid, "patientsaddress", "patientid");
      if (data.length > 0) {
        res.send({ statusCode: 200, status: "success", result: data[0] });
      } else {
        res.send({ statusCode: 200, status: "success", result: [] });
      }
    } catch (error) {
      console.error(error);
      customError("Error fetching addressing information", 500, res);
    }
  }
};

export const getEmergencyContactInformation = async (req: Request, res: Response) => {
  const { patientid } = req.query;
  if (!patientid) {
    customError("patientid not included in the request", 400, res);
  } else {
    try {
      const data = await database_queries.getsingleid(patientid, "patientemmergencycontactinformation", "patientid");
      if (data.length > 0) {
        res.send({ statusCode: 200, status: "success", result: data[0] });
      } else {
        res.send({ statusCode: 200, status: "success", result: [] });
      }
    } catch (error) {
      console.error(error);
      customError("Error fetching emergency contact information", 500, res);
    }
  }
};

export const getRegistrationSettings = async (req: Request, res: Response) => {
  try {
    const settings = await new Registration().isBulkRegistration();
    res.send({
      status: "success",
      message: "settings retrieved successfully",
      statusCode: 200,
      bulkRegistration: settings,
    });
  } catch (error) {
    console.error(error);
    customError("Error fetching registration settings", 500, res);
  }
};
