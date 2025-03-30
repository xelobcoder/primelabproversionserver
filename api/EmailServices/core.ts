import { createEmailTransport, EFailures, EmailService, Identifier, mailOptions, sampleRejection } from "./createEnv";

export default class Core implements EmailService {
    private isEnv: boolean;
    constructor() {
        this.isEnv = process.env.PROD_PLS_EMAIL_USER != undefined &&
            process.env.PROD_PLS_EMAIL_PROVIDER != undefined && process.env.PROD_PLS_EMAIL_COMPANY != undefined && process.env.PROD_PLS_EMAIL_PASSWORD != undefined;

        if (!this.isEnv) {
            throw new Error('system Env missing');
        }

    }
    createMailTransporter(mailOptions) {
        if (!this.isEnv) return EFailures.ENV_VARIABLES_FAILED;
        return createEmailTransport(mailOptions);
    }


    notificationPatientRegistration(patientid: number, email: string, callback: any): Promise<boolean> {
        throw new Error("Method not implemented.");
    }
    notificationSampleRejection(data: sampleRejection): Promise<boolean> {
        throw new Error("Method not implemented.");
    }
    authenticationMailService(data: Identifier): Promise<boolean> {
        throw new Error("Method not implemented.");
    }
    notificationBillingReceipt(data: any): Promise<boolean> {
        throw new Error("Method not implemented.");
    }
    verifyClientAuthenticationToken(token: string): Promise<boolean> {
        throw new Error("Method not implemented.");
    }
    isEmailServicesActivated(): Promise<boolean> {
        throw new Error("Method not implemented.");
    }
    isMailChosenPatientNotic(patientid: number): Promise<boolean> {
        throw new Error("Method not implemented.");
    }
}

