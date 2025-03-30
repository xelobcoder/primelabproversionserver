// import { q_dropSpecificTablePartition, q_dropTableAllPartition, q_reorganization_query } from "./queries";
// import { promisifyQuery, rowAffected } from "./../../../helper.js";

// export async function addPartitionTable() {}

// export async function dropTablePartition(table_name: string) {
//   return await promisifyQuery(q_dropTableAllPartition, [table_name]);
// }

// export async function dropTableSpecificPartition(table_name: string, partitionName: string) {
//   return await promisifyQuery(q_dropSpecificTablePartition, [table_name, partitionName]);
// }

// class Partition {
//   private tablename;
//   constructor(tablename: number) {
//     this.tablename = tablename;
//   }
// }

// export async function reOrganizeTablePartition(max: number, min: number, year: number, basename: string) {
//   var query = q_reorganization_query;
//   var tick = min + 1;
//   let _month = `${max}`.padStart(2, "0");
//   let _splitpartition = `${basename}_${year}_${_month}`;

//   function partitionString(partionname: string, year: number, month: number, isComman: boolean) {
//     var minquery = "";
//     if (month < 12 && month > 0) {
//       minquery += `PARTITION ${partionname} VALUES LESS THAN (${year},${tick + 1})`;
//     } else if (month == 12 && month > 0) {
//       minquery += `PARTITION ${partionname} VALUES LESS THAN (${year + 1},1)`;
//     } else {
//       throw new Error("wrong input provided");
//     }
//     return isComman ? (minquery += ",") : minquery;
//   }

//   while (tick <= max) {
//     const _tick = `${tick}`.padStart(2, "0");
//     const currentPartition = `${basename}_${year}_${_tick}`;
//     tick != max
//       ? (query += partitionString(currentPartition, year, tick, true))
//       : (query += partitionString(currentPartition, year, tick, false));
//     tick++;
//   }

//   query += ")";
//   const result = await promisifyQuery(query, [_splitpartition]);
//   return result;
// }

// export function getTablePartitions(tableName) {}

// async function AddYearPartition(year: number): Promise<boolean> {
//   let currentYear: number = year || new Date().getFullYear();

//   // Retrieve current partitions from the billing table.
//   const partitions = await Billing.getBillingTablePartions();
//   const _currentPartitions: number[] = await Billing.partitionstoYearList(partitions);

//   // Initialize partition if no current partitions are found.
//   if (_currentPartitions.length === 0) {
//     await Billing.initPartitionBilling("billing", currentYear);
//     return true;
//   }

//   /**
//    * Adds a partition for the given range.
//    *
//    * @param {number} range - The range (month) for the partition.
//    * @returns {Promise<boolean>} - Returns true if the partition is added successfully, false otherwise.
//    */
//   const pushPartition = async (range: number): Promise<boolean> => {
//     try {
//       const _range = `${range}`.padStart(2, "0");
//       const partitionName = `billing_${currentYear}_${_range}`;
//       if (range !== 12) {
//         await Billing.executeAddPartitionBilling(partitionName, currentYear, range + 1);
//       } else {
//         await Billing.executeAddPartitionBilling(partitionName, currentYear + 1, 1);
//       }
//       return true;
//     } catch (err) {
//       console.log(err);
//       return false;
//     }
//   };

//   /**
//    * Creates partitions for the missing ranges.
//    *
//    * @param {number[]} availablePartitions - Array of ranges (months) for which partitions to be added.
//    */
//   const loop_create_partition = async (availablePartitions: number[]) => {
//     for (let i = 0; i < availablePartitions.length; i++) {
//       const outcome = await pushPartition(availablePartitions[i]);
//       console.warn(outcome);
//     }
//   };

//   if (_currentPartitions.includes(currentYear) === false) {
//     loop_create_partition([2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]);
//   }

//   const parsePartitionString = (partition: string, index: number): number => {
//     return parseInt(partition.split("_")[index]);
//   };

