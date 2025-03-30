import {
  q_active_tax,
  q_application_setting,
  q_get_email_pref,
  q_update_general_app_set,
  q_TruncateTable,
  q_update_sms_settings,
  q_get_sms_settings,
  q_truncateEmailPreference,
  q_update_email_preference,
  q_registration_settings,
  q_update_reg_fields,
  q_insert_reg_settings,
  q_general_email_settings,
  q_truncateGeneralSettings,
} from "./queries";

import { AppError, ApplicationSettingsData, AppSetting, EmailPreference, IupdateRegisFields } from "./Type";

const { promisifyQuery, rowAffected } = require("../../../../helper");
// const {EmailService} = require("../../")

export default class ApplicationSettings {
  public async getAllAppSettings(): Promise<ApplicationSettingsData[]> {
    return promisifyQuery(q_application_setting);
  }

  public async getAppBillSettings(): Promise<AppSetting | boolean> {
    const settings: ApplicationSettingsData[] = await this.getAllAppSettings();
    if (settings.length === 0) return false;
    const { includeTax, PaidBillsBeforeTransaction } = settings[0];
    if (includeTax === 0) {
      return { includeTax, taxValue: 0, PaidBillsBeforeTransaction };
    }

    const getTax: [] = await promisifyQuery(q_active_tax);
    if (getTax.length == 0) {
      return { includeTax, taxValue: 0, PaidBillsBeforeTransaction };
    } else {
      const taxValue = getTax.reduce((a, b: any) => {
        return a + b.value;
      }, 0);
      return {
        includeTax,
        taxValue: taxValue,
        PaidBillsBeforeTransaction,
      };
    }
  }

  public async getEmailPreference(): Promise<EmailPreference | []> {
    let data: EmailPreference[] | [] = await promisifyQuery(q_get_email_pref);
    return data.length > 0 ? data[0] : [];
  }

  async shouldSendRejectionEmail(): Promise<boolean> {
    const settings: ApplicationSettingsData[] = await this.getAllAppSettings();
    let isServicesActivated = false;
    let isRejectedPrefered = false;
    if (settings.length > 0 && settings[0]["emailNotification"] == 1) {
      isServicesActivated = true;
    }

    const rejectionPreference: EmailPreference | [] = await this.getEmailPreference();
    if (!Array.isArray(rejectionPreference) && rejectionPreference?.rejection == "Yes") {
      isRejectedPrefered = true;
    }

    if (isRejectedPrefered && isServicesActivated) {
      return true;
    }
    return false;
  }

  public async updateApplicationSettings(data: ApplicationSettingsData): Promise<boolean> {
    try {
      const {
        bulkregistration,
        emailNotification,
        fontsize,
        textcolor,
        DeactivateBilling24hrs,
        BackgroundColor,
        PaidBillsBeforeTransaction,
        completeFlow,
        approvalbeforeprinting,
        includeTax,
      } = data;

      const values = [
        bulkregistration,
        fontsize,
        textcolor,
        BackgroundColor,
        DeactivateBilling24hrs,
        PaidBillsBeforeTransaction,
        completeFlow,
        approvalbeforeprinting,
        emailNotification,
        includeTax,
      ];
      const result = await promisifyQuery(q_TruncateTable);
      if (!result) return false;
      const isUpdated: boolean = rowAffected(await promisifyQuery(q_update_general_app_set, values));
      return isUpdated;
    } catch (err) {
      console.log(err);
      throw err;
    }
  }

  async updateSmsSettings(data: string): Promise<boolean> {
    return rowAffected(await promisifyQuery(q_update_sms_settings, [data]));
  }

  async getSmsSettings(): Promise<boolean | string> {
    const result = await promisifyQuery(q_get_sms_settings);
    if (result.length == 0) return null;
    const { smsSettings } = result[0];
    return JSON.parse(smsSettings);
  }

  async updateEmailPreference(data: EmailPreference): Promise<string> {
    const { registration, rejection, result, approval, transactions, birthday, billing } = data;
    const truncate = rowAffected(await promisifyQuery(q_truncateEmailPreference));
    if (!truncate) return AppError.failed;
    const values: string[] = [registration, result, rejection, approval, transactions, birthday, billing];
    const outcome = rowAffected(await promisifyQuery(q_update_email_preference, values));
    return outcome ? AppError.success : AppError.failed;
  }

  async getRegistrationSettings() {
    return await promisifyQuery(q_registration_settings);
  }

  async updateRegisFields(id: number, data: string, employeeid: number): Promise<boolean> {
    return rowAffected(await promisifyQuery(q_update_reg_fields, [data, employeeid, id]));
  }

  async insertRegistrationSettings(fields: string, employeeid: number): Promise<boolean> {
    return rowAffected(await promisifyQuery(q_insert_reg_settings, [JSON.stringify(fields), employeeid]));
  }

  async updateRegistrationFields(data: IupdateRegisFields): Promise<boolean> {
    const { fields, employeeid } = data;

    if (!fields || !employeeid) {
      throw new ReferenceError("fields or employeeid not provided");
    }

    const previous = await this.getRegistrationSettings();
    if (previous.length > 0) {
      const fieldid = previous[0]["id"];
      return await this.updateRegisFields(fieldid, JSON.stringify(fields), employeeid);
    } else {
      return await this.insertRegistrationSettings(fields, employeeid);
    }
  }
  async getGeneralEmailSettings() {
    return await promisifyQuery(q_general_email_settings);
  }

  async updateGeneralEmailSettings(records) {
    if (typeof records != "object") return false;
    // first truncate the table
    let isTruncated = await promisifyQuery(q_truncateGeneralSettings);
    if (isTruncated) {
      //       return new EmailService().insertEmailSettings(records);
    }
  }

  async isApprovalSetTrue() {
    const result = await this.getAllAppSettings();
    if (result.length > 0) {
      const approval_status = result[0]["approvalbeforeprinting"];
      return !(parseInt(approval_status) === 0);
    }
    return false;
  }
}

