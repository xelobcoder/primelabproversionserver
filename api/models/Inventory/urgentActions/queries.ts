export const GET_NEAR_EXPIRY_QUERY = `
  SELECT batchnumber, brand, stockid
  FROM your_table_name
  -- Add your conditions/ordering as needed
`;

export const GET_EXPIRED_COUNT_QUERY = `
  SELECT batchnumber, receiveddate, expirydate, quantityReceived, name, expiredDisposed, stockid, brand
  FROM your_table_name
  -- Add your conditions/ordering as needed
`;

export const GET_BELOW_ALERT_QUERY = `
  SELECT *
  FROM your_table_name
  -- Add your conditions/ordering as needed
`;

export const GET_INCOMP_ORDERS_COUNT_QUERY = `
  SELECT *
  FROM your_table_name
  -- Add your conditions/ordering as needed
`;

export const GET_COMPLETE_ORDERS_COUNT_QUERY = `
  SELECT *
  FROM your_table_name
  -- Add your conditions/ordering as needed
`;
