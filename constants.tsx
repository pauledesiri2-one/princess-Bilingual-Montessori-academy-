
import { Expense, InventoryItem, Task, StaffRecord, BusSchedule, Policy } from './types';

export const MOCK_EXPENSES: Expense[] = [
  { id: '1', date: '2024-05-10', category: 'Maintenance', description: 'Repair classroom AC', amount: 250 },
  { id: '2', date: '2024-05-11', category: 'Supplies', description: 'Whiteboard markers and chalk', amount: 45 },
  { id: '3', date: '2024-05-12', category: 'Utilities', description: 'Electricity Bill', amount: 1200 },
];

export const MOCK_INVENTORY: InventoryItem[] = [
  { id: '1', name: 'Exercise Books', category: 'Stationery', quantity: 15, status: 'Low', needed: true },
  { id: '2', name: 'Floor Cleaner', category: 'Cleaning', quantity: 50, status: 'In Stock', needed: false },
  { id: '3', name: 'Printing Paper (A4)', category: 'Office', quantity: 2, status: 'Low', needed: true },
];

export const MOCK_TASKS: Task[] = [
  { id: '1', title: 'Review Parent-Teacher Meeting Agenda', dueDate: '2024-05-15', priority: 'High', completed: false },
  { id: '2', title: 'Renew School Bus Insurance', dueDate: '2024-05-20', priority: 'Medium', completed: false },
  { id: '3', title: 'Distribute Mid-term reports', dueDate: '2024-05-14', priority: 'High', completed: true },
];

export const MOCK_STAFF: StaffRecord[] = [
  { 
    id: '1', 
    name: 'Sarah Mensah', 
    role: 'Primary 4 Teacher', 
    phone: '+233 24 555 0101', 
    email: 'sarah.m@princessbilingual.edu',
    joiningDate: '2022-09-01',
    agreementSigned: true,
    guarantor: {
      name: 'John Mensah',
      phone: '+233 20 555 0202',
      address: 'Plot 45, Airport Residential Area, Accra'
    }
  },
  { 
    id: '2', 
    name: 'David Okafor', 
    role: 'French Language Instructor', 
    phone: '+233 50 111 2233', 
    email: 'd.okafor@princessbilingual.edu',
    joiningDate: '2023-01-15',
    agreementSigned: true,
    guarantor: {
      name: 'Beatrice Okafor',
      phone: '+233 24 333 4455',
      address: 'House B12, East Legon'
    }
  }
];

export const MOCK_BUS: BusSchedule[] = [
  {
    id: '1',
    busNumber: 'PB-01',
    route: 'Route Alpha: Airport - Cantonments',
    pickupTime: '06:30 AM',
    driver: {
      name: 'Kofi Boateng',
      phone: '+233 24 999 8877',
      homeAddress: 'Spintex Road, Behind Junction Mall',
      agencyDetails: 'SecureDrive Agency, Osu Office'
    }
  },
  {
    id: '2',
    busNumber: 'PB-02',
    route: 'Route Beta: Labone - Osu',
    pickupTime: '06:45 AM',
    driver: {
      name: 'Emmanuel Tetteh',
      phone: '+233 55 222 3344',
      homeAddress: 'Teshie Nungua Estates',
      agencyDetails: 'Independent Contractor'
    }
  }
];

export const MOCK_POLICIES: Policy[] = [
  {
    id: '1',
    target: 'Teachers',
    title: 'Punctuality and Dress Code',
    content: 'All teachers must be present on school premises by 7:15 AM. Attire must be professional and formal at all times. Use of mobile phones during instructional hours is strictly prohibited unless for emergency cases.'
  },
  {
    id: '2',
    target: 'Parents',
    title: 'Fee Payment Policy',
    content: 'School fees are to be paid in full before the commencement of each term. A grace period of 5 working days is allowed, after which a 5% late fee penalty applies.'
  }
];
