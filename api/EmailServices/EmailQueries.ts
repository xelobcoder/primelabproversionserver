import { promisifyQuery, rowAffected } from "../../helper";
import * as queries from "./sqlqueries";

class EmailQueries {
  private billingid: number;

  constructor(billingid: number) {
    this.billingid = billingid;
  }

  public async isEmailServiceActivated(): Promise<boolean> {
    const appset = await promisifyQuery<{ emailNotification: string }>(queries.SELECT_EMAIL_NOTIFICATION);
    if (appset.length == 0) return false;
    const emailActivation = appset[0]["emailNotification"];
    return emailActivation === "0" ? false : true;
  }

  public async getEmailPreference(): Promise<any> {
    return await promisifyQuery(queries.SELECT_EMAIL_PREFERENCE);
  }

  public async getEmailLog(start: number, limit: number = 10, response?: any): Promise<any> {
    try {
      if (!start) return false;
      const end = start + limit;
      const query = queries.SELECT_EMAIL_LOG;
      const result = await promisifyQuery(query, [start, end, limit]);
      if (!response) return result;
      response.send({ message: "success", statusCode: 200, result });
    } catch (err) {
      console.error(err);
      if (response) this.customError(err, 404, response);
    }
  }

  public async getTempClinicianCredentials(id: number): Promise<any> {
    try {
      if (!id) return null;
      return await promisifyQuery(queries.SELECT_TEMP_CLINICIAN_CREDENTIALS, [id]);
    } catch (err) {
      console.error(err);
    }
  }

  public async customSearch(record: { email: string; category: string }): Promise<any> {
    try {
      const { email, category } = record;
      let result: any[];
      switch (category) {
        case "staff":
          result = await promisifyQuery(queries.SELECT_STAFF_EMAIL, [`%${email}%`]);
          result = result.map((item) => ({
            fullname: item.username,
            email: item.email,
            employeeid: item.employeeid,
          }));
          break;
        case "clients":
          result = await promisifyQuery(queries.SELECT_CLIENTS_EMAIL, [`%${email}%`]);
          break;
        case "bulk clients":
          result = await promisifyQuery(queries.SELECT_ALL_CLIENTS_EMAIL);
          break;
        case "bulk staff":
          result = await promisifyQuery(queries.SELECT_ALL_STAFF_EMAIL);
          break;
        default:
          result = [];
          break;
      }
      return result;
    } catch (err) {
      console.error(err);
      return "error occurred";
    }
  }

  protected async saveComposedEmailDraft(subject: string, draft: string, employeeid: number): Promise<boolean> {
    try {
      const query = queries.INSERT_COMPOSED_EMAIL;
      const result = await promisifyQuery(query, [subject, draft, employeeid]);
      return result.affectedRows > 0;
    } catch (err) {
      console.error(err);
      return false;
    }
  }

  protected async updateEmailComposed(id: number, subject: string, draft: string, employeeid: number): Promise<boolean> {
    try {
      const query = queries.UPDATE_COMPOSED_EMAIL;
      const result = await promisifyQuery(query, [subject, draft, employeeid, id]);
      return result.affectedRows > 0;
    } catch (err) {
      console.error(err);
      return false;
    }
  }

  protected async updateEmailTarget(id: number, target: string, schedule: Date): Promise<any> {
    if (!target || !id) return "provide target and id";
    if (typeof id !== "number") return new TypeError("id must be type number");
    try {
      const update = queries.UPDATE_EMAIL_TARGET;
      return await promisifyQuery(update, [target, "true", schedule, id]);
    } catch (err) {
      throw new Error(err?.message);
    }
  }

  public async sendBulkEmails(id: number, target: string, category: string): Promise<boolean | string> {
    try {
      if (!id || !category) return "id and category are required";
      const table = category === "bulk clients" ? "new_patients" : "roles";
      const query = queries.SELECT_BULK_EMAILS.replace("{table}", table);
      const array = await promisifyQuery(query);
      const getEmailInfo = await this.getComposedEmailDraft(null, 1, "full", id);
      if (getEmailInfo.length == 0) return false;
      const { subject, body } = getEmailInfo[0];
      if (!Array.isArray(array)) return new TypeError("array must be type array");
      if (array.length == 0) return false;
      // Adjust your logic for sending emails
      return true;
    } catch (err) {
      console.error(err);
      return false || err?.message;
    }
  }

