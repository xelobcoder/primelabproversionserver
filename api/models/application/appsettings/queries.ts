export const q_application_setting: string = `SELECT * FROM applicationsettings`;

export const q_active_tax = `SELECT * FROM tax WHERE apply = 'Yes'`;

export const q_get_email_pref = "SELECT * FROM emailpreference ORDER BY id DESC LIMIT 1";

export const q_update_general_app_set: string = `INSERT INTO applicationsettings (bulkregistration,fontsize,textcolor,BackgroundColor,DeactivateBilling24hrs,PaidBillsBeforeTransaction,completeFlow,approvalbeforeprinting,emailNotification,includeTax) VALUES (?,?,?,?,?,?,?,?,?,?)`;

export const q_TruncateTable: string = `TRUNCATE TABLE applicationsettings`;

export const q_update_sms_settings: string = "UPDATE applicationsettings SET smsSettings = ?";

export const q_get_sms_settings: string = "SELECT smsSettings FROM applicationsettings";

export const q_truncateEmailPreference: string = "TRUNCATE TABLE emailpreference";

export const q_update_email_preference: string =
  "INSERT INTO emailpreference (registration,result,rejection,approval,transactions,birthday,billing) VALUES (?,?,?,?,?,?,?)";


export const q_registration_settings: string = "SELECT * FROM registrationsettings LIMIT 1";

export const q_update_reg_fields: string = "UPDATE registrationsettings SET fields = ?, updatedby = ?, updatedon = NOW() WHERE id = ?";

export const q_insert_reg_settings: string = "INSERT INTO registrationsettings (fields,updatedby) VALUES (?,?)";

export const q_general_email_settings: string = "SELECT * FROM generalemailsettings";

export const q_truncateGeneralSettings: string = "TRUNCATE TABLE generalemailsettings";

export const GET_RESULT_SETTINGS = `SELECT resultsettings FROM resultsettings`;

export const INSERT_RESULT_SETTINGS = `INSERT INTO resultsettings (resultsettings) VALUES (?)`;

export const UPDATE_RESULT_SETTINGS = `UPDATE resultsettings SET resultsettings = ? WHERE id = 1`;
