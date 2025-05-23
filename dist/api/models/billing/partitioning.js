"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const queries_1 = require("./queries");
const helper_js_1 = require("./../../../helper.js");
/**
 * Manages partitions for a specified database table.
 */
class PartitionManager {
    /**
     * Constructs a PartitionManager instance.
     * @param tablename The name of the database table to manage partitions for.
     * @param basename The base name used for partition identifiers.
     */
    constructor(tablename, basename) {
        this.tablename = tablename;
        this.basename = basename;
    }
    /**
     * Retrieves all partitions associated with a table.
     * @param tablename The name of the table to fetch partitions for.
     * @returns A list of partition names.
     */
    static async getTablePartitions(tablename) {
        const packets = await (0, helper_js_1.promisifyQuery)(queries_1.q_getAllpartiton, [tablename]);
        return packets[0]["PARTITION_NAME"] != null ? packets : [];
    }
    /**
     * Converts a list of partition names into a list of years.
     * @param data Optional list of partition data to parse.
     * @returns A list of years extracted from partition names.
     */
    async partitionstoYearList(data) {
        let packets;
        if (data === null) {
            packets = await PartitionManager.getTablePartitions(this.tablename);
        }
        else {
            packets = data;
        }
        return packets.length === 0 ? [] : packets.map((item, index) => parseInt(item.PARTITION_NAME.split("_")[1]));
    }
    /**
     * Retrieves strings representing all partitions.
     * @param packets List of partition data to convert to strings.
     * @returns A list of partition names.
     */
    static async partitionsStrings(packets) {
        if (Array.isArray(packets) && packets.length > 0) {
            return packets.map((item, index) => item.PARTITION_NAME);
        }
        return [];
    }
    /**
     * Adds a new partition to the managed table.
     */
    async addPartitionTable() {
        // Implement your logic here
    }
    /**
     * Drops all partitions from the managed table.
     * @returns A promise indicating the success of the operation.
     */
    async dropTablePartition() {
        return await (0, helper_js_1.promisifyQuery)(queries_1.q_dropTableAllPartition, [this.tablename]);
    }
    /**
     * Drops a specific partition from the managed table.
     * @param partitionName The name of the partition to drop.
     * @returns A promise indicating the success of the operation.
     */
    async dropTableSpecificPartition(partitionName) {
        return await (0, helper_js_1.promisifyQuery)(queries_1.q_dropSpecificTablePartition, [this.tablename, partitionName]);
    }
    /**
     * Reorganizes partitions of the table based on specified criteria.
     * @param max The maximum value for reorganization.
     * @param min The minimum value for reorganization.
     * @param year The year associated with the partitions.
     * @param basename The base name used for partition identifiers.
     * @returns A promise indicating the success of the reorganization.
     */
    static async reOrganizeTablePartition(max, min, year, basename) {
        var query = queries_1.q_reorganization_query;
        var tick = min + 1;
        let _month = `${max}`.padStart(2, "0");
        let _splitpartition = `${basename}_${year}_${_month}`;
        function partitionString(partionname, year, month, isComman) {
            var minquery = "";
            if (month < 12 && month > 0) {
                minquery += `PARTITION ${partionname} VALUES LESS THAN (${year},${tick + 1})`;
            }
            else if (month == 12 && month > 0) {
                minquery += `PARTITION ${partionname} VALUES LESS THAN (${year + 1},1)`;
            }
            else {
                throw new Error("wrong input provided");
            }
            return isComman ? (minquery += ",") : minquery;
        }
        while (tick <= max) {
            const _tick = `${tick}`.padStart(2, "0");
            const currentPartition = `${basename}_${year}_${_tick}`;
            tick != max
                ? (query += partitionString(currentPartition, year, tick, true))
                : (query += partitionString(currentPartition, year, tick, false));
            tick++;
        }
        query += ")";
        const result = await (0, helper_js_1.promisifyQuery)(query, [_splitpartition]);
        return result;
    }
    /**
     * Prunes Table partitions based on the provided start and end dates.
     *
     * This method retrieves all partitions for the table managed by this instance and filters them
     * based on the provided start and end dates. It returns a comma-separated string of partition names
     * that fall within the specified date range.
     *
     * @param startdate The start date for pruning partitions (format: YYYY-MM-DD).
     * @param enddate The end date for pruning partitions (format: YYYY-MM-DD).
     * @returns A promise that resolves to a comma-separated string of partition names or an empty array if no partitions match the criteria.
     * @throws An error if the startdate or enddate are not provided.
     */
    async TablePartitionPrunner(startdate, enddate) {
        if (!startdate || !enddate)
            throw new Error("required startdate and enddate not provided");
        let partitions = await PartitionManager.getTablePartitions(this.tablename);
        if (partitions.length == 0)
            return [];
        const startYear = new Date(startdate).getFullYear();
        const endYear = new Date(enddate).getFullYear();
        const stMonth = new Date(startdate).getMonth();
        const edMonth = new Date(enddate).getMonth();
        partitions = partitions.map((a, index) => a.PARTITION_NAME);
        partitions = partitions.filter((_part, index) => {
            const [_, year, month] = _part.split("_");
            return year == startYear || year == endYear || (endYear == year && stMonth == month) || (startYear == year && edMonth == month);
        });
        return partitions.length > 0 ? partitions.join(",") : [];
    }
    /**
     * Initializes partitions for the billing table.
     * @param basename The base name used for partition identifiers.
     * @param year The year associated with the partitions.
     * @returns A promise indicating the number of affected rows.
     */
    static async initPartitionBilling(basename, year) {
        var query = `ALTER TABLE billing  PARTITION BY RANGE COLUMNS (year,month) 
    (`;
        let range = 1;
        while (range <= 12) {
            const month = `${range}`.padStart(2, "0");
            if (range == 12) {
                query += `PARTITION ${basename}_${year}_${month} VALUES LESS THAN (${year + 1}, ${1})`;
            }
            else {
                query += `PARTITION ${basename}_${year}_${month} VALUES LESS THAN (${year}, ${range + 1}),`;
            }
            range++;
        }
        query += ` )`;
        const result = await (0, helper_js_1.promisifyQuery)(query);
        return result.affectedRows;
    }
    /**
     * Executes the addition of a new partition to the billing table.
     * @param _partition_name The name of the partition to add.
     * @param year The year associated with the partition.
     * @param month The month associated with the partition.
     * @returns A promise indicating the success of the operation.
     */
    static async executeAddPartitionBilling(_partition_name, year, month) {
        return await (0, helper_js_1.promisifyQuery)((0, queries_1.q_addNewPartition)(_partition_name, year, month));
    }
    /**
     * Adds a partition for a specific year to the managed table.
     * @param year The year for which to add partitions.
     * @returns A promise indicating the success of the operation.
     */
    async addYearPartition(year) {
        let currentYear = year || new Date().getFullYear();
        // Retrieve current partitions from the billing table.
        const partitions = await PartitionManager.getTablePartitions(this.tablename);
        const _currentPartitions = await this.partitionstoYearList(partitions);
        // Initialize partition if no current partitions are found.
        if (_currentPartitions.length === 0) {
            await PartitionManager.initPartitionBilling(this.tablename, currentYear);
            return true;
        }
        const pushPartition = async (range) => {
            try {
                const _range = `${range}`.padStart(2, "0");
                const partitionName = `${this.basename}_${currentYear}_${_range}`;
                if (range !== 12) {
                    await PartitionManager.executeAddPartitionBilling(partitionName, currentYear, range + 1);
                }
                else {
                    await PartitionManager.executeAddPartitionBilling(partitionName, currentYear + 1, 1);
                }
                return true;
            }
            catch (err) {
                console.log(err);
                return false;
            }
        };
        const loop_create_partition = async (availablePartitions) => {
            for (let i = 0; i < availablePartitions.length; i++) {
                const outcome = await pushPartition(availablePartitions[i]);
                console.warn(outcome);
            }
        };
        if (!_currentPartitions.includes(currentYear)) {
            loop_create_partition([2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]);
        }
        const parsePartitionString = (partition, index) => {
            return parseInt(partition.split("_")[index]);
        };
        if (!_currentPartitions.includes(currentYear)) {
            let current = 0;
            let uniqueYears = [];
            const availablePartitions = await PartitionManager.partitionsStrings(partitions);
            while (current < availablePartitions.length) {
                const year = parsePartitionString(availablePartitions[current], 1);
                if (!uniqueYears.includes(year)) {
                    uniqueYears.push(year);
                }
                current++;
            }
            for (const year of uniqueYears) {
                const _yearPartitions = availablePartitions.filter((item) => parsePartitionString(item, 1) === year);
                let breakingpoint = [];
                let _incremental = 0;
                let parsedMonths = _yearPartitions.map((item) => parsePartitionString(item, 2));
                while (_incremental < parsedMonths.length) {
                    let hasMissedGaps = false;
                    const now = parsedMonths[_incremental];
                    const next = parsedMonths[_incremental + 1];
                    if (next !== undefined) {
                        hasMissedGaps = next - now > 1;
                        if (hasMissedGaps) {
                            breakingpoint.push({ min: now, max: next });
                        }
                    }
                    _incremental++;
                }
                if (breakingpoint.length == 0) {
                    let start = parsedMonths[parsedMonths.length - 1] + 1;
                    let missingPartition = [];
                    while (start <= 12) {
                        missingPartition.push(start);
                        start++;
                    }
                    loop_create_partition(missingPartition);
                }
                else {
                    let init = 0;
                    while (init < breakingpoint.length) {
                        const { min, max } = breakingpoint[init];
                        await PartitionManager.reOrganizeTablePartition(max, min, year, this.basename);
                        init++;
                    }
                }
            }
        }
        return true;
    }
}
exports.default = PartitionManager;
