export interface EsrowData {
  productordersid: number;
  stockid: number;
  brandid: number;
  batchnumber: number | string;
  qty?: number;
  type: number | string;
  requisitionid: number;
  departmentid: number;
  served?: boolean | string;
}

export type EscrowOrder = {
  productordersid: number;
  stockid: number;
  brandid: number;
  batchnumber: number | string;
};

export type ServeDeptType = {
  data: any;
  approvedQty: number;
  requisitionid: number;
  departmentid: number;
};

export type UpdateReqtData = {
  quantity: number;
  requisitionid: number;
  status: number | string | boolean;
};




export type updateQtyDeptReceived = {
  quantityReceived: number;
  departmentReceived: number;
  status: string | number;
  employeeid: number;
  requisitionid: number;
};

export type DepartMain = {
  qty: number;
  stockid: number;
  brandid: number;
  batchnumber: string | number;
  departmentid: number;
};