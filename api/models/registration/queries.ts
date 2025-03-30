export const q_new_registation = `INSERT INTO new_patients (firstname, lastname, middlename, email, age, agetype, dob, marital_status, mobile_number, occupation, gender, organization, contactpointer)
      VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)`;

export const q_patient_data = "SELECT * FROM new_patients WHERE patientid = ?";

export const q_filter_patients = "SELECT * FROM new_patients";

export const q_filter_patient_using_billingid_query = `SELECT * FROM new_patients AS np INNER JOIN billing AS b ON b.patientid = np.patientid  WHERE b.billingid = ?`;