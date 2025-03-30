interface ISecurity {
  readonly employeeid: string;
  readonly loginDuration: number;
  sqlConnection: any;
  isMaster: boolean;

  /**
   * Checks if `employeeid` is defined.
   * @returns {boolean} True if `employeeid` is defined, false otherwise.
   */
  isEmployeeid(): boolean;

  /**
   * Creates a JWT session ID based on `employeeid`.
   * @returns {Promise<string>} The JWT session ID.
   */
  createSessionId(): Promise<string>;

  /**
   * Checks if a valid login duration is provided.
   * @returns {boolean} True if valid duration is provided, false otherwise.
   */
  validDurationProvided(): boolean;

  /**
   * Inserts login history into the database.
   * @param {any} browserInformation - Browser information object.
   * @returns {Promise<number>} Expiry time of the session.
   * @throws Will throw an error if `employeeid` is not provided or duration is invalid.
   */
  insertLoginHistory(browserInformation: any): Promise<number>;

  /**
   * Returns the current time in milliseconds.
   * @returns {number} Current time in milliseconds.
   */
  currentTimeInMillis(): number;

  /**
   * Retrieves the current count of user logins.
   * @returns {Promise<number>} The count of user logins.
   */
  getCurrentLoginCounts(): Promise<number>;

  /**
   * Retrieves current user's login sessions.
   * @returns {Promise<any[]>} Current user's login sessions.
   */
  getCurrentUserLoginSessions(): Promise<any[]>;

  /**
   * Retrieves current user's login sessions with details.
   * @returns {Promise<any[]>} Current user's login sessions with details.
   */
  getCurrentUserLoginSessionsWithDetails(): Promise<any[]>;

  /**
   * Checks if the user can initiate a login.
   * @returns {Promise<boolean>} True if user can initiate a login, false otherwise.
   */
  getCanInitiateLogin(): Promise<boolean>;

  /**
   * Destroys user sessions and updates database accordingly.
   * @returns {Promise<boolean>} True if sessions are successfully destroyed, false otherwise.
   */
  destroyUserSessions(): Promise<boolean>;

  /**
   * Retrieves employee's login history.
   * @param {number} page - Page number for pagination.
   * @param {number} count - Number of records per page.
   * @returns {Promise<any[]>} Employee's login history.
   */
  getEmployeeLoginHistory(page?: number, count?: number): Promise<any[]>;

  /**
   * Retrieves employee's last login session.
   * @returns {Promise<any[]>} Employee's last login session.
   */
  getEmployeeLastLoginSession(): Promise<any[]>;

  /**
   * Retrieves general login history optionally filtered by employeeid.
   * @param {number} page - Page number for pagination.
   * @param {number} count - Number of records per page.
   * @param {number | null} employeeid - Optional employeeid for filtering.
   * @returns {Promise<any[]>} General login history.
   */
  getGeneralLoginHistory(page?: number, count?: number, employeeid?: number | null): Promise<any[]>;

  /**
   * Retrieves database system security details.
   * @returns {Promise<any[]>} Database system security details.
   */
  getDboSystemSecurity(): Promise<any[]>;

  /**
   * Performs environment security checks based on current app path.
   * @param {string} currentAppPath - Current application path.
   * @returns {Promise<boolean>} True if environment security checks pass, false otherwise.
   */
  environmentSecurity(currentAppPath: string): Promise<boolean>;
}

export default ISecurity;
