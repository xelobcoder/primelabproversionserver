"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.syncRequestQuery = exports._current_record_synchronization = void 0;
exports._current_record_synchronization = `SELECT * FROM testSynchronization ORDER BY synid DESC LIMIT 1`;
exports.syncRequestQuery = "INSERT INTO testsynchronization (requestedon,targetTest,requestedby)  VALUES (CURRENT_DATE, ?,?)";
