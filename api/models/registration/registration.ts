import { q_filter_patient_using_billingid_query, q_filter_patients, q_new_registation, q_patient_data } from "./queries";
import { addressInformation, clientdata, IRegistration, NewRegistration, PatientRecords, registrationOutcome } from "./types";

import { promisifyQuery } from "../../../helper";

export default class Registration implements IRegistration {
  patientid: number;
  isClientSame(clientdata: clientdata): boolean {
    throw new Error("Method not implemented.");
  }
  checkEmailOrMobileExist(email: string, mobile: number): boolean {
    throw new Error("Method not implemented.");
  }
  public async checkPatientIdExist(patientid: number): Promise<boolean> {
    try {
      let useKey: number = patientid ? patientid : this.patientid;
      let result = await promisifyQuery(q_patient_data, useKey);
      return result.length > 0;
    } catch (err) {
      return false;
    }
  }
  public async getPatientBasicData(patientid: number | string): Promise<[]> {
    var ptid: number;
    if (typeof patientid === "string") {
      ptid = parseInt(patientid);
    }
    return await promisifyQuery(q_patient_data, [ptid]);
  }
  public async addPersonalInformation(records: NewRegistration): Promise<registrationOutcome | void> {
    const {
      firstname,
      lastname,
      middlename,
      age,
      ageType,
      gender,
      email,
      mobile,
      days,
      months,
      maritalstatus,
      occupation,
      patientOrganization,
      years,
      mobileownership = "self",
    } = records;

    const values = [
      firstname,
      lastname,
      middlename,
      email,
      age,
      ageType,
      `${years}-${months}-${days}`,
      maritalstatus,
      mobile,
      occupation,
      gender,
      patientOrganization,
      mobileownership,
    ];

    const result = await promisifyQuery(q_new_registation, values);
    return { count: result.affectedRows, insertid: result.insertId };
  }

  public async getCustomersRecords(data: PatientRecords): Promise<[]> {
    const { count = 10, mobile, page = 1, fullname, email, patientid, from, to } = data;
    var query = q_filter_patients;

    if (patientid) {
      const is_valid_ptid = await this.checkPatientIdExist(patientid);
      return is_valid_ptid ? await this.getPatientBasicData(patientid) : [];
    }
    const values = [];
    let conditions = [];

    const mob_str = `${mobile}`;
    var isMobright = mobile && mob_str.length == 10 && mob_str.charAt(0) == "0" && !isNaN(mobile);
    var mobileNum: string;
    if (mobile && !isMobright && mob_str.length == 9 && mob_str.charAt(0) != "0") {
      mobileNum = mob_str.padStart(10, "0");
      conditions.push(`mobile_number = ?`);
      values.push(mobileNum);
    }

    if (fullname && fullname.length > 2) {
      conditions.push(`CONCAT(firstname, ' ', COALESCE(middlename, ''), ' ', lastname) LIKE ?`);
      values.push(`%${fullname}%`);
    }
    if (email && email.includes("@")) {
      conditions.push(` email = ?`);
      values.push(email);
    }

    if (from) {
      conditions.push(`date >= ?`);
      values.push(from);
    }

    if (to) {
      conditions.push(`date <= ?`);
      values.push(to);
    }

    if (conditions.length > 0) {
      query += ` WHERE ` + conditions.join(" AND ");
    }

    const offset = (page - 1) * count;
    values.push(count);
    values.push(offset);
    query += ` ORDER BY id DESC LIMIT ? OFFSET ? `;

    try {
      let result = await promisifyQuery(query, values);
      result =
        result.length > 0
          ? result.map((a: any, i: number) => {
              return { ...a, fullname: `${a.firstname} ${a.middlename} ${a.lastname}`, contact: a.mobile_number };
            })
          : [];
      return result;
    } catch (err) {
      return [];
    }
  }
  addressingInformation(paientid: number, records: addressInformation): Promise<boolean | void> {
    throw new Error("Method not implemented.");
  }
  addNewPatient(data: NewRegistration): Promise<number> {
    throw new Error("Method not implemented.");
  }
  updatePersonalInformation(patientdata: NewRegistration): Promise<boolean> {
    throw new Error("Method not implemented.");
  }

  public async getPatientInfoUsingBillingId(billingid: number) {
    const result = await promisifyQuery(q_filter_patient_using_billingid_query, [billingid]);
    return result;
  }
}
