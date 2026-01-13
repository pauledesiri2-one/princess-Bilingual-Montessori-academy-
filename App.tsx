
import React, { useState, useMemo, useEffect, useRef } from 'react';
import { 
  LayoutDashboard, 
  Wallet, 
  Package, 
  CheckSquare, 
  Users, 
  Bus, 
  FileText, 
  LogOut,
  Bell,
  Search,
  Plus,
  ArrowUpRight,
  TrendingUp,
  Activity,
  X,
  Save,
  Clock,
  MapPin,
  ShieldCheck,
  Sparkles,
  Loader2,
  ChevronRight,
  AlertTriangle,
  BrainCircuit,
  Calculator,
  ArrowDownRight,
  Coins,
  TrendingDown,
  Menu,
  Navigation,
  Send,
  Bot,
  User,
  Zap,
  Trash2,
  RefreshCcw,
  CheckCircle2,
  History
} from 'lucide-react';
import { GoogleGenAI, Type, FunctionDeclaration } from "@google/genai";
import { AppTab, Expense, Income, InventoryItem, Task, StaffRecord, BusSchedule, Policy } from './types';
import { MOCK_EXPENSES, MOCK_INVENTORY, MOCK_TASKS, MOCK_STAFF, MOCK_BUS, MOCK_POLICIES } from './constants';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

// --- TYPES FOR AI LOGGING ---
interface AIActivity {
  id: string;
  tab: AppTab;
  action: string;
  timestamp: string;
}

// Helper for localStorage
const storage = {
  get: <T,>(key: string, defaultValue: T): T => {
    const saved = localStorage.getItem(`pb_portal_${key}`);
    try {
      return saved ? JSON.parse(saved) : defaultValue;
    } catch {
      return defaultValue;
    }
  },
  set: <T,>(key: string, value: T): void => {
    localStorage.setItem(`pb_portal_${key}`, JSON.stringify(value));
  }
};

// --- HELPER COMPONENTS ---

const SidebarItem: React.FC<{ icon: any, label: string, active: boolean, onClick: () => void }> = ({ icon: Icon, label, active, onClick }) => (
  <button 
    onClick={onClick} 
    className={`w-full flex items-center space-x-3 px-4 py-3.5 rounded-2xl transition-all duration-200 group ${active ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-100' : 'text-slate-400 hover:bg-slate-50 hover:text-slate-700'}`}
  >
    <Icon size={20} className={`${active ? 'text-white' : 'text-slate-400 group-hover:text-indigo-500'}`} />
    <span className={`text-xs font-black uppercase tracking-widest ${active ? 'text-white' : ''}`}>{label}</span>
  </button>
);

const StatCard: React.FC<{ icon: any, label: string, value: string, color: string }> = ({ icon: Icon, label, value, color }) => (
  <div className="bg-white p-5 md:p-6 rounded-3xl border border-slate-100 shadow-sm flex items-center space-x-4 h-full">
    <div className={`p-3 md:p-4 ${color} text-white rounded-2xl shadow-lg flex-shrink-0`}>
      <Icon size={20} className="md:w-6 md:h-6" />
    </div>
    <div className="min-w-0">
      <p className="text-[9px] md:text-[10px] font-black text-slate-400 uppercase tracking-widest mb-0.5 truncate">{label}</p>
      <h3 className="text-lg md:text-xl font-black text-slate-800 tracking-tight truncate">{value}</h3>
    </div>
  </div>
);