//   if (!_currentPartitions.includes(currentYear)) {
//     let current = 0;
//     let uniqueYears = [];

//     const availablePartitions: string[] = await Billing.partitionsStrings(partitions);

//     // get all uniques years
//     while (current < availablePartitions.length) {
//       const year = parsePartitionString(availablePartitions[current], 1);
//       if (!uniqueYears.includes(year)) {
//         uniqueYears.push(year);
//       }
//       current++;
//     }

//     for (const year of uniqueYears) {
//       const _yearPartitions = availablePartitions.filter((item, index) => parsePartitionString(item, 1) === year);

//       let breakingpoint: BreakingPoint[] = [];
//       let _incremental = 0;

//       let parsedMonths = _yearPartitions.map((item, index) => parsePartitionString(item, 2));

//       while (_incremental < parsedMonths.length) {
//         let hasMissedGaps: boolean = false;
//         const now = parsedMonths[_incremental];
//         const next = parsedMonths[_incremental + 1];
//         if (next !== undefined) {
//           hasMissedGaps = next - now > 1;
//           if (hasMissedGaps) {
//             breakingpoint.push({ min: now, max: next });
//           }
//         }
//         _incremental++;
//       }

//       if (breakingpoint.length == 0) {
//         let start = parsedMonths[parsedMonths.length - 1] + 1;
//         let missingPartition: number[] = [];
//         while (start <= 12) {
//           missingPartition.push(start);
//           start++;
//         }
//         loop_create_partition(missingPartition);
//       } else {
//         let init = 0;

//         while (init < breakingpoint.length) {
//           const { min, max } = breakingpoint[init];
//           await reOrganizeTablePartition(max, min, year, "billing");
//           init++;
//         }
//       }
//     }
//   }

//   return true;
// }



// // class  version



// import {
//   q_addNewPartition,
//   q_dropSpecificTablePartition,
//   q_dropTableAllPartition,
//   q_getAllpartiton,
//   q_reorganization_query,
// } from "./queries";
// import { promisifyQuery, rowAffected } from "./../../../helper.js";

// import { BreakingPoint } from "./billingclientTypes";
// class PartitionManager {
//   private tablename: string;
//   private basename: string;

//   constructor(tablename: string, basename: string) {
//     this.tablename = tablename;
//     this.basename = basename;
//   }

//   private static async getTablePartitions(tablename: string) {
//     const packets = await promisifyQuery(q_getAllpartiton, [tablename]);
//     return packets[0]["PARTITION_NAME"] != null ? packets : [];
//   }

//   public async partitionstoYearList(data: [] | null): Promise<number[]> {
//     let packets;
//     if (data === null) {
//       packets = await PartitionManager.getTablePartitions(this.tablename);
//     } else {
//       packets = data;
//     }
//     return packets.length === 0 ? [] : packets.map((item: any, index: number) => parseInt(item.PARTITION_NAME.split("_")[1]));
//   }

//   private static async partitionsStrings(packets: []) {
//     if (Array.isArray(packets) && packets.length > 0) {
//       return packets.map((item: any, index: number) => item.PARTITION_NAME);
//     }
//     return [];
//   }

//   async addPartitionTable() {
//     // Implement your logic here
//   }

//   async dropTablePartition() {
//     return await promisifyQuery(q_dropTableAllPartition, [this.tablename]);
//   }

//   async dropTableSpecificPartition(partitionName: string) {
//     return await promisifyQuery(q_dropSpecificTablePartition, [this.tablename, partitionName]);
//   }

//   protected static async reOrganizeTablePartition(max: number, min: number, year: number, basename: string) {
//     var query = q_reorganization_query;
//     var tick = min + 1;
//     let _month = `${max}`.padStart(2, "0");
//     let _splitpartition = `${basename}_${year}_${_month}`;

