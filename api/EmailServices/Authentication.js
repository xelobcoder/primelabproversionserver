const EmailService = require("./EmailCore")
class Authentication extends EmailService {
  constructor(employeeid, role) {
    super(employeeid)
    this.role = role;
    if (!this.role || !this.employeeid) {
      throw new Error("role && employeeid is critical")
    }
  }
}

module.export = Authentication
