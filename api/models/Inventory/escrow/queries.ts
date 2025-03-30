export const q_getEsrowReqt = `
  SELECT * FROM stocksesrow WHERE requisitionid = ?
`;

export const q_pushNewGenDebitHx = `
  INSERT INTO generalstoredebithx (stockid, batchnumber, brandid, productordersid, debitqty, departmentid)
  VALUES (?, ?, ?, ?, ?, ?)
`;

export const q_updateEscrow = `
  UPDATE stocksesrow SET status = ?
  {{ifReceived}} , receivedon = NOW()
  WHERE requisitionid = ?
`;