  public async sendComposedEmail(records: { subject: string; body: string; email: string }): Promise<boolean> {
    try {
      const { subject, body, email } = records;
      if (!subject || !email || !body) return false;
      const html = `<html><body>${body}</body></html>`;
      // Implement mailOptions and transportEmail methods
      // const mailOptions = this.mailOptions(email, subject, html);
      // return this.transportEmail(mailOptions);
      return true; // Placeholder for sending logic
    } catch (err) {
      console.error(err);
      return false;
    }
  }

  protected async isAddressAuthenticated(email: string, target: string): Promise<any> {
    if (!email || !target) return "email and target are required";
    // Implementation based on target
  }

  protected async publishEmail(records: any): Promise<boolean | string> {
    try {
      const { id, target, category, schedule } = records;
      // Implementation
      return true; // Placeholder for implementation
    } catch (err) {
      console.error(err);
      return false;
    }
  }

  public async getComposedEmailDraft(target: string, limit: number = 20, mode: string, id: number): Promise<any> {
    try {
      let query = queries.SELECT_COMPOSED_EMAILS.replace("{mode}", mode);
      let values: any[] = [];
      if (target == "draft") {
        query += ` WHERE ispublished = 'false'`;
      }
      if (target == "published") {
        query += ` WHERE ispublished = 'true'`;
      }
      if (id != null && target) {
        query += ` AND id = ?`;
        values.push(id);
      }
      if (id != null && !target) {
        query += ` WHERE id = ?`;
        values.push(id);
      }
      query += ` ORDER BY id DESC LIMIT ?`;
      values.push(limit);
      return await promisifyQuery(query, values);
    } catch (err) {
      console.error(err);
      return err?.message;
    }
  }

  public async getEmailSummaryByDay(response?: any): Promise<any> {
    try {
      const query = queries.SELECT_EMAIL_SUMMARY_BY_DAY;
      const result = await promisifyQuery(query);
      if (response) response.send({ status: "success", statusCode: 200, result });
      return result;
    } catch (err) {
      console.error(err);
      if (response) {
        // customError(err, 404, response);
        return;
      }
      return "error occurred";
    }
  }

  public async emailSummary(response?: any): Promise<any> {
    try {
      const query = queries.SELECT_EMAIL_SUMMARY;
      const result = await promisifyQuery(query);
      if (response) return response.send({ status: "success", statusCode: 200, result });
      return result;
    } catch (err) {
      console.error(err);
      if (response) {
        // customError(err, 404, response);
        return;
      }
      return "error occurred";
    }
  }

  public async isEmailAuthenticated(identifier: number, target: string): Promise<any> {
    try {
      let result = [];
      if (target === "patient") {
        result = await promisifyQuery(queries.SELECT_PATIENT_AUTHENTICATION, [identifier]);
        if (result.length === 0) return false;
        const { authenticated, authenticationMode } = result[0];
        return authenticationMode === "email" && authenticated == 1;
      }
      if (target === "clinician") {
        result = await promisifyQuery(queries.SELECT_CLINICIAN_AUTHENTICATION, [identifier]);
        if (result.length === 0) return false;
        const { isAuthenticated, authenticationMode } = result[0];
        return authenticationMode === "email" && isAuthenticated == 1;
      }
      return result;
    } catch (err) {
      console.error(err);
      return new Error(err);
    }
  }

  public async updateAuthMode(target: string, identifier: number): Promise<any> {
    if (!identifier || !target) return "required params not provided";
    try {
      let query = "";
      if (target === "patient") {
        query = queries.UPDATE_PATIENT_AUTH_MODE;
      }
      if (target === "clinician") {
        query = queries.UPDATE_CLINICIAN_AUTH_MODE;
      }
      if (!query) return false;
      return rowAffected(await promisifyQuery(query, [identifier]));
    } catch (err) {
      throw new Error(err);
    }
  }
}

export default EmailQueries;
