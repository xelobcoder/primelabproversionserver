const EmailService = require("./EmailCore")

class EmailScheduler extends EmailService {
  constructor(employeeid, datetime) {
    super(employeeid);
    this.scheduleTime = datetime;
  }

  set scheduleDatetime(datetime) {
    if (!datetime)
      throw new Error('datetime not provided');
    this.scheduleTime = new Date(datetime);
  }

  get scheduleDatetime() {
    return this.scheduleTime;
  }
}




module.exports = EmailScheduler;