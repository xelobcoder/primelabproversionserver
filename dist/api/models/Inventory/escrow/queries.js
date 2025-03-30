"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.q_updateEscrow = exports.q_pushNewGenDebitHx = exports.q_getEsrowReqt = void 0;
exports.q_getEsrowReqt = `
  SELECT * FROM stocksesrow WHERE requisitionid = ?
`;
exports.q_pushNewGenDebitHx = `
  INSERT INTO generalstoredebithx (stockid, batchnumber, brandid, productordersid, debitqty, departmentid)
  VALUES (?, ?, ?, ?, ?, ?)
`;
exports.q_updateEscrow = `
  UPDATE stocksesrow SET status = ?
  {{ifReceived}} , receivedon = NOW()
  WHERE requisitionid = ?
`;
