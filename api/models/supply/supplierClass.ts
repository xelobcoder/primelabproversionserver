import { promisifyQuery, paginationQuery } from "../../../helper";
import ApplicationSettings from "../../models/application/appsettings/appset";
import EmailService from "../../EmailServices/EmailCore";
import * as queries from "./queries";
import ISupplys, { SupplierRecord, CommodityRecord, ApiResponse, ApplicationSettings as AppSettingsInterface } from "./types";

class Supplys implements ISupplys {
  private supplierid: number | null;

  constructor(supplierid: number | null = null) {
    this.supplierid = supplierid;
  }

  public async isSupplierAvailable(contact: number, email: string): Promise<boolean | string> {
    if (!contact || !email) {
      throw new Error("email or contact required");
    }
    if (!email.includes("@") || !email.includes(".")) {
      return "WRONG EMAIL FORMAT PROVIDED";
    }
    if (contact.toString().length !== 10) {
      return "INCORRECT CONTACT PROVIDED";
    }
    const result = await promisifyQuery(queries.GETSUPPLIER_BY_CONTACT_OR_EMAIL, [contact, email]);
    return result.length === 0;
  }

  private async sendEmailVerification(email: string, data: any): Promise<any> {
    try {
      const applicationSettings = await new ApplicationSettings().getAllAppSettings();
      if (applicationSettings.length == 0) return false;
      const email_settings: AppSettingsInterface = applicationSettings[0];
      if (email_settings.emailNotification === 1) {
        const emailService = new EmailService(1);
        const token = await emailService.generateToken(data, "30m");
        emailService.sendAuthenticateEmail(token, email, "EMAIL VERIFICATION NOTICE");
        return;
      }
    } catch (err) {
      console.log(err);
    }
  }

  public async addSupplier(records: SupplierRecord): Promise<ApiResponse> {
    const { name, address, email, contactperson, region, phonenumber } = records;
    const canCreate = await this.isSupplierAvailable(phonenumber, email);
    if (canCreate === true) {
      const result = await promisifyQuery(queries.NEWSUPPLIERQUERY, [name, address, email, contactperson, region, phonenumber]);
      if (result.insertId != null) {
        await this.sendEmailVerification(email, { supplierid: result.insertId, email });
        return {
          message: "supplier account created awaiting email account verification",
          statusCode: 200,
          status: "success",
        };
      } else {
        return {
          message: "supplier contact creation failed",
          statusCode: 404,
          status: "failed",
        };
      }
    } else if (canCreate === false) {
      return { message: "account already exist", statusCode: 404, status: "failed" };
    } else {
      return { message: canCreate as string, statusCode: 400, status: "failed" };
    }
  }

  public async deleteSupplier(supplierid: number): Promise<boolean> {
    const query = `DELETE FROM supplier WHERE supplierid = ?`;
    const result = await promisifyQuery(query, [supplierid]);
    return result.affectedRows > 0;
  }

  public async getSuppliers(data: any): Promise<any> {
    try {
      return await paginationQuery(data, queries.GETSUPPLIERSQUERY);
    } catch (err) {
      throw new Error(err);
    }
  }

  public async updateSupplier(records: SupplierRecord): Promise<boolean | null> {
    const { name, address, region, contactperson, email, phonenumber, supplierid } = records;
    if (!supplierid) return false;
    const values = [name, address, region, contactperson, email, phonenumber, supplierid];
    const outcome = await promisifyQuery(queries.UPDATESUPPLIERQUERY, values);
    return outcome.affectedRows > 0 ? true : null;
  }

  public async getSupplier(supplierid: number): Promise<any> {
    if (!supplierid) return false;
    const query = `SELECT * FROM supplier WHERE supplierid = ?`;
    const result = await promisifyQuery(query, [supplierid]);
    return result;
  }

  public async getSupplierPendingOrders(id: number, status: string = "data"): Promise<any> {
    let supplierid = this.supplierid;
    if (!supplierid) {
      supplierid = id;
    }
    if (!supplierid) throw new Error("supplierid not provided");

    const result = await promisifyQuery(queries.GET_PENDING_ORDERS, [supplierid]);
    if (status === "count") return { count: result.length };
    return result;
  }

  public async postCommodity(records: CommodityRecord): Promise<boolean> {
    const { name, category } = records;
    if (!name || !category) throw new Error("name and category required");
    const result = await promisifyQuery(queries.INSERT_COMMODITY, [name, category]);
    return result.insertId != null;
  }

  public async getCommodity(commodity: string): Promise<any> {
    if (!commodity) throw new Error("commodity required");
    const query = `SELECT * FROM commodity WHERE commodity = ?`;
    const result = await promisifyQuery(query, [commodity]);
    return result;
  }

  public async getCommodities(query: any): Promise<any> {
    return await paginationQuery(query, queries.GET_COMMODITIES);
  }
}

export default Supplys;
