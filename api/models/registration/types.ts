export type NewRegistration = {
  firstname: string;
  lastname: string;
  middlename: string;
  age: string;
  ageType: string;
  email: string;
  gender: string;
  mobile: number;
  days: number;
  months: number;
  maritalstatus: boolean;
  occupation: string;
  patientOrganization: string;
  years: number;
  mobileownership: string;
};

export type clientdata = {
  mobile: number;
  mobileownership: string;
  email: string;
};

export type registrationOutcome = {
  count: number;
  insertid: number;
};

export type addressInformation = {
  area: string;
  region: string;
  gpsLocation: string;
  address: string;
};

export interface IRegistration {
  patientid: number;
  isClientSame(clientdata: clientdata): boolean;
  checkEmailOrMobileExist(email: string, mobile: number): boolean;
  checkPatientIdExist(patientid: number): Promise<boolean>;
  getPatientBasicData(patientid: number | string): Promise<[]>;
  addPersonalInformation(records: NewRegistration): Promise<registrationOutcome | void>;
  addressingInformation(paientid: number, records: addressInformation): Promise<boolean | void>;
  addNewPatient(data: NewRegistration): Promise<number>;
  updatePersonalInformation(patientdata: NewRegistration): Promise<boolean>;
}

export type PatientRecords = {
  count: number;
  email: string;
  patientid: number;
  page: number;
  from: string;
  to: string;
  fullname: string;
  mobile: number;
};