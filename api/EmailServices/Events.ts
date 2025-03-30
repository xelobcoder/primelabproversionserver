import EmailService from "./EmailCore";
import EmailQueries from "./EmailQueries";
import { testInformation, clientInformation } from "../models/invoice";
import logger from "../../logger";
import ejs from "ejs";
import path from "path";

class ApplicationEvents extends EmailService {
  events: any; 

  constructor(employeeid: number, events: any) {
    super(employeeid);
    this.events = events;
  }

  hasEvent(key: string, checker: number | string): boolean {
    if (typeof this.events !== "object") {
      throw new TypeError("Object type required");
    }
    if (!this.events[key]) return false;
    if (typeof checker === "number") {
      return this.events[key] === "0" ? false : true;
    }
    if (typeof checker === "string") {
      return this.events[key] === "Yes" ? true : false;
    }
    return !!this.events[key];
  }

  async forwardBillingReceipt(billingid: number): Promise<boolean | string> {
    try {
      const emailQueries = new EmailQueries(billingid); // Initialize with billingid
      if (!billingid || typeof billingid !== "number") return false;

      const testdata = await testInformation(billingid);
      const personalInfo = await clientInformation(billingid);
      const email = personalInfo[0]?.email;

      if (!email) {
        return "Email not provided";
      }

      if (testdata.length > 0 && personalInfo.length > 0 && email) {
        const html = await ejs.renderFile(path.join(__dirname, "../views/templates", "billing.ejs"), {
          data: {
            testdata,
            personalInfo: personalInfo[0],
            facility: this.company, 
          },
        });

        const mail = this.mailOptions(email, "Transaction Alert", html);
        return await this.transportEmail(mail);
      }

      return false;
    } catch (err) {
      logger.error({ type: "email", err });
      throw new Error(err);
    }
  }

  resultApproval(billingid: number, testname: string): boolean {
    const result = this.hasEvent("result", "string");
    return result;
  }
}

export default ApplicationEvents;
