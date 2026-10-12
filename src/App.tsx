import React, { useState, useEffect } from 'react';
import { 
  LayoutDashboard, 
  Users, 
  FlaskConical, 
  Settings, 
  Archive, 
  Plus, 
  ShieldCheck,
  Calendar,
  Layers,
  Database,
  Trash2,
  Activity,
  Syringe
} from 'lucide-react';
import { 
  Cow, 
  Employee, 
  FarmMedication, 
  GenericAnimal, 
  ChickenLog, 
  ChickenStatus, 
  Chemical, 
  HeadcountRecord, 
  CattleRemovalLog,
  ChemicalAlternative,
  RemovalReason
} from './types/farm';
import { 
  INITIAL_EMPLOYEES, 
  INITIAL_COWS, 
  INITIAL_MEDICATIONS, 
  INITIAL_SHEEP, 
  INITIAL_GOATS, 
  INITIAL_PIGS, 
  INITIAL_CHICKEN_LOGS, 
  INITIAL_CHICKEN_STATUS, 
  INITIAL_CHEMICALS, 
  INITIAL_HEADCOUNTS, 
  INITIAL_CATTLE_REMOVALS 
} from './data/mockData';
import { TopAlerts } from './components/TopAlerts';
import { Dashboard } from './components/Dashboard';
import { CattleSection } from './components/CattleSection';
import { StaffSection } from './components/StaffSection';
import { OtherAnimalsSection } from './components/OtherAnimalsSection';
import { ChemicalsSection } from './components/ChemicalsSection';
import { MedicationsModal } from './components/MedicationsModal';
import { CattleArchiveModal } from './components/CattleArchiveModal';
import { PhpConfigModal } from './components/PhpConfigModal';
import { getApiConfig, phpApi } from './services/api';

// Enforce blank slate on fresh start
if (!localStorage.getItem('pl_blank_slate_v2_active')) {
  localStorage.removeItem('pl_employees');
  localStorage.removeItem('pl_cows');
  localStorage.removeItem('pl_medications');
  localStorage.removeItem('pl_sheep');
  localStorage.removeItem('pl_goats');
  localStorage.removeItem('pl_pigs');
  localStorage.removeItem('pl_chickenLogs');
  localStorage.removeItem('pl_chickenStatus');
  localStorage.removeItem('pl_chemicals');
  localStorage.removeItem('pl_headcounts');
  localStorage.removeItem('pl_cattleRemovals');
  localStorage.setItem('pl_blank_slate_v2_active', 'true');
}

