"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GET_COMPLETE_ORDERS_COUNT_QUERY = exports.GET_INCOMP_ORDERS_COUNT_QUERY = exports.GET_BELOW_ALERT_QUERY = exports.GET_EXPIRED_COUNT_QUERY = exports.GET_NEAR_EXPIRY_QUERY = void 0;
exports.GET_NEAR_EXPIRY_QUERY = `
  SELECT batchnumber, brand, stockid
  FROM your_table_name
  -- Add your conditions/ordering as needed
`;
exports.GET_EXPIRED_COUNT_QUERY = `
  SELECT batchnumber, receiveddate, expirydate, quantityReceived, name, expiredDisposed, stockid, brand
  FROM your_table_name
  -- Add your conditions/ordering as needed
`;
exports.GET_BELOW_ALERT_QUERY = `
  SELECT *
  FROM your_table_name
  -- Add your conditions/ordering as needed
`;
exports.GET_INCOMP_ORDERS_COUNT_QUERY = `
  SELECT *
  FROM your_table_name
  -- Add your conditions/ordering as needed
`;
exports.GET_COMPLETE_ORDERS_COUNT_QUERY = `
  SELECT *
  FROM your_table_name
  -- Add your conditions/ordering as needed
`;
