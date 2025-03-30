import {createTransport} from 'nodemailer'

export function hasEnvVariable(data, target: string) {
  return typeof data === "object" && typeof target == "string" && target in data;
}

export interface EmailEnvironment {
  username_mail: string;
  password: string;
  mail_provided: string;
  mail_company: string;
}

export type sampleRejection = {
  patientid: number;
  email: string;
  message: string;
  callback: () => {};
};

export interface EmailService {
  createMailTransporter(data: EmailEnvironment)
  notificationPatientRegistration(patientid: number, email: string, callback): Promise<boolean>;
  notificationSampleRejection(data: sampleRejection): Promise<boolean>;
  authenticationMailService(data: Identifier): Promise<boolean>;
  notificationBillingReceipt(data): Promise<boolean>;
  verifyClientAuthenticationToken(token:string): Promise<boolean>;
  isEmailServicesActivated(): Promise<boolean>
  isMailChosenPatientNotic(patientid:number): Promise<boolean>
}

export type mailOptions = {
  from: string;
  to: string;
  subject: string;
  html: string;
};

export type Identifier = {
  category: string;
  identifier: number;
  targetEmail: string;
  customMessage: string;
};



export const enum EFailures {
  ENV_VARIABLES_FAILED = "Production Variables not set",
  INV_MAIL_OPT ="Invalid mailoptions provided, must include subject, html and target email"
}


export async function createEmailTransport(mailOptions: mailOptions) {
  const { to, subject, html } = mailOptions;
  if (!to || !subject || !html) return EFailures.INV_MAIL_OPT;
 return await createTransport({
    service: process.env.PROD_PLS_EMAIL_PROVIDER,
    auth: {
      pass: process.env.PROD_PLS_EMAIL_PASSWORD,
      user: process.env.PROD_PLS_EMAIL_USER
    },
  }).sendMail({from: process.env.PROD_PLS_EMAIL_COMPANY,...mailOptions});
}