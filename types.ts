
export enum AppTab {
  DASHBOARD = 'dashboard',
  EXPENSES = 'expenses',
  INVENTORY = 'inventory',
  TASKS = 'tasks',
  STAFF = 'staff',
  TRANSPORT = 'transport',
  POLICIES = 'policies'
}

export interface Expense {
  id: string;
  date: string;
  category: string;
  description: string;
  amount: number;
}

export interface Income {
  id: string;
  date: string;
  source: string;
  amount: number;
}

export interface InventoryItem {
  id: string;
  name: string;
  category: string;
  quantity: number;
  status: 'In Stock' | 'Low' | 'Out of Stock';
  needed: boolean;
}

export interface Task {
  id: string;
  title: string;
  dueDate: string;
  priority: 'Low' | 'Medium' | 'High';
  completed: boolean;
}

export interface StaffRecord {
  id: string;
  name: string;
  role: string;
  phone: string;
  email: string;
  guarantor: {
    name: string;
    phone: string;
    address: string;
  };
  agreementSigned: boolean;
  joiningDate: string;
}

export interface BusSchedule {
  id: string;
  busNumber: string;
  route: string;
  pickupTime: string;
  driver: {
    name: string;
    phone: string;
    homeAddress: string;
    agencyDetails: string;
  };
}

export interface Policy {
  id: string;
  target: 'Teachers' | 'Students' | 'Parents';
  title: string;
  content: string;
}
