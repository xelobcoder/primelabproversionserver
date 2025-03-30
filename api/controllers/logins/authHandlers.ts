// src/authHandlers.ts

import { Request, Response } from "express";
import { promisifyQuery, customError } from "../../helper";
import {
  createNewAccount,
  getAllLogins,
  userLogin,
  deleteAccount,
  updateUserPermission,
  getPermissions,
  activateAUser,
  getAUser,
  updateUserBasicInfo,
} from "../LobnosAuth/createAccount";
import User from "../LobnosAuth/user";
import logger from "../../../logger";

export const getLogins = async (req: Request, res: Response) => {
  getAllLogins(req, res);
};

export const getUser = async (req: Request, res: Response) => {
  getAUser(req, res);
};

export const createAccount = async (req: Request, res: Response) => {
  createNewAccount(req, res);
};

export const deleteAccountHandler = async (req: Request, res: Response) => {
  deleteAccount(req, res);
};

export const updateBasicInfo = async (req: Request, res: Response) => {
  updateUserBasicInfo(req, res);
};

export const authenticateUser = async (req: Request, res: Response) => {
  const { email, password } = req.body;
  if (!email || !password) {
    customError("Bad Request", 400, res);
    return;
  }
  userLogin(req, res);
};

export const activateUser = async (req: Request, res: Response) => {
  activateAUser(req, res);
};

export const getUserPermissions = async (req: Request, res: Response) => {
  const { permissions } = req.query;
  if (!permissions) {
    customError("employeeid permission id required", 404, res);
    return;
  }
  const result = await getPermissions(permissions, res);
  res.send(result);
};

export const updatePermissions = async (req: Request, res: Response) => {
  updateUserPermission(req, res);
};

export const authenticateClinician = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      customError("email and password required", 404, res);
      return;
    }

    const query = `SELECT * FROM clinicianscredentials WHERE email = ?`;
    const getUserDetails = await promisifyQuery(query, [email]);

    if (getUserDetails.length === 0) {
      customError("Invalid credentials seen", 404, res);
      return;
    }

    const { ispasswordUpdated, clinicianid } = getUserDetails[0];
    const data = { role: "clinician", email, employeeid: clinicianid };

    if (ispasswordUpdated === 0 && getUserDetails[0]["password"] === password) {
      const token = await new User().tokenizeData(data, "40m");
      res.send({ message: "Clinician authenticated", statusCode: 200, status: "success", token, result: data });
      return;
    }

    if (ispasswordUpdated === 0 && getUserDetails[0]["password"] !== password) {
      res.send({ message: "Invalid user credentials", statusCode: 200, status: "fail" });
      return;
    }

    if (ispasswordUpdated === 1) {
      const isMatched = new User().isPasswordSame(password, getUserDetails[0]["password"]);
      isMatched
        ? res.send({ message: "password authenticated", statusCode: 200, status: "success", result: getUserDetails[0] })
        : res.send({ message: "Invalid user credentials", statusCode: 200, status: "error" });
      return;
    }
  } catch (err) {
    logger.error(err);
    customError("Something wrong has occurred", 404, res);
  }
};