//     function partitionString(partionname: string, year: number, month: number, isComman: boolean) {
//       var minquery = "";
//       if (month < 12 && month > 0) {
//         minquery += `PARTITION ${partionname} VALUES LESS THAN (${year},${tick + 1})`;
//       } else if (month == 12 && month > 0) {
//         minquery += `PARTITION ${partionname} VALUES LESS THAN (${year + 1},1)`;
//       } else {
//         throw new Error("wrong input provided");
//       }
//       return isComman ? (minquery += ",") : minquery;
//     }

//     while (tick <= max) {
//       const _tick = `${tick}`.padStart(2, "0");
//       const currentPartition = `${basename}_${year}_${_tick}`;
//       tick != max
//         ? (query += partitionString(currentPartition, year, tick, true))
//         : (query += partitionString(currentPartition, year, tick, false));
//       tick++;
//     }

//     query += ")";
//     const result = await promisifyQuery(query, [_splitpartition]);
//     return result;
//   }
//   private static async initPartitionBilling(basename: string, year: number) {
//     var query: string = `ALTER TABLE billing  PARTITION BY RANGE COLUMNS (year,month)
//     (`;
//     let range: number = 1;
//     while (range <= 12) {
//       const month = `${range}`.padStart(2, "0");
//       if (range == 12) {
//         query += `PARTITION ${basename}_${year}_${month} VALUES LESS THAN (${year + 1}, ${1})`;
//       } else {
//         query += `PARTITION ${basename}_${year}_${month} VALUES LESS THAN (${year}, ${range + 1}),`;
//       }
//       range++;
//     }
//     query += ` )`;
//     const result = await promisifyQuery(query);
//     return result.affectedRows;
//   }

//   private static async executeAddPartitionBilling(_partition_name: string, year: number, month: number) {
//     return await promisifyQuery(q_addNewPartition(_partition_name, year, month));
//   }

//   public async addYearPartition(year: number): Promise<boolean> {
//     let currentYear: number = year || new Date().getFullYear();

//     // Retrieve current partitions from the billing table.
//     const partitions = await PartitionManager.getTablePartitions(this.tablename);
//     const _currentPartitions = await this.partitionstoYearList(partitions);

//     // Initialize partition if no current partitions are found.
//     if (_currentPartitions.length === 0) {
//       await PartitionManager.initPartitionBilling(this.tablename, currentYear);
//       return true;
//     }

//     const pushPartition = async (range: number): Promise<boolean> => {
//       try {
//         const _range = `${range}`.padStart(2, "0");
//         const partitionName = `${this.basename}_${currentYear}_${_range}`;
//         if (range !== 12) {
//           await PartitionManager.executeAddPartitionBilling(partitionName, currentYear, range + 1);
//         } else {
//           await PartitionManager.executeAddPartitionBilling(partitionName, currentYear + 1, 1);
//         }
//         return true;
//       } catch (err) {
//         console.log(err);
//         return false;
//       }
//     };

//     const loop_create_partition = async (availablePartitions: number[]) => {
//       for (let i = 0; i < availablePartitions.length; i++) {
//         const outcome = await pushPartition(availablePartitions[i]);
//         console.warn(outcome);
//       }
//     };

//     if (!_currentPartitions.includes(currentYear)) {
//       loop_create_partition([2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]);
//     }

//     const parsePartitionString = (partition: string, index: number): number => {
//       return parseInt(partition.split("_")[index]);
//     };

//     if (!_currentPartitions.includes(currentYear)) {
//       let current = 0;
//       let uniqueYears = [];

//       const availablePartitions: string[] = await PartitionManager.partitionsStrings(partitions);

//       while (current < availablePartitions.length) {
//         const year = parsePartitionString(availablePartitions[current], 1);
//         if (!uniqueYears.includes(year)) {
//           uniqueYears.push(year);
//         }
//         current++;
//       }

//       for (const year of uniqueYears) {
//         const _yearPartitions = availablePartitions.filter((item) => parsePartitionString(item, 1) === year);

