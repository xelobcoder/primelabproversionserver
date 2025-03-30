"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const queries_1 = require("./queries");
const helper_1 = require("../../../helper");
class Registration {
    isClientSame(clientdata) {
        throw new Error("Method not implemented.");
    }
    checkEmailOrMobileExist(email, mobile) {
        throw new Error("Method not implemented.");
    }
    async checkPatientIdExist(patientid) {
        try {
            let useKey = patientid ? patientid : this.patientid;
            let result = await (0, helper_1.promisifyQuery)(queries_1.q_patient_data, useKey);
            return result.length > 0;
        }
        catch (err) {
            return false;
        }
    }
    async getPatientBasicData(patientid) {
        var ptid;
        if (typeof patientid === "string") {
            ptid = parseInt(patientid);
        }
        return await (0, helper_1.promisifyQuery)(queries_1.q_patient_data, [ptid]);
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
        const result = await (0, helper_1.promisifyQuery)(queries_1.q_new_registation, values);
        return { count: result.affectedRows, insertid: result.insertId };
    }
    async getCustomersRecords(data) {
        const { count = 10, mobile, page = 1, fullname, email, patientid, from, to } = data;
        var query = queries_1.q_filter_patients;
        if (patientid) {
            const is_valid_ptid = await this.checkPatientIdExist(patientid);
            return is_valid_ptid ? await this.getPatientBasicData(patientid) : [];
        }
        const values = [];
        let conditions = [];
        const mob_str = `${mobile}`;
        var isMobright = mobile && mob_str.length == 10 && mob_str.charAt(0) == "0" && !isNaN(mobile);
        var mobileNum;
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
            let result = await (0, helper_1.promisifyQuery)(query, values);
            result =
                result.length > 0
                    ? result.map((a, i) => {
                        return Object.assign(Object.assign({}, a), { fullname: `${a.firstname} ${a.middlename} ${a.lastname}`, contact: a.mobile_number });
                    })
                    : [];
            return result;
        }
        catch (err) {
            return [];
        }
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
    async getPatientInfoUsingBillingId(billingid) {
        const result = await (0, helper_1.promisifyQuery)(queries_1.q_filter_patient_using_billingid_query, [billingid]);
        return result;
    }
}
exports.default = Registration;
