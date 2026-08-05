export interface AppointmentData {
  name: string;
  email: string;
  mobile: string;
  doctor: string;
  date: string;
  time: string;
  problem: string;
}

export interface ContactData {
  name: string;
  email: string;
  subject: string;
  message: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
}