//         let breakingpoint: BreakingPoint[] = [];
//         let _incremental = 0;

//         let parsedMonths = _yearPartitions.map((item) => parsePartitionString(item, 2));

//         while (_incremental < parsedMonths.length) {
//           let hasMissedGaps: boolean = false;
//           const now = parsedMonths[_incremental];
//           const next = parsedMonths[_incremental + 1];
//           if (next !== undefined) {
//             hasMissedGaps = next - now > 1;
//             if (hasMissedGaps) {
//               breakingpoint.push({ min: now, max: next });
//             }
//           }
//           _incremental++;
//         }

//         if (breakingpoint.length == 0) {
//           let start = parsedMonths[parsedMonths.length - 1] + 1;
//           let missingPartition: number[] = [];
//           while (start <= 12) {
//             missingPartition.push(start);
//             start++;
//           }
//           loop_create_partition(missingPartition);
//         } else {
//           let init = 0;

//           while (init < breakingpoint.length) {
//             const { min, max } = breakingpoint[init];
//             await PartitionManager.reOrganizeTablePartition(max, min, year, this.basename);
//             init++;
//           }
//         }
//       }
//     }

//     return true;
//   }
// }

// export default PartitionManager;



//  private static async initPartitionBilling(prefix: string, year: number) {
//     var query: string = `ALTER TABLE billing  PARTITION BY RANGE COLUMNS (year,month)
//     (`;
//     let range: number = 1;
//     while (range <= 12) {
//       const month = `${range}`.padStart(2, "0");
//       if (range == 12) {
//         query += `PARTITION ${prefix}_${year}_${month} VALUES LESS THAN (${year + 1}, ${1})`;
//       } else {
//         query += `PARTITION ${prefix}_${year}_${month} VALUES LESS THAN (${year}, ${range + 1}),`;
//       }
//       range++;
//     }
//     query += ` )`;
//     const result = await promisifyQuery(query);
//     return result.affectedRows;
//   }

//   private static async getBillingTablePartions() {
//     const packets = await promisifyQuery(q_getAllpartiton);
//     return packets[0]["PARTITION_NAME"] != null ? packets : [];
//   }

//   private static async partitionstoYearList(data: []) {
//     const packets = data || (await this.getBillingTablePartions());
//     return packets.length === 0 ? [] : packets.map((item: any, index: number) => item.PARTITION_NAME.split("_")[1]);
//   }




//   private static async partitionsStrings(packets: []) {
//     if (Array.isArray(packets) && packets.length > 0) {
//       return packets.map((item: any, index: number) => item.PARTITION_NAME);
//     }
//     return [];
//   }

//   public static async billingPartitionPrunner(startdate: string, enddate: string) {
//     if (!startdate || !startdate) throw new Error("required startdate and enddate not provided");
//     let partitions = await this.getBillingTablePartions();
//     if (partitions.length == 0) return [];

//     const startYear = new Date(startdate).getFullYear();
//     const endYear = new Date(enddate).getFullYear();
//     const stMonth = new Date(startdate).getMonth();
//     const edMonth = new Date(enddate).getMonth();

//     partitions = partitions.map((a, index: number) => a.PARTITION_NAME);

//     partitions.filter((_part, index: number) => {
//       const [_, year, month] = _part.split("_");
//       return year == startYear || year == endYear || (endYear == year && stMonth == month) || (startYear == year && edMonth == month);
//     });
//     return partitions.length > 0 ? partitions.join(",") : [];
//   }

//   private static async executeAddPartitionBilling(_partition_name: string, year: number, month: number) {
//     return await promisifyQuery(q_addNewPartition(_partition_name, year, month));
//   }

//   async dropPartition(partitionName: string) {
//     return await promisifyQuery(`ALTER TABLE billing DROP PARTITION \`${partitionName}\``);
//   }

