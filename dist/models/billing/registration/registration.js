"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Registration = void 0;
const queries_1 = require("./queries");
const { customError, promisifyQuery, rowAffected } = require("../../../../helpers");
class Registration {
    isClientSame(clientdata) {
        throw new Error("Method not implemented.");
    }
    checkEmailOrMobileExist(email, mobile) {
        throw new Error("Method not implemented.");
    }
    async checkPatientIdExist(patientid) {
        try {
            let useKey;
            useKey = patientid ? patientid : this.patientid;
            let result = await promisifyQuery(queries_1.q_patient_data, useKey);
            return result.length > 0;
        }
        catch (err) {
            return false;
        }
    }
    getPatientBasicData() {
        throw new Error("Method not implemented.");
    }
    async addPersonalInformation(records) {
        const { firstname, lastname, middlename, age, ageType, gender, email, mobile, days, months, maritalstatus, occupation, patientOrganization, years, mobileownership = "self", } = records;
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
        const result = await promisifyQuery(queries_1.q_new_registation, values);
        return { count: result.affectedRows, insertid: result.insertId };
    }
    addressingInformation(paientid, records) {
        throw new Error("Method not implemented.");
    }
    addNewPatient(data) {
        throw new Error("Method not implemented.");
    }
    updatePersonalInformation(patientdata) {
        throw new Error("Method not implemented.");
    }
}
exports.Registration = Registration;