// --- AI FUNCTION DECLARATIONS ---
const aiTools: FunctionDeclaration[] = [
  {
    name: 'addExpense',
    parameters: {
      type: Type.OBJECT,
      description: 'Record a new school expense.',
      properties: {
        amount: { type: Type.NUMBER, description: 'The cost in Naira.' },
        category: { type: Type.STRING, description: 'Category (Operational, Salaries, Maintenance, Utilities, Supplies).' },
        description: { type: Type.STRING, description: 'Detailed note about the expense.' },
        date: { type: Type.STRING, description: 'ISO format date (YYYY-MM-DD).' }
      },
      required: ['amount', 'category', 'description']
    }
  },
  {
    name: 'addTask',
    parameters: {
      type: Type.OBJECT,
      description: 'Create a new administrative task or activity.',
      properties: {
        title: { type: Type.STRING, description: 'Task title.' },
        dueDate: { type: Type.STRING, description: 'Deadline (YYYY-MM-DD).' },
        priority: { type: Type.STRING, description: 'High, Medium, or Low.' }
      },
      required: ['title', 'dueDate', 'priority']
    }
  },
  {
    name: 'addIncome',
    parameters: {
      type: Type.OBJECT,
      description: 'Log school revenue (fees, etc.).',
      properties: {
        amount: { type: Type.NUMBER, description: 'Amount in Naira.' },
        source: { type: Type.STRING, description: 'Source (School Fees, Admission, etc.).' },
        date: { type: Type.STRING, description: 'YYYY-MM-DD format.' }
      },
      required: ['amount', 'source']
    }
  }
];

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<AppTab>(AppTab.DASHBOARD);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  
  // Persisted States
  const [expenses, setExpenses] = useState<Expense[]>(() => storage.get('expenses', MOCK_EXPENSES));
  const [income, setIncome] = useState<Income[]>(() => storage.get('income', []));
  const [inventory, setInventory] = useState<InventoryItem[]>(() => storage.get('inventory', MOCK_INVENTORY));
  const [tasks, setTasks] = useState<Task[]>(() => storage.get('tasks', MOCK_TASKS));
  const [staff, setStaff] = useState<StaffRecord[]>(() => storage.get('staff', MOCK_STAFF));
  const [busSchedules, setBusSchedules] = useState<BusSchedule[]>(() => storage.get('busSchedules', MOCK_BUS));
  const [aiActivityLog, setAiActivityLog] = useState<AIActivity[]>(() => storage.get('aiActivity', []));

  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);

  // Modal Entry States
  const [newExpense, setNewExpense] = useState({ amount: 0, description: '', category: 'Operational', date: new Date().toISOString().split('T')[0] });
  const [newIncome, setNewIncome] = useState({ amount: 0, source: 'School Fees', date: new Date().toISOString().split('T')[0] });
  const [newTask, setNewTask] = useState({ title: '', dueDate: '', priority: 'Medium' as 'Low' | 'Medium' | 'High' });
  const [newStaff, setNewStaff] = useState({ name: '', role: '', phone: '', email: '' });
  const [newRoute, setNewRoute] = useState({ busNumber: '', route: '', pickupTime: '06:30 AM', driver: { name: 'Unassigned', phone: '', homeAddress: '', agencyDetails: '' } });

  // Calculator States
  const [calcDisplay, setCalcDisplay] = useState('0');
  const [calcBuffer, setCalcBuffer] = useState<number | null>(null);
  const [calcOp, setCalcOp] = useState<string | null>(null);

  const handleCalcAction = (btn: string) => {
    if (btn === 'C') {
      setCalcDisplay('0');
      setCalcBuffer(null);
      setCalcOp(null);
    } else if (['+', '-', '*', '/'].includes(btn)) {
      setCalcBuffer(parseFloat(calcDisplay));
      setCalcOp(btn);
      setCalcDisplay('0');
    } else if (btn === '=') {
      if (calcBuffer !== null && calcOp !== null) {
        const current = parseFloat(calcDisplay);
        let result = 0;
        if (calcOp === '+') result = calcBuffer + current;
        if (calcOp === '-') result = calcBuffer - current;
        if (calcOp === '*') result = calcBuffer * current;
        if (calcOp === '/') result = calcBuffer / current;
        setCalcDisplay(result.toString());
        setCalcBuffer(null);
        setCalcOp(null);
      }
    } else if (btn === '.') {
      if (!calcDisplay.includes('.')) setCalcDisplay(prev => prev + '.');
    } else {
      setCalcDisplay(prev => prev === '0' ? btn : prev + btn);
    }
  };

  // Sync with storage
  useEffect(() => {
    storage.set('expenses', expenses);
    storage.set('income', income);
    storage.set('inventory', inventory);
    storage.set('tasks', tasks);
    storage.set('staff', staff);
    storage.set('busSchedules', busSchedules);
    storage.set('aiActivity', aiActivityLog);
  }, [expenses, income, inventory, tasks, staff, busSchedules, aiActivityLog]);

  // Modals & Panels
  const [isStaffModalOpen, setIsStaffModalOpen] = useState(false);
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);
  const [isIncomeModalOpen, setIsIncomeModalOpen] = useState(false);
  const [isCalculatorOpen, setIsCalculatorOpen] = useState(false);
  const [isTransportModalOpen, setIsTransportModalOpen] = useState(false);

  // AI Assistant States
  const [isAiOpen, setIsAiOpen] = useState(false);
  const [aiMessages, setAiMessages] = useState<{role: 'user' | 'assistant', content: string}[]>([
    { role: 'assistant', content: 'Hello Madam Gloria. I am ready to manage Princess Bilingual. I can record expenses, add tasks, or logs fees for you. Just tell me what to do!' }
  ]);
  const [aiInput, setAiInput] = useState('');
  const [isAiTyping, setIsAiTyping] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [aiMessages]);

  // Financial Stats
  const totalExpenses = useMemo(() => expenses.reduce((acc, curr) => acc + curr.amount, 0), [expenses]);
  const totalIncome = useMemo(() => income.reduce((acc, curr) => acc + curr.amount, 0), [income]);
  const netProfit = totalIncome - totalExpenses;
  const isProfitable = netProfit >= 0;

  // --- AI HANDLER WITH FUNCTION CALLING ---
  const logAiChange = (tab: AppTab, action: string) => {
    const newLog: AIActivity = {
      id: Date.now().toString(),
      tab,
      action,
      timestamp: new Date().toLocaleString(),
    };
    setAiActivityLog(prev => [newLog, ...prev].slice(0, 20));
  };

  const handleAiChat = async (overrideInput?: string) => {
    const text = overrideInput || aiInput;
    if (!text.trim()) return;

    setAiMessages(prev => [...prev, { role: 'user', content: text }]);
    setAiInput('');
    setIsAiTyping(true);

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const context = {
        finances: { totalIncome, totalExpenses, netProfit },
        inventoryStatus: inventory.filter(i => i.needed).map(i => i.name),
        staffCount: staff.length,
        currentTab: activeTab
      };

      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: text,
        config: {
          systemInstruction: `You are the Princess Bilingual School Intelligence. You assist Madam Gloria. 
          Current School Context: ${JSON.stringify(context)}. 
          You have tools to add expenses, income, and tasks. 
          If Madam Gloria asks you to record something, use the tool. 
          Confirm every successful change in your text response. 
          Be professional and concise.`,
          tools: [{ functionDeclarations: aiTools }]
        }
      });

      const textResponse = response.text || "Processing your request...";
      const functionCalls = response.functionCalls;

      if (functionCalls && functionCalls.length > 0) {
        for (const fc of functionCalls) {
          if (fc.name === 'addExpense') {
            const args = fc.args as any;
            setExpenses(prev => [...prev, {
              id: `ai-${Date.now()}`,
              amount: args.amount,
              category: args.category || 'Operational',
              description: `[AI] ${args.description}`,
              date: args.date || new Date().toISOString().split('T')[0]
            }]);
            logAiChange(AppTab.EXPENSES, `Recorded expense of ₦${args.amount} for ${args.description}`);
          }
          if (fc.name === 'addTask') {
            const args = fc.args as any;
            setTasks(prev => [...prev, {
              id: `ai-${Date.now()}`,
              title: args.title,
              dueDate: args.dueDate,
              priority: (args.priority || 'Medium') as any,
              completed: false
            }]);
            logAiChange(AppTab.TASKS, `Created new task: ${args.title}`);
          }
          if (fc.name === 'addIncome') {
            const args = fc.args as any;
            setIncome(prev => [...prev, {
              id: `ai-${Date.now()}`,
              amount: args.amount,
              source: args.source,
              date: args.date || new Date().toISOString().split('T')[0]
            }]);
            logAiChange(AppTab.EXPENSES, `Logged revenue of ₦${args.amount} from ${args.source}`);
          }
        }
      }
      setAiMessages(prev => [...prev, { role: 'assistant', content: textResponse }]);
    } catch (error) {
      console.error(error);
      setAiMessages(prev => [...prev, { role: 'assistant', content: 'Madam Gloria, I encountered an issue. Please try again.' }]);
    } finally {
      setIsAiTyping(false);
    }
  };

  const handleResetFinancials = () => {
    if (window.confirm("PERMANENT ACTION: Wipe all treasury data to zero?")) {
      setExpenses([]);
      setIncome([]);
      logAiChange(AppTab.EXPENSES, "Performed a complete treasury reset.");
    }
  };

  // --- RENDER HELPERS ---
  const renderAiActivityLog = (tabFilter?: AppTab) => {
    const logs = tabFilter 
      ? aiActivityLog.filter(l => l.tab === tabFilter)
      : aiActivityLog;

    if (logs.length === 0) return null;

    return (
      <div className="bg-indigo-50/50 border border-indigo-100 p-4 rounded-2xl mb-6">
        <div className="flex items-center space-x-2 mb-3">
          <Sparkles size={14} className="text-indigo-600" />
          <h4 className="text-[10px] font-black uppercase tracking-widest text-indigo-600">AI Activity Feed</h4>
        </div>
        <div className="space-y-2">
          {logs.slice(0, 3).map(log => (
            <div key={log.id} className="flex justify-between items-center text-[10px] md:text-[11px] font-medium text-indigo-700 bg-white/50 p-2 rounded-lg border border-indigo-50">
              <span className="truncate pr-4 flex items-center">
                <CheckCircle2 size={12} className="mr-2 opacity-60 flex-shrink-0" />
                {log.action}
              </span>
              <span className="flex-shrink-0 text-[8px] opacity-60 font-black">{log.timestamp}</span>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderDashboard = () => (
    <div className="space-y-6 animate-fadeIn pb-10">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={TrendingUp} label="Net Balance" value={`₦${netProfit.toLocaleString()}`} color={isProfitable && netProfit > 0 ? "bg-emerald-500" : (netProfit < 0 ? "bg-rose-500" : "bg-slate-500")} />
        <StatCard icon={CheckSquare} label="Pending Tasks" value={tasks.filter(t => !t.completed).length.toString()} color="bg-amber-500" />
        <StatCard icon={Package} label="Low Stock" value={inventory.filter(i => i.needed).length.toString()} color="bg-indigo-500" />
        <StatCard icon={Activity} label="Active Staff" value={staff.length.toString()} color="bg-blue-500" />
      </div>

      {renderAiActivityLog()}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white p-5 md:p-6 rounded-3xl border border-slate-100 shadow-sm">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-base md:text-lg font-black text-slate-800">Financial Pulse</h2>
            <div className={`px-2 md:px-3 py-1 rounded-full text-[9px] md:text-[10px] font-black uppercase ${netProfit > 0 ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-50 text-slate-600'}`}>
              Treasury Overview
            </div>
          </div>
          <div className="h-56 md:h-64 w-full">
            {expenses.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={expenses.slice(-8)}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="category" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 9}} />
                  <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 9}} />
                  <Tooltip cursor={{fill: '#f8fafc'}} contentStyle={{ borderRadius: '12px', border: 'none', fontSize: '10px' }} />
                  <Bar dataKey="amount" radius={[4, 4, 0, 0]}>
                    {expenses.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={index % 2 === 0 ? '#4f46e5' : '#818cf8'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-slate-300 italic text-xs">Waiting for financial records...</div>
            )}
          </div>
        </div>

        <div className="bg-white p-5 md:p-6 rounded-3xl border border-slate-100 shadow-sm flex flex-col">
          <h2 className="text-base md:text-lg font-black text-slate-800 mb-4">Operations Hub</h2>
          <div className="space-y-3 flex-1 overflow-y-auto max-h-[300px] scrollbar-hide">
            {tasks.filter(t => !t.completed).length > 0 ? (
              tasks.filter(t => !t.completed).slice(0, 6).map(task => (
                <div key={task.id} className="flex items-center space-x-3 p-3 hover:bg-slate-50 rounded-xl transition-colors border border-transparent hover:border-slate-100 group">
                  <input 
                    type="checkbox" 
                    checked={task.completed} 
                    className="h-5 w-5 rounded-lg border-slate-300 text-indigo-600 focus:ring-0 cursor-pointer"
                    onChange={() => setTasks(tasks.map(t => t.id === task.id ? {...t, completed: !t.completed} : t))}
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs md:text-sm font-bold text-slate-700 truncate">{task.title}</p>
                    <p className="text-[9px] text-slate-400 font-medium">By {task.dueDate}</p>
                  </div>
                </div>
              ))
            ) : (
              <div className="flex flex-col items-center justify-center py-10 text-slate-300">
                <CheckSquare size={24} className="mb-2 opacity-20" />
                <p className="text-[10px] font-black uppercase">Agenda Complete</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="flex min-h-screen bg-slate-50 overflow-x-hidden font-inter relative">
      {/* Mobile Sidebar Overlay */}
      {isSidebarOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-40 md:hidden transition-opacity" onClick={() => setIsSidebarOpen(false)} />
      )}

      {/* Sidebar */}
      <aside className={`fixed inset-y-0 left-0 z-50 w-[280px] md:w-64 bg-white border-r border-slate-100 flex flex-col transition-transform duration-300 ease-in-out shadow-2xl md:shadow-none ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0`}>
        <div className="p-6 mb-4 flex justify-between items-center">
          <div>
            <h1 className="text-xl font-black text-indigo-600 leading-tight">Princess Bilingual</h1>
            <p className="text-[10px] text-slate-400 font-black tracking-[0.2em] uppercase mt-1">Management Portal</p>
          </div>
          <button onClick={() => setIsSidebarOpen(false)} className="md:hidden p-2 text-slate-400 hover:text-slate-900 active:scale-95"><X size={24} /></button>
        </div>
        
        <nav className="flex-1 px-4 space-y-1 overflow-y-auto scrollbar-hide">
          <SidebarItem icon={LayoutDashboard} label="Dashboard" active={activeTab === AppTab.DASHBOARD} onClick={() => { setActiveTab(AppTab.DASHBOARD); setIsSidebarOpen(false); }} />
          <SidebarItem icon={Wallet} label="Expenses" active={activeTab === AppTab.EXPENSES} onClick={() => { setActiveTab(AppTab.EXPENSES); setIsSidebarOpen(false); }} />
          <SidebarItem icon={Package} label="Inventory" active={activeTab === AppTab.INVENTORY} onClick={() => { setActiveTab(AppTab.INVENTORY); setIsSidebarOpen(false); }} />
          <SidebarItem icon={CheckSquare} label="Activities" active={activeTab === AppTab.TASKS} onClick={() => { setActiveTab(AppTab.TASKS); setIsSidebarOpen(false); }} />
          <SidebarItem icon={Users} label="Staff Hub" active={activeTab === AppTab.STAFF} onClick={() => { setActiveTab(AppTab.STAFF); setIsSidebarOpen(false); }} />
          <SidebarItem icon={Bus} label="Transport" active={activeTab === AppTab.TRANSPORT} onClick={() => { setActiveTab(AppTab.TRANSPORT); setIsSidebarOpen(false); }} />
          <SidebarItem icon={FileText} label="Policy Center" active={activeTab === AppTab.POLICIES} onClick={() => { setActiveTab(AppTab.POLICIES); setIsSidebarOpen(false); }} />
        </nav>

        <div className="p-6 mt-auto border-t border-slate-50">
          <div className="bg-slate-50 rounded-2xl p-4 flex items-center space-x-3 mb-4">
            <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-black">G</div>
            <div className="min-w-0">
              <p className="text-sm font-black text-slate-800 truncate">Gloria</p>
              <p className="text-[10px] text-indigo-500 font-bold uppercase tracking-tighter truncate">Proprietress</p>
            </div>
          </div>
          <button className="flex items-center space-x-2 text-slate-400 hover:text-rose-500 w-full px-4 transition-all text-xs font-black uppercase tracking-widest active:scale-95">
            <LogOut size={16} />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className={`flex-1 transition-all duration-300 w-full md:ml-64`}>
        <header className="sticky top-0 z-30 bg-slate-50/90 backdrop-blur-md px-4 md:px-10 py-4 md:py-5 flex justify-between items-center border-b border-transparent">
          <div className="flex items-center space-x-4">
            <button onClick={toggleSidebar} className="md:hidden p-2.5 bg-white border border-slate-200 rounded-xl shadow-sm text-slate-600 active:scale-95"><Menu size={20} /></button>
            <div className="hidden sm:block">
              <h1 className="text-xl md:text-2xl font-black text-slate-800 capitalize tracking-tight">{activeTab}</h1>
            </div>
            <div className="sm:hidden">
              <h1 className="text-lg font-black text-slate-800 capitalize truncate w-32">{activeTab}</h1>
            </div>
          </div>

          <div className="flex items-center space-x-2 md:space-x-4">
            <button onClick={() => setIsAiOpen(true)} className="p-2.5 bg-indigo-600 text-white rounded-xl shadow-lg flex items-center space-x-2 px-3 md:px-5 group active:scale-95 transition-all">
              <Sparkles size={18} className="group-hover:animate-pulse" />
              <span className="hidden sm:inline text-[11px] font-black uppercase tracking-widest">Command AI</span>
            </button>
          </div>
        </header>

        <div className="px-4 md:px-10 pt-2 pb-10 max-w-7xl mx-auto">
          {activeTab === AppTab.DASHBOARD && renderDashboard()}
          
          {activeTab === AppTab.EXPENSES && (
            <div className="space-y-6 animate-fadeIn pb-10">
              {renderAiActivityLog(AppTab.EXPENSES)}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
                   <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Treasury Balance</p>
                   <h3 className={`text-2xl font-black ${netProfit >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>₦{netProfit.toLocaleString()}</h3>
                </div>
                <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
                   <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Total Collections</p>
                   <h3 className="text-2xl font-black text-slate-800">₦{totalIncome.toLocaleString()}</h3>
                </div>
                <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
                   <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Total Spending</p>
                   <h3 className="text-2xl font-black text-rose-600">₦{totalExpenses.toLocaleString()}</h3>
                </div>
              </div>
              
              <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center bg-white p-4 md:p-5 rounded-3xl border border-slate-100 gap-3">
                <div className="flex space-x-2">
                  <button onClick={handleResetFinancials} className="flex-1 sm:flex-none px-4 py-3 bg-rose-50 text-rose-600 text-[10px] font-black uppercase rounded-xl flex items-center border border-rose-100 active:scale-95 transition-all">
                    <RefreshCcw size={14} className="mr-2" /> Reset All
                  </button>
                  <button onClick={() => setIsCalculatorOpen(true)} className="flex-1 sm:flex-none px-4 py-3 bg-indigo-50 text-indigo-600 text-[10px] font-black uppercase rounded-xl flex items-center border border-indigo-100 active:scale-95 transition-all">
                    <Calculator size={14} className="mr-2" /> Calc
                  </button>
                </div>
                <div className="flex space-x-2">
                   <button onClick={() => setIsIncomeModalOpen(true)} className="flex-1 sm:flex-none px-4 py-3 bg-emerald-600 text-white text-[10px] font-black uppercase rounded-xl shadow-lg active:scale-95 transition-all">Log Revenue</button>
                   <button onClick={() => setIsExpenseModalOpen(true)} className="flex-1 sm:flex-none px-4 py-3 bg-slate-900 text-white text-[10px] font-black uppercase rounded-xl shadow-lg active:scale-95 transition-all">Add Expense</button>
                </div>
              </div>

              <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
                <div className="overflow-x-auto scrollbar-hide">
                  <table className="w-full text-left text-xs min-w-[500px]">
                    <thead><tr className="text-slate-400 font-black uppercase border-b border-slate-50"><th className="px-6 py-5">Date</th><th className="px-6 py-5">Description</th><th className="px-6 py-5 text-right">Amount</th></tr></thead>
                    <tbody className="divide-y divide-slate-50">
                      {[...expenses, ...income.map(i => ({ ...i, category: 'Income', description: i.source, amount: i.amount }))].sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime()).map(item => (
                        <tr key={item.id} className="hover:bg-slate-50 transition-colors">
                          <td className="px-6 py-5 text-slate-500 whitespace-nowrap">{item.date}</td>
                          <td className="px-6 py-5 font-bold text-slate-800">
                            <span className="flex items-center">
                              {item.description}
                              {item.id.toString().startsWith('ai') && <Sparkles size={10} className="ml-2 text-indigo-500" />}
                            </span>
                          </td>
                          <td className={`px-6 py-5 text-right font-black ${item.category === 'Income' ? 'text-emerald-600' : 'text-rose-600'}`}>
                            {item.category === 'Income' ? '+' : '-'}₦{item.amount.toLocaleString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {activeTab === AppTab.TASKS && (
            <div className="space-y-6 animate-fadeIn">
              {renderAiActivityLog(AppTab.TASKS)}
              <div className="flex justify-between items-center bg-white p-5 rounded-3xl border border-slate-100 shadow-sm">
                <h2 className="text-xl font-black text-slate-800">Administrative Log</h2>
                <button onClick={() => setIsTaskModalOpen(true)} className="p-3 bg-indigo-600 text-white rounded-xl shadow-lg active:scale-95">
                  <Plus size={20} />
                </button>
              </div>
              <div className="space-y-3 pb-10">
                {tasks.map(t => (
                  <div key={t.id} className={`bg-white p-4 md:p-5 rounded-2xl border border-slate-100 flex items-center shadow-sm transition-all ${t.id.toString().startsWith('ai') ? 'border-l-4 border-l-indigo-500' : ''}`}>
                    <input type="checkbox" checked={t.completed} onChange={() => setTasks(tasks.map(x => x.id === t.id ? {...x, completed: !x.completed} : x))} className="w-5 h-5 rounded-lg border-slate-300 text-indigo-600" />
                    <div className="ml-4 flex-1 min-w-0">
                      <h4 className={`text-sm md:text-base font-black truncate ${t.completed ? 'text-slate-300 line-through' : 'text-slate-800'}`}>
                        {t.title}
                        {t.id.toString().startsWith('ai') && <Sparkles size={12} className="inline ml-2 text-indigo-500" />}
                      </h4>
                      <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">Deadline: {t.dueDate}</p>
                    </div>
                    <span className={`hidden sm:block px-3 py-1 rounded-full text-[9px] font-black uppercase ${t.priority === 'High' ? 'bg-rose-50 text-rose-600' : 'bg-amber-50 text-amber-600'}`}>{t.priority}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === AppTab.STAFF && (
            <div className="space-y-6 animate-fadeIn pb-10">
              <div className="flex justify-between items-center bg-white p-5 rounded-3xl border border-slate-100 shadow-sm">
                <h2 className="text-xl font-black text-slate-800">Personnel Hub</h2>
                <button onClick={() => setIsStaffModalOpen(true)} className="p-3 bg-indigo-600 text-white rounded-xl active:scale-95 transition-all shadow-lg"><Plus size={20} /></button>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {staff.map(s => (
                  <div key={s.id} className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm hover:shadow-xl transition-all relative">
                    <div className="flex items-center space-x-4 mb-4">
                      <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center font-black text-lg">{s.name.charAt(0)}</div>
                      <div>
                        <h4 className="font-black text-slate-800">{s.name}</h4>
                        <p className="text-[10px] text-indigo-500 font-bold uppercase tracking-widest">{s.role}</p>
                      </div>
                    </div>
                    <p className="text-xs text-slate-500 mb-4 flex items-center"><Navigation size={12} className="mr-2 opacity-60" /> Joined {s.joiningDate}</p>
                    <div className={`w-full py-2 text-center rounded-xl text-[10px] font-black uppercase ${s.agreementSigned ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600 animate-pulse'}`}>
                      {s.agreementSigned ? 'Agreement Active' : 'Agreement Needed'}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Transportation, Inventory, Policies rendered with similar responsive patterns */}
          {activeTab === AppTab.TRANSPORT && (
             <div className="space-y-6 animate-fadeIn pb-10">
                <div className="flex justify-between items-center bg-white p-5 rounded-3xl border border-slate-100 shadow-sm">
                  <h2 className="text-xl font-black text-slate-800">Logistics Control</h2>
                  <button onClick={() => setIsTransportModalOpen(true)} className="p-3 bg-amber-500 text-white rounded-xl active:scale-95 shadow-lg"><Plus size={20} /></button>
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {busSchedules.map(b => (
                    <div key={b.id} className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm border-l-4 border-l-amber-400">
                      <div className="flex justify-between items-start mb-6">
                        <div className="flex items-center space-x-3">
                          <Bus size={24} className="text-amber-500" />
                          <div><h4 className="font-black text-slate-800">Bus {b.busNumber}</h4><p className="text-[10px] font-bold text-slate-400 uppercase">{b.route}</p></div>
                        </div>
                        <div className="text-right"><p className="text-[9px] font-black text-slate-400 uppercase mb-0.5">Pickup</p><p className="text-lg font-black text-indigo-600 whitespace-nowrap">{b.pickupTime}</p></div>
                      </div>
                      <div className="p-4 bg-slate-50 rounded-2xl">
                         <p className="text-xs font-black text-slate-800 truncate">{b.driver.name}</p>
                         <p className="text-[10px] font-bold text-indigo-500 mt-0.5">{b.driver.phone}</p>
                      </div>
                    </div>
                  ))}
                </div>
             </div>
          )}

          {activeTab === AppTab.INVENTORY && (
            <div className="space-y-6 animate-fadeIn pb-10">
              <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm flex justify-between items-center">
                <h2 className="text-xl font-black text-slate-800">Store Management</h2>
              </div>
              <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
                <div className="overflow-x-auto scrollbar-hide">
                  <table className="w-full text-left text-xs min-w-[400px]">
                    <thead className="bg-slate-50/50 text-slate-400 font-black uppercase"><tr className="border-b border-slate-50"><th className="px-6 py-5">Asset</th><th className="px-6 py-5">Qty</th><th className="px-6 py-5">Status</th></tr></thead>
                    <tbody className="divide-y divide-slate-50">
                      {inventory.map(i => (
                        <tr key={i.id} className="hover:bg-slate-50 transition-colors">
                          <td className="px-6 py-5 font-black text-slate-800">{i.name}</td>
                          <td className="px-6 py-5 text-slate-500 font-bold">{i.quantity}</td>
                          <td className="px-6 py-5"><span className={`px-2 py-1 rounded-lg font-black uppercase text-[8px] border ${i.needed ? 'bg-rose-50 text-rose-600 border-rose-100' : 'bg-emerald-50 text-emerald-600 border-emerald-100'}`}>{i.status}</span></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {activeTab === AppTab.POLICIES && (
            <div className="max-w-2xl mx-auto py-6 md:py-10 animate-fadeIn">
               <div className="bg-white p-6 md:p-12 rounded-[2.5rem] border border-slate-100 shadow-sm">
                  <h2 className="text-2xl font-black text-slate-800 mb-8 md:mb-12 text-center">Institutional Policies</h2>
                  <div className="space-y-10">
                    {MOCK_POLICIES.map(p => (
                      <div key={p.id}>
                        <h4 className="text-[9px] font-black text-indigo-500 uppercase tracking-widest mb-2">Subject: {p.target}</h4>
                        <h3 className="text-xl font-black text-slate-800 mb-4">{p.title}</h3>
                        <div className="text-xs md:text-sm text-slate-600 leading-relaxed bg-slate-50/50 p-5 md:p-8 rounded-3xl border border-slate-50 italic">“{p.content}”</div>
                      </div>
                    ))}
                  </div>
               </div>
            </div>
          )}
        </div>
      </main>

      {/* AI Assistant Command Panel - Mobile Optimized */}
      <div className={`fixed inset-y-0 right-0 z-[60] w-full sm:w-[420px] bg-white shadow-2xl transition-transform duration-500 transform ${isAiOpen ? 'translate-x-0' : 'translate-x-full'}`}>
        <div className="flex flex-col h-full">
          <div className="p-5 md:p-6 bg-indigo-600 text-white flex justify-between items-center">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-white/20 rounded-xl shadow-inner"><Sparkles size={24} /></div>
              <div>
                <h2 className="text-base md:text-lg font-black">PB Intelligence</h2>
                <p className="text-[9px] font-bold uppercase opacity-60 tracking-wider">Madam Gloria's Assistant</p>
              </div>
            </div>
            <button onClick={() => setIsAiOpen(false)} className="p-2 hover:bg-white/20 rounded-xl transition-colors active:scale-95"><X size={24} /></button>
          </div>
          
          <div className="flex-1 overflow-y-auto p-5 md:p-6 space-y-6 bg-slate-50 scrollbar-hide">
            {aiMessages.map((msg, idx) => (
              <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`p-4 rounded-2xl text-xs md:text-sm leading-relaxed shadow-sm max-w-[85%] ${msg.role === 'user' ? 'bg-indigo-600 text-white rounded-br-none' : 'bg-white text-slate-700 rounded-bl-none border border-slate-100'}`}>
                  {msg.content || <div className="flex space-x-1 py-1"><div className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" /><div className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce [animation-delay:0.2s]" /><div className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce [animation-delay:0.4s]" /></div>}
                </div>
              </div>
            ))}
            <div ref={chatEndRef} />
          </div>

          <div className="p-4 md:p-6 border-t bg-white">
            <div className="flex gap-2 mb-4 overflow-x-auto scrollbar-hide pb-2">
               <button onClick={() => handleAiChat("Record expense ₦5000 for Office Supplies")} className="flex-shrink-0 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-full text-[8px] font-black uppercase hover:bg-indigo-50 hover:text-indigo-600 transition-all">Record Cost</button>
               <button onClick={() => handleAiChat("Add a new task: Call the cleaner")} className="flex-shrink-0 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-full text-[8px] font-black uppercase hover:bg-indigo-50 hover:text-indigo-600 transition-all">New Task</button>
               <button onClick={() => handleAiChat("Give me a school health summary")} className="flex-shrink-0 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-full text-[8px] font-black uppercase hover:bg-indigo-50 hover:text-indigo-600 transition-all">Report</button>
            </div>
            <form onSubmit={(e) => { e.preventDefault(); handleAiChat(); }} className="flex space-x-2">
              <input value={aiInput} onChange={(e) => setAiInput(e.target.value)} placeholder="Type a command..." className="flex-1 px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs outline-none focus:ring-4 focus:ring-indigo-50 font-medium" />
              <button type="submit" disabled={isAiTyping || !aiInput.trim()} className="p-3 bg-indigo-600 text-white rounded-2xl shadow-xl disabled:opacity-50 active:scale-95 transition-all"><Send size={18} /></button>
            </form>
          </div>
        </div>
      </div>

      {/* Floating AI Bubble - Deskop and Mobile accessibility */}
      <button 
        onClick={() => setIsAiOpen(true)} 
        className={`fixed bottom-6 right-6 z-40 p-5 bg-indigo-600 text-white rounded-full shadow-2xl hover:scale-110 active:scale-95 transition-all group ${isAiOpen ? 'opacity-0 scale-0' : 'opacity-100 scale-100'}`}
      >
        <Zap size={28} className="animate-pulse" />
      </button>

      {/* MODALS - Mobile Optimized (Full width on mobile, max-height scrolling) */}
      
      {isExpenseModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 backdrop-blur-md p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md animate-modalIn overflow-hidden border border-slate-200 max-h-[90vh] flex flex-col">
            <div className="p-6 md:p-8 bg-rose-600 text-white flex justify-between items-center flex-shrink-0">
              <h2 className="text-xl font-black">Record Expense</h2>
              <button onClick={() => setIsExpenseModalOpen(false)} className="p-2 hover:bg-white/20 rounded-xl active:scale-95"><X size={24} /></button>
            </div>
            <form onSubmit={(e) => { e.preventDefault(); setExpenses(prev => [...prev, { ...newExpense, id: Date.now().toString() }]); setIsExpenseModalOpen(false); }} className="p-6 md:p-8 space-y-6 overflow-y-auto">
              <div className="space-y-1">
                 <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-2">Amount (₦)</label>
                 <input type="number" step="0.01" value={newExpense.amount || ''} onChange={e => setNewExpense({...newExpense, amount: parseFloat(e.target.value) || 0})} className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-2xl font-black outline-none focus:border-rose-500" placeholder="0.00" required />
              </div>
              <div className="space-y-1">
                 <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-2">Details</label>
                 <input type="text" value={newExpense.description} onChange={e => setNewExpense({...newExpense, description: e.target.value})} className="w-full px-4 py-3.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold" placeholder="Cost reason..." required />
              </div>
              <button type="submit" className="w-full py-4 bg-rose-600 text-white rounded-2xl font-black text-sm shadow-lg active:scale-95 transition-all mt-4">Save To Records</button>
            </form>
          </div>
        </div>
      )}

      {isIncomeModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 backdrop-blur-md p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md animate-modalIn overflow-hidden max-h-[90vh] flex flex-col">
            <div className="p-6 md:p-8 bg-emerald-600 text-white flex justify-between items-center flex-shrink-0">
              <h2 className="text-xl font-black">Record Revenue</h2>
              <button onClick={() => setIsIncomeModalOpen(false)} className="p-2 hover:bg-white/20 rounded-xl active:scale-95"><X size={24} /></button>
            </div>
            <form onSubmit={(e) => { e.preventDefault(); setIncome(prev => [...prev, { ...newIncome, id: Date.now().toString() }]); setIsIncomeModalOpen(false); }} className="p-6 md:p-8 space-y-6 overflow-y-auto">
              <input type="number" step="0.01" value={newIncome.amount || ''} onChange={e => setNewIncome({...newIncome, amount: parseFloat(e.target.value) || 0})} className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-2xl font-black outline-none focus:border-emerald-500" placeholder="₦0.00" required />
              <select value={newIncome.source} onChange={e => setNewIncome({...newIncome, source: e.target.value})} className="w-full px-4 py-3.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold appearance-none">
                <option value="School Fees">School Fees</option><option value="Admission">Admission</option><option value="Uniforms">Uniforms</option>
              </select>
              <button type="submit" className="w-full py-4 bg-emerald-600 text-white rounded-2xl font-black text-sm active:scale-95 mt-4">Log Credit</button>
            </form>
          </div>
        </div>
      )}

      {isCalculatorOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
          <div className="max-w-xs w-full animate-modalIn relative">
            <button onClick={() => setIsCalculatorOpen(false)} className="absolute -top-12 right-0 p-3 text-white bg-slate-900 rounded-full shadow-xl active:scale-95 transition-all"><X size={20} /></button>
            <div className="bg-slate-900 p-6 md:p-8 rounded-[2rem] shadow-2xl border border-slate-800">
              <div className="bg-slate-800 p-5 rounded-2xl mb-5 text-right shadow-inner min-h-[80px] flex flex-col justify-center">
                <p className="text-indigo-400 text-[9px] font-bold h-3 truncate">{calcBuffer !== null ? `${calcBuffer} ${calcOp}` : ''}</p>
                <p className="text-white text-3xl font-black truncate">{calcDisplay}</p>
              </div>
              <div className="grid grid-cols-4 gap-2 md:gap-3">
                {['7','8','9','/','4','5','6','*','1','2','3','-','0','.','=','+','C'].map(btn => (
                  <button key={btn} onClick={() => handleCalcAction(btn)} className={`h-12 md:h-14 rounded-xl md:rounded-2xl text-xs font-black transition-all active:scale-95 ${['/','*','-','+','='].includes(btn) ? 'bg-indigo-600 text-white' : btn === 'C' ? 'bg-rose-500 text-white col-span-4' : 'bg-slate-700 text-slate-200'}`}>{btn}</button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Manual Modals - Staff, Tasks, Transport - implementing similarly with max-h and scrollability */}
      {isTaskModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/40 p-4">
          <div className="bg-white p-6 md:p-10 rounded-3xl w-full max-w-md animate-modalIn overflow-y-auto max-h-[90vh]">
            <div className="flex justify-between items-center mb-8"><h2 className="text-xl font-black">New Task</h2><button onClick={() => setIsTaskModalOpen(false)} className="active:scale-95"><X size={24} /></button></div>
            <form onSubmit={(e) => { e.preventDefault(); setTasks([...tasks, { ...newTask, id: Date.now().toString(), completed: false }]); setIsTaskModalOpen(false); }} className="space-y-4">
              <input required placeholder="Task Description" className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl font-bold text-xs" value={newTask.title} onChange={e => setNewTask({...newTask, title: e.target.value})} />
              <input required type="date" className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl font-bold text-xs" value={newTask.dueDate} onChange={e => setNewTask({...newTask, dueDate: e.target.value})} />
              <button type="submit" className="w-full py-4 bg-indigo-600 text-white rounded-xl font-black uppercase text-xs shadow-lg active:scale-95 mt-4">Add Task</button>
            </form>
          </div>
        </div>
      )}

      {isStaffModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/40 p-4">
          <div className="bg-white p-6 md:p-10 rounded-3xl w-full max-w-md animate-modalIn overflow-y-auto max-h-[90vh]">
            <div className="flex justify-between items-center mb-8"><h2 className="text-xl font-black">Register Staff</h2><button onClick={() => setIsStaffModalOpen(false)} className="active:scale-95"><X size={24} /></button></div>
            <form onSubmit={(e) => { e.preventDefault(); setStaff([...staff, { ...newStaff, id: Date.now().toString(), joiningDate: new Date().toISOString().split('T')[0], agreementSigned: false, guarantor: { name: '', phone: '', address: '' } }]); setIsStaffModalOpen(false); }} className="space-y-4">
              <input required placeholder="Full Name" className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl font-bold text-xs" value={newStaff.name} onChange={e => setNewStaff({...newStaff, name: e.target.value})} />
              <input required placeholder="Role" className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl font-bold text-xs" value={newStaff.role} onChange={e => setNewStaff({...newStaff, role: e.target.value})} />
              <input required placeholder="Phone Number" className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl font-bold text-xs" value={newStaff.phone} onChange={e => setNewStaff({...newStaff, phone: e.target.value})} />
              <button type="submit" className="w-full py-4 bg-indigo-600 text-white rounded-xl font-black uppercase text-xs shadow-lg active:scale-95 mt-4">Confirm Registration</button>
            </form>
          </div>
        </div>
      )}

      {isTransportModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/40 p-4">
          <div className="bg-white p-6 md:p-10 rounded-3xl w-full max-w-md animate-modalIn overflow-y-auto max-h-[90vh]">
            <div className="flex justify-between items-center mb-8"><h2 className="text-xl font-black">New Route</h2><button onClick={() => setIsTransportModalOpen(false)} className="active:scale-95"><X size={24} /></button></div>
            <form onSubmit={(e) => { e.preventDefault(); setBusSchedules([...busSchedules, { ...newRoute, id: Date.now().toString(), pickupTime: '06:30 AM', driver: { name: 'Unassigned', phone: '', homeAddress: '', agencyDetails: '' } }]); setIsTransportModalOpen(false); }} className="space-y-4">
              <input required placeholder="Bus ID" className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl font-bold text-xs" value={newRoute.busNumber} onChange={e => setNewRoute({...newRoute, busNumber: e.target.value})} />
              <input required placeholder="Route Description" className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl font-bold text-xs" value={newRoute.route} onChange={e => setNewRoute({...newRoute, route: e.target.value})} />
              <button type="submit" className="w-full py-4 bg-amber-500 text-white rounded-xl font-black uppercase text-xs shadow-lg active:scale-95 mt-4">Create Dispatch</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
