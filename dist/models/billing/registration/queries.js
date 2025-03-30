"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.q_patient_data = exports.q_new_registation = void 0;
exports.q_new_registation = `INSERT INTO new_patients (firstname, lastname, middlename, email, age, agetype, dob, marital_status, mobile_number, occupation, gender, organization, contactpointer)
      VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)`;
exports.q_patient_data = "SELECT * FROM new_patients WHERE PATIENTID = ?";
