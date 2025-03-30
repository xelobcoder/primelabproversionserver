import EmailService from "./EmailCore";

class EmailScheduler extends EmailService {
  private scheduleTime: Date;

  constructor(employeeid: number, datetime: Date) {
    super(employeeid);
    this.scheduleTime = datetime;
  }

  public set scheduleDatetime(datetime: Date) {
    if (!datetime) throw new Error("datetime not provided");
    this.scheduleTime = new Date(datetime);
  }

  public get scheduleDatetime(): Date {
    return this.scheduleTime;
  }
}

export default EmailScheduler;