//   /**
//    * Adds partitions for the given year to the billing table.
//    *
//    * @param {number} year - The year for which to add partitions. If not provided, defaults to the current year.
//    * @returns {Promise<boolean>} - Returns true if the operation is successful, otherwise throws an error.
//    */
//   async AddYearPartition(year: number): Promise<boolean> {
//     let currentYear: number = year || new Date().getFullYear();

//     // Retrieve current partitions from the billing table.
//     const partitions = await Billing.getBillingTablePartions();
//     const _currentPartitions: number[] = await Billing.partitionstoYearList(partitions);

//     // Initialize partition if no current partitions are found.
//     if (_currentPartitions.length === 0) {
//       await Billing.initPartitionBilling("billing", currentYear);
//       return true;
//     }

//     /**
//      * Adds a partition for the given range.
//      *
//      * @param {number} range - The range (month) for the partition.
//      * @returns {Promise<boolean>} - Returns true if the partition is added successfully, false otherwise.
//      */
//     const pushPartition = async (range: number): Promise<boolean> => {
//       try {
//         const _range = `${range}`.padStart(2, "0");
//         const partitionName = `billing_${currentYear}_${_range}`;
//         if (range !== 12) {
//           await Billing.executeAddPartitionBilling(partitionName, currentYear, range + 1);
//         } else {
//           await Billing.executeAddPartitionBilling(partitionName, currentYear + 1, 1);
//         }
//         return true;
//       } catch (err) {
//         console.log(err);
//         return false;
//       }
//     };

//     /**
//      * Creates partitions for the missing ranges.
//      *
//      * @param {number[]} availablePartitions - Array of ranges (months) for which partitions to be added.
//      */
//     const loop_create_partition = async (availablePartitions: number[]) => {
//       for (let i = 0; i < availablePartitions.length; i++) {
//         const outcome = await pushPartition(availablePartitions[i]);
//         console.warn(outcome);
//       }
//     };

//     if (_currentPartitions.includes(currentYear) === false) {
//       loop_create_partition([2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]);
//     }

//     const parsePartitionString = (partition: string, index: number): number => {
//       return parseInt(partition.split("_")[index]);
//     };

//     if (!_currentPartitions.includes(currentYear)) {
//       let current = 0;
//       let uniqueYears = [];

//       const availablePartitions: string[] = await Billing.partitionsStrings(partitions);

//       // get all uniques years
//       while (current < availablePartitions.length) {
//         const year = parsePartitionString(availablePartitions[current], 1);
//         if (!uniqueYears.includes(year)) {
//           uniqueYears.push(year);
//         }
//         current++;
//       }

//       for (const year of uniqueYears) {
//         const _yearPartitions = availablePartitions.filter((item, index) => parsePartitionString(item, 1) === year);

//         let breakingpoint: BreakingPoint[] = [];
//         let _incremental = 0;

//         let parsedMonths = _yearPartitions.map((item, index) => parsePartitionString(item, 2));

//         while (_incremental < parsedMonths.length) {
//           let hasMissedGaps: boolean = false;
//           const now = parsedMonths[_incremental];
//           const next = parsedMonths[_incremental + 1];
//           if (next !== undefined) {
//             hasMissedGaps = next - now > 1;
//             if (hasMissedGaps) {
//               breakingpoint.push({ min: now, max: next });
//             }
//           }
//           _incremental++;
//         }

//         if (breakingpoint.length == 0) {
//           let start = parsedMonths[parsedMonths.length - 1] + 1;
//           let missingPartition: number[] = [];
//           while (start <= 12) {
//             missingPartition.push(start);
//             start++;
//           }
//           loop_create_partition(missingPartition);
//         } else {
//           let init = 0;

//           while (init < breakingpoint.length) {
//             const { min, max } = breakingpoint[init];
//             await reOrganizeTablePartition(max, min, year, "billing");
//             init++;
//           }
//         }
//       }
//     }

//     return true;
//   }