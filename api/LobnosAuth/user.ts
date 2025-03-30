import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import logger from "../../logger";
import { convertKeysToLowerCase, promisifyQuery, customError } from "../../helper";
import configuration from "../../helpers/configuration";
import Security from "../../api/models/security/security";
import * as queries from "./queries";

class User {
  private name: string;
  private password: string;
  private role: string;
  private email: string;
  private branch: number | null;

  constructor(name: string, password: string, role: string, email: string, branch: number | null) {
    this.name = name;
    this.password = password;
    this.role = role;
    this.email = email;
    this.branch = branch;
  }

  public async checkUserExist(): Promise<boolean> {
    const result = await promisifyQuery(queries.SELECT_ROLE_BY_EMAIL, [this.email]);
    return result.length !== 0;
  }

  public async hashPassword(): Promise<string> {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    return this.password;
  }

  public async isPasswordSame(password: string, hashpassword: string): Promise<boolean> {
    return await bcrypt.compare(password, hashpassword);
  }

  public async insertionOne(name: string, password: string): Promise<any> {
    if (!this.branch) {
      throw new Error("User must be assigned a branch");
    }
    const parsedBranch = parseInt(this.branch.toString());
    if (isNaN(parsedBranch)) {
      throw new TypeError("branch must be an integer");
    }
    return promisifyQuery(queries.INSERT_USER, [name, password, this.role, this.email, this.branch]);
  }

  public async getUserData(email: string): Promise<any> {
    try {
      const result = await promisifyQuery(queries.SELECT_USER_BY_EMAIL, [email]);
      if (result.length === 0) return false;
      return result[0];
    } catch (err) {
      logger.error(err);
      return false;
    }
  }
  public async getUserDataById(employeeid: number): Promise<any> {
    try {
      const result = await promisifyQuery(queries.SELECT_USERDATA_BY_EMPLOYEE_ID, [employeeid]);
      return result;
    } catch (err) {
      logger.error(err);
      return false;
    }
  }

  public async processUserData(data: any): Promise<any> {
    const user = convertKeysToLowerCase(data);
    const { permissions, email, activation, username, role, employeeid, branch } = user;
    if (activation !== 1) {
      return `Access Denied!!. User not activated to have access`;
    }
    if (permissions === "{}") {
      return `Access Denied!!. Permissions not set`;
    }
    if (configuration.configurations.strictBranchCheck) {
      if (!branch || branch <= 0) {
        return "Access Denied!!.User not assigned to a branch";
      }
    }
    let branchname = null;
    if (branch) {
      const branchData = await promisifyQuery(queries.SELECT_BRANCH_NAME_BY_ID, [parseInt(branch)]);
      if (branchData.length > 0) {
        branchname = branchData[0]["name"];
      }
    }
    return { permissions, role, activation, email, employeeid, username, branchid: branch, branch: branchname };
  }

  public async createUser(): Promise<any> {
    try {
      const isUserExist = await this.checkUserExist();
      if (isUserExist) return "user already exist";
      const hashPassword = await this.hashPassword();
      return await this.insertionOne(this.name, hashPassword);
    } catch (err) {
      logger.error(err);
      throw new Error(err?.message || "error creating user");
    }
  }

  public async checkLogins(email: string, password: string): Promise<boolean> {
    try {
      const storedPassword = await promisifyQuery(queries.SELECT_USER_BY_EMAIL, [email]);
      if (storedPassword.length === 0) return false;
      return await bcrypt.compare(password, storedPassword[0]?.password);
    } catch (err) {
      logger.error(err);
      throw new Error(err?.message || "something went wrong");
    }
  }

  public async applicationAccessToken(): Promise<string> {
    return jwt.sign({ clientid: 74747 }, process.env.ACCESS_TOKEN_SECRET as string, { expiresIn: "1y" });
  }

  public async createAccessTokenCredentials(accesskey: string, email: string, data: any, expiresIn: string): Promise<string> {
    try {
      const accessToken = jwt.sign({ ...data }, accesskey, { expiresIn });
      return accessToken;
    } catch (err) {
      logger.error(err);
      throw new Error(err?.message || "something went wrong");
    }
  }

  public async validateRequestToken(req: any, res: any, next: any, accessSecret: string): Promise<void> {
    try {
      const accessToken = req.headers.authorization && req.headers.authorization.split(" ")[1];
      if (!accessToken) {
        return customError("Unauthorized to access service.", 401, res);
      }
      const isValidated = await this.verifyToken(accessToken);
      if (isValidated) {
        next();
      }
    } catch (err) {
      return customError("Application license expired, please contact admin for renewal", 401, res);
    }
  }

  public async validateEmployeeToken(request: any, response: any): Promise<void> {
    try {
      const { token } = request.query;
      if (!token) {
        return customError("token not provided", 404, response);
      }
      const tokenValid = await jwt.verify(token, process.env.ACCESS_TOKEN_SECRET as string);
      if (!tokenValid) {
        return customError("token provided is invalid", 401, response);
      }
      const { role, employeeid } = tokenValid as any;
      const isUserLoggedIn = await new Security(employeeid).getCanInitiateLogin();
      if (isUserLoggedIn) {
        return response.send({ loggedIn: false, message: "user is not loggedIn" });
      }
      if (!role) {
        return customError("token is invalid", 404, response);
      }
      switch (role) {
        case "clinician":
        case "patient":
          response.send({ statusCode: 200, status: "success", user: tokenValid });
          break;
        default:
          const allValid = ["username", "activation", "email", "employeeid", "permissions", "role"].some(
            (item) => !tokenValid.hasOwnProperty(item)
          );
          if (allValid) {
            return customError("invalid token data received", 401, response);
          }
          let branch = await promisifyQuery(queries.SELECT_BRANCH_NAME_BY_ID, [parseInt((tokenValid as any)?.branchid)]);
          if (branch.length > 0) {
            branch = branch[0]["name"];
          }
          response.send({ statusCode: 200, status: "success", user: { ...tokenValid, branch } });
      }
    } catch (err) {
      return customError("Expired token", 404, response);
    }
  }

  public async verifyToken(token: string): Promise<any> {
    return jwt.verify(token, process.env.ACCESS_TOKEN_SECRET as string);
  }

  public async tokenizeData(data: any, expiresIn: string): Promise<string> {
    return jwt.sign({ ...data }, process.env.ACCESS_TOKEN_SECRET as string, { expiresIn });
  }

  public async getUserRole(employeeid: string): Promise<string | null> {
    const data = await promisifyQuery(queries.SELECT_ROLE_BY_EMPLOYEE_ID, [employeeid]);
    return data.length > 0 ? data[0]["role"] : null;
  }

  public async userExistWithId(id: string): Promise<any> {
    try {
      const result = await promisifyQuery(queries.SELECT_USER_BY_EMPLOYEE_ID, [id]);
      return result.length === 0 ? false : result;
    } catch (err) {
      logger.error(err);
      throw new Error(err?.message || "something went wrong");
    }
  }
}

export default User;
