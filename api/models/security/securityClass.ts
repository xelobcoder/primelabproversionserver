"use strict";
import jwt from "jsonwebtoken";
import path from "node:path";
import { promisifyQuery, rowAffected, paginationQuery } from "../../../helper";
import { queries } from "./securityQueries";
import ISecurity from "./SecurityIinterface";

class Security implements ISecurity {
  employeeid: string;
  loginDuration: number;
  sqlConnection: any;
  isMaster: boolean;

  constructor(employeeid: string, loginDuration?: number) {
    this.employeeid = employeeid;
    this.loginDuration = loginDuration || 3;
    this.sqlConnection = promisifyQuery;
    this.isMaster = true;
  }

  public isEmployeeid(): boolean {
    return this.employeeid !== null && this.employeeid !== undefined;
  }

  public async createSessionId(): Promise<string> {
    return jwt.sign(this.employeeid, process.env.ACCESS_TOKEN_SECRET);
  }

  public validDurationProvided(): boolean {
    return this.loginDuration > 0 && this.loginDuration <= 6;
  }

  public async insertLoginHistory(browserInformation: any): Promise<number> {
    const expiryTime = Date.now() + this.loginDuration * 60 * 60 * 1000;
    if (!this.isEmployeeid()) {
      throw new Error("employeeid not provided");
    }
    if (!this.validDurationProvided()) {
      throw new Error("login Duration must be between 1 and 6");
    }
    let sessionId = await this.createSessionId();
    const query = queries.insertLoginHistory;
    const values = [this.employeeid, sessionId, expiryTime, JSON.stringify(browserInformation)];
    await this.sqlConnection(query, values);
    return expiryTime;
  }

  public currentTimeInMillis(): number {
    return Date.now();
  }

  public async getCurrentLoginCounts(): Promise<number> {
    const query = `SELECT COUNT(*) AS count FROM loginlogs WHERE logoutTime > ?`;
    const result = await this.sqlConnection(query, this.currentTimeInMillis());
    return result.length > 0 ? result[0]["count"] : 0;
  }

  public async getCurrentUserLoginSessions(): Promise<any[]> {
    if (this.isEmployeeid()) {
      const query = queries.getCurrentUserLoginSessions;
      const data = await this.sqlConnection(query, [this.currentTimeInMillis(), this.employeeid]);
      return data;
    }
    return [];
  }

  public async getCurrentUserLoginSessionsWithDetails(): Promise<any[]> {
    if (this.isEmployeeid()) {
      const query = queries.getCurrentUserLoginSessionsWithDetails;
      let data = await this.sqlConnection(query, [this.currentTimeInMillis(), this.employeeid]);
      if (data.length > 0) {
        data = data.map((item: any) => {
          if (item.hasOwnProperty("browserInformation")) {
            item["browserInformation"] = JSON.parse(item["browserInformation"]);
          }
          return item;
        });
      }
      return data;
    }
    return [];
  }

  public async getCanInitiateLogin(): Promise<boolean> {
    const data = await this.getCurrentUserLoginSessions();
    return Array.isArray(data) ? data.length === 0 : false;
  }

  public async destroyUserSessions(): Promise<boolean> {
    let sessionsKeys: number[] = [];
    try {
      const querySelect = queries.destroyUserSessionsSelect;
      let result = await this.sqlConnection(querySelect, this.employeeid);
      if (result.length > 0) {
        sessionsKeys = result.map((item: any) => item?.loginhxid);
        const queryDelete = queries.destroyUserSessionsDelete;
        await this.sqlConnection(queryDelete, [this.employeeid]);
      }
    } catch (err) {
      console.log(err);
    } finally {
      if (sessionsKeys.length > 0) {
        const updates = sessionsKeys.map(async (item) => {
          const queryUpdate = queries.updateLoginLogs;
          const updated = await this.sqlConnection(queryUpdate, [Date.now(), item]);
          return rowAffected(updated);
        });
        const results = await Promise.all(updates);
        const status = results.some((a) => a === false);
        return !status;
      }
    }
  }

  public async getEmployeeLoginHistory(page: number = 1, count: number = 10): Promise<any[]> {
    if (!this.isEmployeeid()) return [];
    const query = queries.getEmployeeLoginHistory;
    return await paginationQuery({ page, count }, query, [parseInt(this.employeeid)]);
  }

  public async getEmployeeLastLoginSession(): Promise<any[]> {
    if (!this.isEmployeeid()) return [];
    const query = queries.getEmployeeLastLoginSession;
    return await promisifyQuery(query, [this.employeeid]);
  }

  public async getGeneralLoginHistory(page: number = 1, count: number = 10, employeeid: number | null = null): Promise<any[]> {
    let queryValues: any[] = [];
    let query = queries.getGeneralLoginHistory;

    if (employeeid && !isNaN(employeeid)) {
      query += ` WHERE rl.employeeid = ?`;
      queryValues.push(employeeid);
    }

    query += ` ORDER BY keyid DESC LIMIT ? OFFSET ?`;
    return await paginationQuery({ page, count }, query, queryValues);
  }

  public async getDboSystemSecurity(): Promise<any[]> {
    const query = queries.getDboSystemSecurity;
    return await this.sqlConnection(query);
  }

  public async environmentSecurity(currentAppPath: string): Promise<boolean> {
    try {
      if (typeof currentAppPath !== "string") {
        throw new TypeError("path must be a string");
      }
      const appPath = path.join(__dirname, "../../../app.js");
      const appModels = path.join(__dirname, "../../models");
      const appControllers = path.join(__dirname, "../../controllers");
      const REGISTERED_ENV = await this.getDboSystemSecurity();
      if (REGISTERED_ENV.length === 0) {
        throw new Error("Device not recognized or licensed to run this software");
      }
      const currentComputer = process.env.COMPUTERNAME;
      const currentDomain = process.env.USERDOMAIN;
      const currentSystemRoot = process.env.SYSTEMROOT;

      const registeredComputer = REGISTERED_ENV[0]["computerName"];
      const registeredUser = REGISTERED_ENV[0]["userDomain"];
      const registeredSystemRoot = REGISTERED_ENV[0]["systemRoot"];
      const registeredDirectory = REGISTERED_ENV[0]["appDir"];

      if (
        registeredComputer !== currentComputer ||
        registeredSystemRoot !== currentSystemRoot ||
        registeredUser !== currentDomain ||
        currentAppPath !== registeredDirectory
      ) {
        return false;
      } else {
        return true;
        // to be implemented delete resource from computer if the software is run on unauthorized device.
      }
    } catch (err) {
      if (err.code === "ENOENT") {
        console.log("no such folder");
      }
      return false;
    }
  }
}

export default Security;