export default function App() {
  // ================= STATE WITH BLANK SLATE =================
  const [employees, setEmployees] = useState<Employee[]>(() => {
    const saved = localStorage.getItem('pl_employees');
    return saved ? JSON.parse(saved) : INITIAL_EMPLOYEES;
  });

  const [cows, setCows] = useState<Cow[]>(() => {
    const saved = localStorage.getItem('pl_cows');
    return saved ? JSON.parse(saved) : INITIAL_COWS;
  });

  const [medications, setMedications] = useState<FarmMedication[]>(() => {
    const saved = localStorage.getItem('pl_medications');
    return saved ? JSON.parse(saved) : INITIAL_MEDICATIONS;
  });

  const [sheep, setSheep] = useState<GenericAnimal[]>(() => {
    const saved = localStorage.getItem('pl_sheep');
    return saved ? JSON.parse(saved) : INITIAL_SHEEP;
  });

  const [goats, setGoats] = useState<GenericAnimal[]>(() => {
    const saved = localStorage.getItem('pl_goats');
    return saved ? JSON.parse(saved) : INITIAL_GOATS;
  });

  const [pigs, setPigs] = useState<GenericAnimal[]>(() => {
    const saved = localStorage.getItem('pl_pigs');
    return saved ? JSON.parse(saved) : INITIAL_PIGS;
  });

  const [chickenLogs, setChickenLogs] = useState<ChickenLog[]>(() => {
    const saved = localStorage.getItem('pl_chickenLogs');
    return saved ? JSON.parse(saved) : INITIAL_CHICKEN_LOGS;
  });

  const [chickenStatus, setChickenStatus] = useState<ChickenStatus>(() => {
    const saved = localStorage.getItem('pl_chickenStatus');
    return saved ? JSON.parse(saved) : INITIAL_CHICKEN_STATUS;
  });

  const [chemicals, setChemicals] = useState<Chemical[]>(() => {
    const saved = localStorage.getItem('pl_chemicals');
    return saved ? JSON.parse(saved) : INITIAL_CHEMICALS;
  });

  const [headcounts, setHeadcounts] = useState<Record<string, HeadcountRecord[]>>(() => {
    const saved = localStorage.getItem('pl_headcounts');
    return saved ? JSON.parse(saved) : INITIAL_HEADCOUNTS;
  });

  const [cattleRemovals, setCattleRemovals] = useState<CattleRemovalLog[]>(() => {
    const saved = localStorage.getItem('pl_cattleRemovals');
    return saved ? JSON.parse(saved) : INITIAL_CATTLE_REMOVALS;
  });

  const [maleThreshold, setMaleThreshold] = useState<number>(() => {
    const saved = localStorage.getItem('pl_maleThreshold');
    return saved ? parseInt(saved, 10) : 10;
  });

  // Save changes to localStorage
  useEffect(() => {
    localStorage.setItem('pl_employees', JSON.stringify(employees));
  }, [employees]);
  useEffect(() => {
    localStorage.setItem('pl_cows', JSON.stringify(cows));
  }, [cows]);
  useEffect(() => {
    localStorage.setItem('pl_medications', JSON.stringify(medications));
  }, [medications]);
  useEffect(() => {
    localStorage.setItem('pl_sheep', JSON.stringify(sheep));
  }, [sheep]);
  useEffect(() => {
    localStorage.setItem('pl_goats', JSON.stringify(goats));
  }, [goats]);
  useEffect(() => {
    localStorage.setItem('pl_pigs', JSON.stringify(pigs));
  }, [pigs]);
  useEffect(() => {
    localStorage.setItem('pl_chickenLogs', JSON.stringify(chickenLogs));
  }, [chickenLogs]);
  useEffect(() => {
    localStorage.setItem('pl_chickenStatus', JSON.stringify(chickenStatus));
  }, [chickenStatus]);
  useEffect(() => {
    localStorage.setItem('pl_chemicals', JSON.stringify(chemicals));
  }, [chemicals]);
  useEffect(() => {
    localStorage.setItem('pl_headcounts', JSON.stringify(headcounts));
  }, [headcounts]);
  useEffect(() => {
    localStorage.setItem('pl_cattleRemovals', JSON.stringify(cattleRemovals));
  }, [cattleRemovals]);
  useEffect(() => {
    localStorage.setItem('pl_maleThreshold', maleThreshold.toString());
  }, [maleThreshold]);

  // Mobile menu / drawer state
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isMobileMoreSheetOpen, setIsMobileMoreSheetOpen] = useState(false);

  // Navigation view state
  const [currentView, setCurrentView] = useState<'dashboard' | 'cattle' | 'animals' | 'staff' | 'chemicals' | 'settings'>('dashboard');
  const [animalSubTab, setAnimalSubTab] = useState<'sheep' | 'goats' | 'pigs' | 'chickens'>('sheep');

  // Global modals
  const [isMedicationsModalOpen, setIsMedicationsModalOpen] = useState(false);
  const [isArchiveModalOpen, setIsArchiveModalOpen] = useState(false);
  const [isPhpConfigModalOpen, setIsPhpConfigModalOpen] = useState(false);

  const handleWipeAllData = () => {
    if (window.confirm('Wipe all local records and start completely blank with 0 records?')) {
      setEmployees([]);
      setCows([]);
      setMedications([]);
      setSheep([]);
      setGoats([]);
      setPigs([]);
      setChickenLogs([]);
      setChemicals([]);
      setCattleRemovals([]);
      setHeadcounts({ cattle: [], sheep: [], goats: [], pigs: [] });
      localStorage.removeItem('pl_employees');
      localStorage.removeItem('pl_cows');
      localStorage.removeItem('pl_medications');
      localStorage.removeItem('pl_sheep');
      localStorage.removeItem('pl_goats');
      localStorage.removeItem('pl_pigs');
      localStorage.removeItem('pl_chickenLogs');
      localStorage.removeItem('pl_chickenStatus');
      localStorage.removeItem('pl_chemicals');
      localStorage.removeItem('pl_headcounts');
      localStorage.removeItem('pl_cattleRemovals');
    }
  };

  const handleSyncFromPhp = async () => {
    try {
      const [fetchedCows, fetchedEmps, fetchedMeds, fetchedChems] = await Promise.all([
        phpApi.getCows().catch(() => null),
        phpApi.getEmployees().catch(() => null),
        phpApi.getMedications().catch(() => null),
        phpApi.getChemicals().catch(() => null)
      ]);
      if (fetchedCows && Array.isArray(fetchedCows)) setCows(fetchedCows);
      if (fetchedEmps && Array.isArray(fetchedEmps)) setEmployees(fetchedEmps);
      if (fetchedMeds && Array.isArray(fetchedMeds)) setMedications(fetchedMeds);
      if (fetchedChems && Array.isArray(fetchedChems)) setChemicals(fetchedChems);
    } catch {}
  };

  // Navigation helper
  const handleNavigate = (view: string, subTab?: string) => {
    setIsMobileMenuOpen(false);
    setIsMobileMoreSheetOpen(false);
    if (view === 'dashboard' || view === 'cattle' || view === 'staff' || view === 'chemicals' || view === 'settings') {
      setCurrentView(view as any);
    } else if (view === 'animals') {
      if (subTab === 'cattle') {
        setCurrentView('cattle');
      } else {
        setCurrentView('animals');
        if (subTab && ['sheep', 'goats', 'pigs', 'chickens'].includes(subTab)) {
          setAnimalSubTab(subTab as any);
        }
      }
    }
  };

  // ================= CATTLE HANDLERS =================
  const handleAddCow = (newCow: Cow) => {
    setCows((prev) => [newCow, ...prev]);
  };

  const handleUpdateCow = (updatedCow: Cow) => {
    setCows((prev) => prev.map((c) => (c.id === updatedCow.id ? updatedCow : c)));
  };

  const handleRemoveCow = (
    cowId: string,
    removalData: { reason: RemovalReason; newTagId?: string; notes: string; salePrice?: number; buyer?: string }
  ) => {
    const cow = cows.find((c) => c.id === cowId);
    if (!cow) return;

    if (removalData.reason === 'lost_tag_replaced' && removalData.newTagId) {
      // TAG REPLACEMENT: Keep cow active, update tag, append tagHistory
      const oldTag = cow.tag;
      const historyEntry = {
        oldTag,
        replacedDate: new Date().toISOString().slice(0, 10),
        reason: removalData.notes || `Replaced missing ear tag with ${removalData.newTagId}`
      };

      const updatedCow: Cow = {
        ...cow,
        tag: removalData.newTagId,
        tagHistory: [historyEntry, ...(cow.tagHistory || [])]
      };

      setCows((prev) => prev.map((c) => (c.id === cowId ? updatedCow : c)));

      // Log in cattle removals/replacements audit
      const removalEntry: CattleRemovalLog = {
        id: `REM-${Date.now()}`,
        cowId,
        originalTag: oldTag,
        date: new Date().toISOString().slice(0, 10),
        reason: 'lost_tag_replaced',
        newTagId: removalData.newTagId,
        notes: removalData.notes
      };
      setCattleRemovals((prev) => [removalEntry, ...prev]);
    } else {
      // PERMANENT REMOVAL (Death, Sale, Illness): Update status to inactive/archived
      const statusMap: Record<string, 'Sold' | 'Deceased' | 'Culled'> = {
        sale: 'Sold',
        death: 'Deceased',
        illness: 'Culled'
      };

      const newStatus = statusMap[removalData.reason] || 'Culled';
      const updatedCow: Cow = {
        ...cow,
        status: newStatus
      };

      setCows((prev) => prev.map((c) => (c.id === cowId ? updatedCow : c)));

      const removalEntry: CattleRemovalLog = {
        id: `REM-${Date.now()}`,
        cowId,
        originalTag: cow.tag,
        date: new Date().toISOString().slice(0, 10),
        reason: removalData.reason,
        notes: removalData.notes,
        salePrice: removalData.salePrice,
        buyer: removalData.buyer
      };
      setCattleRemovals((prev) => [removalEntry, ...prev]);
    }
  };

  // ================= EMPLOYEE HANDLERS =================
  const handleAddEmployee = (newEmployee: Employee) => {
    setEmployees((prev) => [newEmployee, ...prev]);
  };

  const handleUpdateEmployee = (updatedEmployee: Employee) => {
    setEmployees((prev) => prev.map((e) => (e.id === updatedEmployee.id ? updatedEmployee : e)));
  };

  const handleRemoveEmployee = (id: string) => {
    setEmployees((prev) => prev.filter((e) => e.id !== id));
  };

  // ================= OTHER LIVESTOCK HANDLERS =================
  const handleAddGenericAnimal = (species: 'sheep' | 'goats' | 'pigs', animal: GenericAnimal) => {
    if (species === 'sheep') setSheep((prev) => [animal, ...prev]);
    if (species === 'goats') setGoats((prev) => [animal, ...prev]);
    if (species === 'pigs') setPigs((prev) => [animal, ...prev]);
  };

  const handleRemoveGenericAnimal = (species: 'sheep' | 'goats' | 'pigs', id: string) => {
    if (species === 'sheep') setSheep((prev) => prev.filter((a) => a.id !== id));
    if (species === 'goats') setGoats((prev) => prev.filter((a) => a.id !== id));
    if (species === 'pigs') setPigs((prev) => prev.filter((a) => a.id !== id));
  };

  const handleAddChickenLog = (log: ChickenLog) => {
    setChickenLogs((prev) => [log, ...prev]);
  };

  const handleUpdateChickenStatus = (status: ChickenStatus) => {
    setChickenStatus(status);
  };

  const handleSaveHeadcount = (species: string, record: HeadcountRecord) => {
    setHeadcounts((prev) => ({
      ...prev,
      [species]: [record, ...(prev[species] || [])]
    }));
  };

  // ================= CHEMICAL HANDLERS =================
  const handleAddChemical = (chemical: Chemical) => {
    setChemicals((prev) => [chemical, ...prev]);
  };

  const handleRemoveChemical = (id: string) => {
    setChemicals((prev) => prev.filter((c) => c.id !== id));
  };

  const handleAddChemicalAlternative = (chemicalId: string, alt: ChemicalAlternative) => {
    setChemicals((prev) =>
      prev.map((c) => (c.id === chemicalId ? { ...c, alternatives: [...c.alternatives, alt] } : c))
    );
  };

  // Reset to default seed data
  const handleResetDemoData = () => {
    if (window.confirm('Reset all farm data back to initial seed data?')) {
      localStorage.clear();
      setEmployees(INITIAL_EMPLOYEES);
      setCows(INITIAL_COWS);
      setMedications(INITIAL_MEDICATIONS);
      setSheep(INITIAL_SHEEP);
      setGoats(INITIAL_GOATS);
      setPigs(INITIAL_PIGS);
      setChickenLogs(INITIAL_CHICKEN_LOGS);
      setChickenStatus(INITIAL_CHICKEN_STATUS);
      setChemicals(INITIAL_CHEMICALS);
      setHeadcounts(INITIAL_HEADCOUNTS);
      setCattleRemovals(INITIAL_CATTLE_REMOVALS);
      setMaleThreshold(10);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8F6F0] text-[#1E231F] flex flex-col font-sans antialiased">
      {/* ================= TOP NAVIGATION BAR ================= */}
      <header className="bg-[#28352A] text-[#EDE7D6] border-b border-[#3B4D3E] px-3.5 sm:px-6 py-2.5 sm:py-3.5 sticky top-0 z-40 shadow-xs">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-3 sm:gap-8">
          {/* Zone 1: Wordmark & Live indicator */}
          <div 
            onClick={() => handleNavigate('dashboard')}
            className="flex items-center gap-2 cursor-pointer select-none shrink-0"
          >
            <span className="text-base sm:text-lg font-extrabold tracking-tight text-white whitespace-nowrap flex items-center gap-1.5">
              <span>🌾</span> PastureLedger
            </span>
            <span className="hidden sm:inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold bg-[#3A4B3C] text-[#C2D2BF] border border-[#485D4B]">
              Herd v2.4
            </span>
          </div>

          {/* Zone 2: Desktop Navigation Links */}
          <nav className="hidden md:flex items-center gap-5 lg:gap-6 text-sm font-semibold text-[#CBD5C8]">
            <button
              onClick={() => handleNavigate('dashboard')}
              className={`hover:text-white transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                currentView === 'dashboard' ? 'text-white border-b-2 border-[#C28B38] pb-0.5' : ''
              }`}
            >
              Dashboard
            </button>
            <button
              onClick={() => handleNavigate('cattle')}
              className={`hover:text-white transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                currentView === 'cattle' ? 'text-white border-b-2 border-[#C28B38] pb-0.5' : ''
              }`}
            >
              Cattle Herd ({cows.filter((c) => c.status === 'Active').length})
            </button>
            <button
              onClick={() => handleNavigate('animals')}
              className={`hover:text-white transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                currentView === 'animals' ? 'text-white border-b-2 border-[#C28B38] pb-0.5' : ''
              }`}
            >
              Other Livestock
            </button>
            <button
              onClick={() => handleNavigate('staff')}
              className={`hover:text-white transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                currentView === 'staff' ? 'text-white border-b-2 border-[#C28B38] pb-0.5' : ''
              }`}
            >
              Staff &amp; Attendance ({employees.length})
            </button>
            <button
              onClick={() => handleNavigate('chemicals')}
              className={`hover:text-white transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                currentView === 'chemicals' ? 'text-white border-b-2 border-[#C28B38] pb-0.5' : ''
              }`}
            >
              Agrochemicals ({chemicals.length})
            </button>
          </nav>

          {/* Zone 3: Actions (Desktop & Mobile) */}
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            {/* Quick PHP Database Button */}
            <button
              onClick={() => setIsPhpConfigModalOpen(true)}
              className="px-2.5 sm:px-3 py-1.5 text-xs font-semibold rounded-lg bg-[#3A4A3C] text-[#EFEAE0] hover:bg-[#485C4B] transition-colors whitespace-nowrap shrink-0 cursor-pointer flex items-center gap-1.5 border border-[#485C4B] min-h-[36px]"
              title="Configure PHP Database API connection"
            >
              <Database className="w-3.5 h-3.5 text-[#C28B38]" />
              <span className="hidden sm:inline">PHP DB</span>
            </button>

            {/* Removal Audit (Desktop only) */}
            <button
              onClick={() => setIsArchiveModalOpen(true)}
              className="hidden sm:flex px-2.5 sm:px-3 py-1.5 text-xs font-medium rounded-lg text-[#D2DCcf] hover:text-white hover:bg-[#39493B] transition-colors whitespace-nowrap shrink-0 cursor-pointer items-center gap-1.5 border border-[#3B4D3E] min-h-[36px]"
              title="Audit Past Removals & Tag History"
            >
              <Archive className="w-3.5 h-3.5" />
              <span>Removal Audit</span>
            </button>

            {/* Settings (Desktop) */}
            <button
              onClick={() => handleNavigate('settings')}
              className={`hidden md:flex p-2 rounded-lg text-[#CBD5C8] hover:text-white hover:bg-[#39493B] transition-colors whitespace-nowrap shrink-0 cursor-pointer min-h-[36px] items-center justify-center ${
                currentView === 'settings' ? 'bg-[#39493B] text-white' : ''
              }`}
              title="Settings"
            >
              <Settings className="w-4 h-4" />
            </button>

            {/* Mobile Drawer Hamburger Button */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="md:hidden flex items-center justify-center w-9 h-9 rounded-lg bg-[#354637] text-white hover:bg-[#435946] border border-[#475E49] transition-colors cursor-pointer"
              title="Open Navigation Menu"
              aria-label="Navigation Menu"
            >
              {isMobileMenuOpen ? (
                <span className="text-base font-bold leading-none">✕</span>
              ) : (
                <div className="flex flex-col gap-1 w-4">
                  <span className="block h-0.5 w-full bg-white rounded-full"></span>
                  <span className="block h-0.5 w-full bg-white rounded-full"></span>
                  <span className="block h-0.5 w-full bg-white rounded-full"></span>
                </div>
              )}
            </button>
          </div>
        </div>

        {/* ================= MOBILE SLIDE-DOWN DRAWER MENU ================= */}
        {isMobileMenuOpen && (
          <div className="md:hidden pt-3 pb-2 border-t border-[#3B4D3E] mt-2.5 space-y-1 animate-in fade-in duration-150">
            <button
              onClick={() => handleNavigate('dashboard')}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-semibold transition-colors ${
                currentView === 'dashboard' ? 'bg-[#3C4E3D] text-white' : 'text-[#CBD5C8] hover:bg-[#324234]'
              }`}
            >
              <span className="flex items-center gap-2.5">
                <LayoutDashboard className="w-4 h-4 text-[#C28B38]" />
                <span>Dashboard</span>
              </span>
              <span className="text-xs text-[#8FA38D]">Overview</span>
            </button>

            <button
              onClick={() => handleNavigate('cattle')}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-semibold transition-colors ${
                currentView === 'cattle' ? 'bg-[#3C4E3D] text-white' : 'text-[#CBD5C8] hover:bg-[#324234]'
              }`}
            >
              <span className="flex items-center gap-2.5">
                <Layers className="w-4 h-4 text-[#C28B38]" />
                <span>Cattle Herd</span>
              </span>
              <span className="text-xs px-2 py-0.5 rounded-full bg-[#1F2B21] text-[#A6C0A4] font-bold">
                {cows.filter((c) => c.status === 'Active').length} active
              </span>
            </button>

            <button
              onClick={() => handleNavigate('animals')}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-semibold transition-colors ${
                currentView === 'animals' ? 'bg-[#3C4E3D] text-white' : 'text-[#CBD5C8] hover:bg-[#324234]'
              }`}
            >
              <span className="flex items-center gap-2.5">
                <Activity className="w-4 h-4 text-[#C28B38]" />
                <span>Other Livestock</span>
              </span>
              <span className="text-xs text-[#8FA38D]">Sheep, Goats, Pigs, Poultry</span>
            </button>

            <button
              onClick={() => handleNavigate('staff')}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-semibold transition-colors ${
                currentView === 'staff' ? 'bg-[#3C4E3D] text-white' : 'text-[#CBD5C8] hover:bg-[#324234]'
              }`}
            >
              <span className="flex items-center gap-2.5">
                <Users className="w-4 h-4 text-[#C28B38]" />
                <span>Staff &amp; Attendance</span>
              </span>
              <span className="text-xs px-2 py-0.5 rounded-full bg-[#1F2B21] text-[#A6C0A4] font-bold">
                {employees.length} staff
              </span>
            </button>

            <button
              onClick={() => handleNavigate('chemicals')}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-semibold transition-colors ${
                currentView === 'chemicals' ? 'bg-[#3C4E3D] text-white' : 'text-[#CBD5C8] hover:bg-[#324234]'
              }`}
            >
              <span className="flex items-center gap-2.5">
                <FlaskConical className="w-4 h-4 text-[#C28B38]" />
                <span>Agrochemicals</span>
              </span>
              <span className="text-xs px-2 py-0.5 rounded-full bg-[#1F2B21] text-[#A6C0A4] font-bold">
                {chemicals.length} chemicals
              </span>
            </button>

            <div className="pt-2 mt-1 border-t border-[#3B4D3E] grid grid-cols-2 gap-2">
              <button
                onClick={() => {
                  setIsMobileMenuOpen(false);
                  setIsArchiveModalOpen(true);
                }}
                className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-[#324234] text-xs font-semibold text-[#CBD5C8] hover:text-white"
              >
                <Archive className="w-3.5 h-3.5" />
                <span>Removal Audit</span>
              </button>

              <button
                onClick={() => {
                  setIsMobileMenuOpen(false);
                  setIsPhpConfigModalOpen(true);
                }}
                className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-[#3A4B3C] text-xs font-semibold text-[#E7D6BD] hover:text-white"
              >
                <Database className="w-3.5 h-3.5 text-[#C28B38]" />
                <span>PHP DB Sync</span>
              </button>
            </div>
          </div>
        )}
      </header>

      {/* ================= FIXED MOBILE BOTTOM NAVIGATION BAR ================= */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#28352A]/95 backdrop-blur-md border-t border-[#3B4D3E] grid grid-cols-5 items-center h-16 shadow-2xl px-1 pb-[env(safe-area-inset-bottom)]">
        <button
          onClick={() => handleNavigate('dashboard')}
          className={`flex flex-col items-center justify-center h-full min-h-[44px] transition-colors cursor-pointer ${
            currentView === 'dashboard' ? 'text-[#E5A84B] font-bold' : 'text-[#A8B7A6] hover:text-white'
          }`}
        >
          <LayoutDashboard className="w-5 h-5" />
          <span className="text-[10px] mt-1 tracking-tight">Home</span>
        </button>

        <button
          onClick={() => handleNavigate('cattle')}
          className={`flex flex-col items-center justify-center h-full min-h-[44px] transition-colors cursor-pointer relative ${
            currentView === 'cattle' ? 'text-[#E5A84B] font-bold' : 'text-[#A8B7A6] hover:text-white'
          }`}
        >
          <Layers className="w-5 h-5" />
          <span className="text-[10px] mt-1 tracking-tight">Cattle</span>
          {cows.filter((c) => c.status === 'Active').length > 0 && (
            <span className="absolute top-1.5 right-3 w-2 h-2 rounded-full bg-[#E5A84B]"></span>
          )}
        </button>

        <button
          onClick={() => handleNavigate('animals')}
          className={`flex flex-col items-center justify-center h-full min-h-[44px] transition-colors cursor-pointer ${
            currentView === 'animals' ? 'text-[#E5A84B] font-bold' : 'text-[#A8B7A6] hover:text-white'
          }`}
        >
          <Activity className="w-5 h-5" />
          <span className="text-[10px] mt-1 tracking-tight">Livestock</span>
        </button>

        <button
          onClick={() => handleNavigate('staff')}
          className={`flex flex-col items-center justify-center h-full min-h-[44px] transition-colors cursor-pointer relative ${
            currentView === 'staff' ? 'text-[#E5A84B] font-bold' : 'text-[#A8B7A6] hover:text-white'
          }`}
        >
          <Users className="w-5 h-5" />
          <span className="text-[10px] mt-1 tracking-tight">Staff</span>
        </button>

        <button
          onClick={() => setIsMobileMoreSheetOpen(true)}
          className={`flex flex-col items-center justify-center h-full min-h-[44px] transition-colors cursor-pointer ${
            currentView === 'chemicals' || currentView === 'settings' ? 'text-[#E5A84B] font-bold' : 'text-[#A8B7A6] hover:text-white'
          }`}
        >
          <Settings className="w-5 h-5" />
          <span className="text-[10px] mt-1 tracking-tight">More</span>
        </button>
      </nav>

      {/* ================= MOBILE "MORE" QUICK ACTION BOTTOM SHEET ================= */}
      {isMobileMoreSheetOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex items-end justify-center bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div 
            onClick={(e) => e.stopPropagation()}
            className="bg-[#FAF8F2] border-t border-[#D5CDBC] rounded-t-2xl w-full p-4 pb-8 shadow-2xl max-h-[85vh] overflow-y-auto animate-in slide-in-from-bottom duration-200"
          >
            <div className="w-12 h-1.5 bg-[#D1C9B6] rounded-full mx-auto mb-3"></div>
            <div className="flex items-center justify-between pb-3 border-b border-[#E8E1CE]">
              <div>
                <h3 className="font-bold text-base text-[#1E2620]">Farm Modules &amp; Tools</h3>
                <p className="text-xs text-[#63685C]">Quick access to all management features</p>
              </div>
              <button
                onClick={() => setIsMobileMoreSheetOpen(false)}
                className="w-8 h-8 rounded-full bg-[#EAE4D5] flex items-center justify-center font-bold text-[#4E4B3E] cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="grid grid-cols-2 gap-2.5 pt-3">
              <button
                onClick={() => handleNavigate('chemicals')}
                className="p-3 rounded-xl bg-white border border-[#D5CDBC] hover:border-[#8E9B82] text-left transition-colors cursor-pointer flex flex-col justify-between shadow-2xs min-h-[72px]"
              >
                <div className="flex items-center justify-between">
                  <FlaskConical className="w-5 h-5 text-[#2E4534]" />
                  <span className="text-[11px] font-bold px-1.5 py-0.5 rounded bg-[#EDE7D6] text-[#4F4B3C]">
                    {chemicals.length}
                  </span>
                </div>
                <span className="font-bold text-xs text-[#1E241F] mt-2">Agrochemicals</span>
              </button>

              <button
                onClick={() => {
                  setIsMobileMoreSheetOpen(false);
                  setIsArchiveModalOpen(true);
                }}
                className="p-3 rounded-xl bg-white border border-[#D5CDBC] hover:border-[#8E9B82] text-left transition-colors cursor-pointer flex flex-col justify-between shadow-2xs min-h-[72px]"
              >
                <div className="flex items-center justify-between">
                  <Archive className="w-5 h-5 text-[#8C5E1E]" />
                  <span className="text-[11px] font-bold px-1.5 py-0.5 rounded bg-[#EDE7D6] text-[#4F4B3C]">
                    {cattleRemovals.length}
                  </span>
                </div>
                <span className="font-bold text-xs text-[#1E241F] mt-2">Removal Audit</span>
              </button>

              <button
                onClick={() => {
                  setIsMobileMoreSheetOpen(false);
                  setIsPhpConfigModalOpen(true);
                }}
                className="p-3 rounded-xl bg-[#2E3C31] text-white text-left transition-colors cursor-pointer flex flex-col justify-between shadow-2xs min-h-[72px]"
              >
                <div className="flex items-center justify-between">
                  <Database className="w-5 h-5 text-[#C28B38]" />
                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-[#405244] text-[#EDE7D6]">
                    MySQL
                  </span>
                </div>
                <span className="font-bold text-xs text-white mt-2">PHP DB Connection</span>
              </button>

              <button
                onClick={() => {
                  setIsMobileMoreSheetOpen(false);
                  setIsMedicationsModalOpen(true);
                }}
                className="p-3 rounded-xl bg-white border border-[#D5CDBC] hover:border-[#8E9B82] text-left transition-colors cursor-pointer flex flex-col justify-between shadow-2xs min-h-[72px]"
              >
                <div className="flex items-center justify-between">
                  <Syringe className="w-5 h-5 text-[#C28B38]" />
                  <span className="text-[11px] font-bold px-1.5 py-0.5 rounded bg-[#EDE7D6] text-[#4F4B3C]">
                    {medications.length}
                  </span>
                </div>
                <span className="font-bold text-xs text-[#1E241F] mt-2">Medications Catalog</span>
              </button>

              <button
                onClick={() => handleNavigate('settings')}
                className="p-3 rounded-xl bg-white border border-[#D5CDBC] hover:border-[#8E9B82] text-left transition-colors cursor-pointer flex flex-col justify-between shadow-2xs min-h-[72px]"
              >
                <div className="flex items-center justify-between">
                  <Settings className="w-5 h-5 text-[#5D6357]" />
                </div>
                <span className="font-bold text-xs text-[#1E241F] mt-2">Herd Settings</span>
              </button>

              <button
                onClick={() => {
                  setIsMobileMoreSheetOpen(false);
                  handleWipeAllData();
                }}
                className="p-3 rounded-xl bg-[#FFF2F0] border border-[#FAD0CB] text-left transition-colors cursor-pointer flex flex-col justify-between shadow-2xs min-h-[72px]"
              >
                <div className="flex items-center justify-between">
                  <Trash2 className="w-5 h-5 text-[#C84B31]" />
                </div>
                <span className="font-bold text-xs text-[#C84B31] mt-2">Wipe All Local Data</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================= MAIN VIEWPORT CONTAINER ================= */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-3 sm:px-6 lg:px-8 py-3.5 sm:py-6 pb-28 md:pb-12">
        {/* Prominent High-Visibility Alerts at the TOP of the Screen */}
        <TopAlerts
          employees={employees}
          cows={cows}
          medications={medications}
          chemicals={chemicals}
          chickenStatus={chickenStatus}
          maleThreshold={maleThreshold}
          onNavigate={handleNavigate}
        />

        {/* Dynamic Route Content */}
        {currentView === 'dashboard' && (
          <Dashboard
            cows={cows}
            employees={employees}
            sheep={sheep}
            goats={goats}
            pigs={pigs}
            chickenLogs={chickenLogs}
            chemicals={chemicals}
            medications={medications}
            onNavigate={handleNavigate}
            onOpenAddCow={() => setCurrentView('cattle')}
            onOpenAttendance={() => setCurrentView('staff')}
          />
        )}

        {currentView === 'cattle' && (
          <CattleSection
            cows={cows}
            medications={medications}
            onAddCow={handleAddCow}
            onUpdateCow={handleUpdateCow}
            onRemoveCow={handleRemoveCow}
            onOpenMedications={() => setIsMedicationsModalOpen(true)}
          />
        )}

        {currentView === 'animals' && (
          <OtherAnimalsSection
            currentTab={animalSubTab}
            onTabChange={setAnimalSubTab}
            sheep={sheep}
            goats={goats}
            pigs={pigs}
            chickenLogs={chickenLogs}
            chickenStatus={chickenStatus}
            headcounts={headcounts}
            onAddAnimal={handleAddGenericAnimal}
            onRemoveAnimal={handleRemoveGenericAnimal}
            onAddChickenLog={handleAddChickenLog}
            onUpdateChickenStatus={handleUpdateChickenStatus}
            onSaveHeadcount={handleSaveHeadcount}
          />
        )}

        {currentView === 'staff' && (
          <StaffSection
            employees={employees}
            onAddEmployee={handleAddEmployee}
            onUpdateEmployee={handleUpdateEmployee}
            onRemoveEmployee={handleRemoveEmployee}
          />
        )}

        {currentView === 'chemicals' && (
          <ChemicalsSection
            chemicals={chemicals}
            onAddChemical={handleAddChemical}
            onRemoveChemical={handleRemoveChemical}
            onAddAlternative={handleAddChemicalAlternative}
          />
        )}

        {currentView === 'settings' && (
          <div className="space-y-6 max-w-2xl">
            <div>
              <h2 className="text-xl font-bold tracking-tight text-[#1E2620]">⚙️ Farm Configuration &amp; Alerts</h2>
              <p className="text-xs text-[#5D6357]">
                Adjust herd threshold limits, review removal archives, and manage seasonal vaccination catalogs.
              </p>
            </div>

            <div className="bg-white border border-[#D5CDBC] rounded-xl p-5 shadow-xs space-y-4">
              <h3 className="font-bold text-sm text-[#1E2620]">Livestock Ratios &amp; Thresholds</h3>
              <div>
                <label className="block text-xs font-bold text-[#4B5143] mb-1">
                  Alert when Male Cattle Count Exceeds:
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="number"
                    min="1"
                    max="50"
                    value={maleThreshold}
                    onChange={(e) => setMaleThreshold(parseInt(e.target.value) || 10)}
                    className="w-32 px-3 py-2 border border-[#D5CDBC] rounded-lg bg-[#FAF8F3] font-mono-numbers font-bold text-sm"
                  />
                  <span className="text-xs text-[#6B7163]">
                    Triggers top alert when active bull/steer count exceeds threshold.
                  </span>
                </div>
              </div>
            </div>

            <div className="bg-white border border-[#D5CDBC] rounded-xl p-5 shadow-xs space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-sm text-[#1E2620] flex items-center gap-1.5">
                    <Database className="w-4 h-4 text-[#C28B38]" />
                    PHP Backend &amp; MySQL Database Link
                  </h3>
                  <p className="text-xs text-[#696F61] mt-0.5">
                    Connect this interface to your PHP API (api.php) and MySQL database.
                  </p>
                </div>
                <button
                  onClick={() => setIsPhpConfigModalOpen(true)}
                  className="px-3.5 py-1.5 rounded-lg bg-[#2E3C31] text-white font-bold text-xs hover:bg-[#3D4F41] transition-colors cursor-pointer"
                >
                  Configure PHP API
                </button>
              </div>
            </div>

            <div className="bg-white border border-[#D5CDBC] rounded-xl p-5 shadow-xs space-y-3">
              <h3 className="font-bold text-sm text-[#1E2620]">Livestock Management Portals</h3>
              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  onClick={() => setIsMedicationsModalOpen(true)}
                  className="px-4 py-2 rounded-lg bg-[#F0ECE1] hover:bg-[#E3DDCD] text-[#2E3C31] font-semibold text-xs transition-colors cursor-pointer text-left"
                >
                  Manage Seasonal Medications Catalog
                </button>
                <button
                  onClick={() => setIsArchiveModalOpen(true)}
                  className="px-4 py-2 rounded-lg bg-[#F0ECE1] hover:bg-[#E3DDCD] text-[#2E3C31] font-semibold text-xs transition-colors cursor-pointer text-left"
                >
                  View Cattle Removal &amp; Tag History Archive
                </button>
              </div>
            </div>

            <div className="bg-white border border-[#D5CDBC] rounded-xl p-5 shadow-xs space-y-3">
              <h3 className="font-bold text-sm text-[#A62F1E]">Data Management (Blank Slate)</h3>
              <p className="text-xs text-[#696F61]">
                All records, attendance entries, birthdates, and cattle lineage are currently on a clean blank slate ready for your production data.
              </p>
              <div className="flex items-center gap-3">
                <button
                  onClick={handleWipeAllData}
                  className="px-4 py-2 rounded-lg bg-[#FCE5E2] text-[#A62F1E] font-semibold text-xs hover:bg-[#F9D0CB] transition-colors cursor-pointer flex items-center gap-1.5"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Wipe All Data (Blank Slate)</span>
                </button>
                <button
                  onClick={handleResetDemoData}
                  className="px-4 py-2 rounded-lg bg-[#F0ECE1] text-[#4F4B3C] font-semibold text-xs hover:bg-[#E2DDCB] transition-colors cursor-pointer"
                >
                  Load Demo Samples
                </button>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* ================= GLOBAL MODALS ================= */}
      <MedicationsModal
        isOpen={isMedicationsModalOpen}
        medications={medications}
        onClose={() => setIsMedicationsModalOpen(false)}
        onAddMedication={(newMed) => setMedications((prev) => [newMed, ...prev])}
      />

      <CattleArchiveModal
        isOpen={isArchiveModalOpen}
        onClose={() => setIsArchiveModalOpen(false)}
        removals={cattleRemovals}
      />

      <PhpConfigModal
        isOpen={isPhpConfigModalOpen}
        onClose={() => setIsPhpConfigModalOpen(false)}
        onSyncFromPhp={handleSyncFromPhp}
      />
    </div>
  );
}
