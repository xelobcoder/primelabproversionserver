"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const helper_1 = require("../../../helper");
const appointmentTypes_1 = require("./appointmentTypes");
class Appointment {
    constructor(employeeid) {
        this.connection = helper_1.promisifyQuery;
        this._affectedRows = helper_1.rowAffected;
        this.employeeid = employeeid;
    }
    async isAppointmentTimeAvailable(date, time) {
        let refined_date = date;
        if (refined_date.includes("T")) {
            refined_date = refined_date.split("T")[0];
        }
        const _mysql_query = "SELECT * FROM appointments WHERE appointment_date = ? AND appointment_time = ?";
        const rows = await this.connection(_mysql_query, [refined_date, time]);
        return !(Array.isArray(rows) && rows.length > 0);
    }
    async createAppointment(data) {
        const { patientid, duration, appointment_date, appointment_time, inviteMethod, purpose, title, preference, practioner, location } = data;
        if (!patientid)
            throw new Error("patientid missing");
        if (!(await this.isAppointmentTimeAvailable(appointment_date, appointment_time))) {
            return false;
        }
        const createQuery = "INSERT INTO appointments(patientid,duration,appointment_time,appointment_date,inviteMethod,purpose,title,preference,practioner,location) VALUES(?,?,?,?,?,?,?,?,?,?)";
        const result = await this.connection(createQuery, [
            patientid,
            duration,
            appointment_time,
            appointment_date,
            inviteMethod,
            purpose,
            title,
            preference,
            practioner,
            location,
        ]);
        return this._affectedRows(result);
    }
    async getPatientAppointmentHistory(patientid, count = 10, page = 1) {
        const query = `SELECT 
    a.appointment_date,
    a.appointment_time,
    a.duration,
    a.preference,
    a.inviteMethod,
    a.purpose,
    a.location,
    a.title,
    a.status,
    r.username AS practioner
    FROM appointments AS a INNER JOIN roles AS r
    ON a.practioner = r.employeeid
    WHERE a.patientid = ? ORDER BY a.refid DESC LIMIT ? OFFSET ?`;
        return await (0, helper_1.promisifyQuery)(query, [patientid, count, page]);
    }
    async loadMonthAppointments(month) {
        let searchMonth = month;
        if (typeof month === "string") {
            searchMonth = appointmentTypes_1.months[month];
        }
        if (searchMonth !== undefined)
            return this.connection("SELECT * FROM appointments WHERE MONTH(appointment_date) = ?", [month]);
        return [];
    }
    getCurrentDateString(datestring) {
        const date = new Date(datestring);
        return `${date.getFullYear()}-${date.getMonth() + 1}-${`${date.getDate()}`.padStart(2, "0")}`;
    }
    convertTimeMinutes(time) {
        if (time.includes(":")) {
            const [hour, minutes] = time.split(":");
            const parsedhour = parseInt(hour);
            const parsedminutes = parseInt(minutes);
            return parsedhour * 60 + parsedminutes;
        }
    }
    popAppointment(range, startpoint, array) {
        return array.filter((item, index) => !(index >= startpoint && index <= startpoint + range - 1));
    }
    async getPractionerAvailableTime(employeeid, appointment_date) {
        const currentDate = this.getCurrentDateString(appointment_date);
        const dataset = await this.connection("SELECT duration, appointment_time FROM appointments WHERE appointment_date = ? AND practioner = ?", [currentDate, employeeid]);
        if (dataset.length === 0)
            return appointmentTypes_1.slots;
        let availSlots = [...appointmentTypes_1.slots];
        for (let i = 0; i < dataset.length; i++) {
            const { duration, appointment_time } = dataset[i];
            const aIndex = availSlots.findIndex((u, i) => u.trim() === appointment_time.trim());
            switch (parseInt(duration)) {
                case 30:
                    availSlots = this.popAppointment(1, aIndex, availSlots);
                    break;
                case 60:
                    availSlots = this.popAppointment(2, aIndex, availSlots);
                    break;
                case 90:
                    availSlots = this.popAppointment(3, aIndex, availSlots);
                    break;
                case 120:
                    availSlots = this.popAppointment(4, aIndex, availSlots);
                    break;
                default:
                    availSlots;
            }
        }
        return availSlots;
    }
    async getDaySchedules(type, employeeid, pquery) {
        let query = "SELECT * FROM appointments WHERE appointment_date = CURRENT_DATE";
        const values = [];
        if (employeeid && !isNaN(employeeid) && type !== "general") {
            query += " AND practioner = ? LIMIT ? OFFSET ? ";
            typeof employeeid === "string" ? values.push(parseInt(employeeid)) : values.push(employeeid);
        }
        values.push(pquery.count);
        values.push(pquery.page);
        return await this.connection(query, values);
    }
    getAppointmentCount() { }
}
// new Appointment(12).getDaySchedules("general", 44, { count: 10, page: 1 });
exports.default = Appointment;
