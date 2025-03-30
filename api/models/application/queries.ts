export const _current_record_synchronization: string = `SELECT * FROM testSynchronization ORDER BY synid DESC LIMIT 1`;

export const syncRequestQuery: string = "INSERT INTO testsynchronization (requestedon,targetTest,requestedby)  VALUES (CURRENT_DATE, ?,?)";
