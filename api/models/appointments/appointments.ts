import { promisifyQuery, rowAffected } from "../../../helper";
import { type TAppointment, type Tpagination, months, slots } from "./appointmentTypes";

class Appointment {
  employeeid: number;
  private connection = promisifyQuery;
  private _affectedRows = rowAffected;
  constructor(employeeid: number) {
    this.employeeid = employeeid;
  }

  private async isAppointmentTimeAvailable(date: string, time: string) {
    let refined_date: string = date;
    if (refined_date.includes("T")) {
      refined_date = refined_date.split("T")[0];
    }
    const _mysql_query = "SELECT * FROM appointments WHERE appointment_date = ? AND appointment_time = ?";
    const rows = await this.connection(_mysql_query, [refined_date, time]);
    return !(Array.isArray(rows) && rows.length > 0);
  }
  public async createAppointment(data: TAppointment) {
    const { patientid, duration, appointment_date, appointment_time, inviteMethod, purpose, title, preference, practioner, location } =
      data;
    if (!patientid) throw new Error("patientid missing");

    if (!(await this.isAppointmentTimeAvailable(appointment_date, appointment_time))) {
      return false;
    }
    const createQuery =
      "INSERT INTO appointments(patientid,duration,appointment_time,appointment_date,inviteMethod,purpose,title,preference,practioner,location) VALUES(?,?,?,?,?,?,?,?,?,?)";

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

  public async getPatientAppointmentHistory(patientid: number, count: number = 10, page: number = 1) {
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
    return await promisifyQuery(query, [patientid, count, page]);
  }

  public async loadMonthAppointments(month: number | string) {
    let searchMonth = month;
    if (typeof month === "string") {
      searchMonth = months[month];
    }

    if (searchMonth !== undefined) return this.connection("SELECT * FROM appointments WHERE MONTH(appointment_date) = ?", [month]);
    return [];
  }

  private getCurrentDateString(datestring: Date | string): string {
    const date = new Date(datestring);
    return `${date.getFullYear()}-${date.getMonth() + 1}-${`${date.getDate()}`.padStart(2, "0")}`;
  }

  private convertTimeMinutes(time: string) {
    if (time.includes(":")) {
      const [hour, minutes] = time.split(":");
      const parsedhour: number = parseInt(hour);
      const parsedminutes: number = parseInt(minutes);
      return parsedhour * 60 + parsedminutes;
    }
  }

  private popAppointment(range: number, startpoint: number, array: string[]) {
    return array.filter((item, index) => !(index >= startpoint && index <= startpoint + range - 1));
  }

  public async getPractionerAvailableTime(employeeid: number, appointment_date: Date | string) {
    const currentDate = this.getCurrentDateString(appointment_date);
    const dataset = await this.connection(
      "SELECT duration, appointment_time FROM appointments WHERE appointment_date = ? AND practioner = ?",
      [currentDate, employeeid]
    );
    if (dataset.length === 0) return slots;
    let availSlots: string[] = [...slots];
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

  public async getDaySchedules(type: string, employeeid: number, pquery: Tpagination) {
    let query = "SELECT * FROM appointments WHERE appointment_date = CURRENT_DATE";
    const values: number[] = [];
    if (employeeid && !isNaN(employeeid) && type !== "general") {
      query += " AND practioner = ? LIMIT ? OFFSET ? ";
      typeof employeeid === "string" ? values.push(parseInt(employeeid)) : values.push(employeeid);
    }
    values.push(pquery.count);
    values.push(pquery.page);
    return await this.connection(query, values);
  }

  public getAppointmentCount() { }
}

// new Appointment(12).getDaySchedules("general", 44, { count: 10, page: 1 });
export default Appointment;
