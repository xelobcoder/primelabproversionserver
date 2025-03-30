export type ApplicationSettingsData = {
  id: number;
  bulkregistration: string;
  fontsize: string;
  textcolor: string;
  BackgroundColor: string;
  DeactivateBilling24hrs: string;
  PaidBillsBeforeTransaction: number;
  completeFlow: string;
  approvalbeforeprinting: string;
  emailNotification: number;
  includeTax: number;
};

export type EmailPreference = {
  registration: string;
  result: string;
  rejection: string;
  approval: string;
  transactions: string;
  birthday: string;
  billing: string;
};

export type AppSetting = {
  includeTax: number;
  PaidBillsBeforeTransaction: number;
  taxValue?: number;
};

export const  enum AppError {
  failed = "operation failed",
  success = "success",
}



export type IupdateRegisFields = {
  fields: string;
  employeeid: number;
};