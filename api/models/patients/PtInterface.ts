interface IPatient {
  getTransactionsByDate(patientid: number, to?: string, from?: string): Promise<any>;

  updateCredentials(request: any, response: any): Promise<void>;

  updateNotificationSettings(request: any, response: any): Promise<void>;

  transformDataset(list: any[], data: any[]): Promise<any>;

  getParameters(data: any[]): Promise<any>;

  getPatientBillingRecords(details: {
    patientid: number;
    count?: number;
    page?: number;
    startdate?: string;
    enddate?: string;
  }): Promise<any>;

  getPatientFullBloodCountTrend(listArray: any[]): Promise<{ trend: any; category: string; supported: boolean; parameters: any }>;

  getPatientTestTrend(patientid: number, testid: number, testname: string, instances: number): Promise<any>;
}
