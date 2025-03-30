export type practioner = {
  username: string;
  employeeid: number;
};

export type TAppointment = {
  purpose: string;
  appointment_time: string;
  location: string;
  patientid: number;
  title: string;
  preference: string;
  inviteMethod: string;
  duration: number;
  practioner: practioner;
  appointment_date: string;
};

export const slots: string[] = [
  "08:00",
  "08:30",
  "09:00",
  "09:30",
  "10:00",
  "10:30",
  "11:00",
  "11:30",
  "12:00",
  "12:30",
  "13:00",
  "13:30",
  "14:00",
  "14:30",
  "15:00",
  "15:30",
  "16:00",
  "16:30",
  "17:00",
  "17:30",
  "18:00",
  "18:30",
  "19:00",
  "19:30",
  "20:00"
];

export type Tpagination = {
  count: number;
  page: number;
};

export const months = {
  january: 1,
  february: 2,
  march: 3,
  april: 4,
  may: 5,
  june: 6,
  july: 7,
  august: 8,
  september: 9,
  october: 10,
  november: 11,
  december: 12,
};


