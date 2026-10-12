import React, { useState } from 'react';
import { 
  Plus, 
  Search, 
  CheckSquare, 
  AlertTriangle, 
  Trash2, 
  Activity, 
  Calendar,
  Egg,
  HeartPulse,
  Scale,
  Syringe,
  Wheat,
  ShieldAlert,
  ChevronRight,
  TrendingUp,
  AlertCircle
} from 'lucide-react';
import { 
  GenericAnimal, 
  ChickenLog, 
  LayerLog, 
  BroilerLog, 
  ChickenStatus, 
  HeadcountRecord 
} from '../types/farm';
import { fmtDate, todayISO, calculateAge } from '../utils/dateAndAge';

interface OtherAnimalsSectionProps {
  currentTab: 'sheep' | 'goats' | 'pigs' | 'chickens';
  onTabChange: (tab: 'sheep' | 'goats' | 'pigs' | 'chickens') => void;
  sheep: GenericAnimal[];
  goats: GenericAnimal[];
  pigs: GenericAnimal[];
  chickenLogs?: ChickenLog[];
  layerLogs: LayerLog[];
  broilerLogs: BroilerLog[];
  chickenStatus: ChickenStatus;
  headcounts: Record<string, HeadcountRecord[]>;
  onAddAnimal: (species: 'sheep' | 'goats' | 'pigs', animal: GenericAnimal) => void;
  onRemoveAnimal: (species: 'sheep' | 'goats' | 'pigs', id: string) => void;
  onAddLayerLog: (log: LayerLog) => void;
  onAddBroilerLog: (log: BroilerLog) => void;
  onUpdateChickenStatus: (status: ChickenStatus) => void;
  onSaveHeadcount: (species: string, record: HeadcountRecord) => void;
}

export const OtherAnimalsSection: React.FC<OtherAnimalsSectionProps> = ({
  currentTab,
  onTabChange,
  sheep,
  goats,
  pigs,
  layerLogs,
  broilerLogs,
  chickenStatus,
  headcounts,
  onAddAnimal,
  onRemoveAnimal,
  onAddLayerLog,
  onAddBroilerLog,
  onUpdateChickenStatus,
  onSaveHeadcount
}) => {
  // Search query for Animal ID / Breed
  const [searchQuery, setSearchQuery] = useState('');

  // Chicken sub-tab: 'layers' vs 'broilers'
  const [chickenSubTab, setChickenSubTab] = useState<'layers' | 'broilers'>('layers');

  // Modals state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isHeadcountModalOpen, setIsHeadcountModalOpen] = useState(false);
  const [isLayerLogModalOpen, setIsLayerLogModalOpen] = useState(false);
  const [isBroilerLogModalOpen, setIsBroilerLogModalOpen] = useState(false);
  const [isFlockStatusModalOpen, setIsFlockStatusModalOpen] = useState(false);

  // Mandatory Death & Loss Alert Modal State
  const [isDeathAlertModalOpen, setIsDeathAlertModalOpen] = useState(false);
  const [pendingHeadcount, setPendingHeadcount] = useState<HeadcountRecord | null>(null);
  const [deathCause, setDeathCause] = useState('');
  const [deathEffect, setDeathEffect] = useState('');
  const [deathFormError, setDeathFormError] = useState('');

  // Add generic animal form (Sheep, Goats, Pigs)
  const [newTag, setNewTag] = useState('');
  const [newSex, setNewSex] = useState<'F' | 'M'>('F');
  const [newBirthdate, setNewBirthdate] = useState(todayISO());
  const [newBreed, setNewBreed] = useState('');
  const [newColor, setNewColor] = useState('');
  const [newParentTag, setNewParentTag] = useState('');

  // Layer Log form state
  const [layerEggs, setLayerEggs] = useState(0);
  const [layerTrays, setLayerTrays] = useState(0);
  const [layerFeedType, setLayerFeedType] = useState('Layer Mash 16%');
  const [layerFeedKg, setLayerFeedKg] = useState(0);
  const [layerVaccine, setLayerVaccine] = useState('');
  const [layerVaccineDose, setLayerVaccineDose] = useState('');
  const [layerMortality, setLayerMortality] = useState(0);
  const [layerDeathCause, setLayerDeathCause] = useState('');
  const [layerDeathEffect, setLayerDeathEffect] = useState('');
  const [layerNotes, setLayerNotes] = useState('');

  // Broiler Log form state
  const [broilerWeight, setBroilerWeight] = useState(0);
  const [broilerWeightUnit, setBroilerWeightUnit] = useState<'g' | 'kg'>('g');
  const [broilerFeedType, setBroilerFeedType] = useState('Broiler Grower Pellets');
  const [broilerFeedKg, setBroilerFeedKg] = useState(0);
  const [broilerVaccine, setBroilerVaccine] = useState('');
  const [broilerVaccineDose, setBroilerVaccineDose] = useState('');
  const [broilerMortality, setBroilerMortality] = useState(0);
  const [broilerDeathCause, setBroilerDeathCause] = useState('');
  const [broilerDeathEffect, setBroilerDeathEffect] = useState('');
  const [broilerSold, setBroilerSold] = useState(0);
  const [broilerNotes, setBroilerNotes] = useState('');

  // Chicken status form
  const [flockBreed, setFlockBreed] = useState(chickenStatus.breed);
  const [flockSick, setFlockSick] = useState(chickenStatus.sick);
  const [flockSickNotes, setFlockSickNotes] = useState(chickenStatus.notes);

  // Headcount checklist state
  const [headcountChecked, setHeadcountChecked] = useState<Record<string, boolean>>({});
  const [flockHeadcountTotal, setFlockHeadcountTotal] = useState(150);
  const [flockHeadcountPresent, setFlockHeadcountPresent] = useState(150);

  // Helper for singular animal name (Corrects "Shee" to "Sheep"!)
  const getAnimalSingular = (tab: string): string => {
    if (tab === 'sheep') return 'Sheep';
    if (tab === 'goats') return 'Goat';
    if (tab === 'pigs') return 'Pig';
    return tab;
  };

  const getActiveList = (): GenericAnimal[] => {
    if (currentTab === 'sheep') return sheep;
    if (currentTab === 'goats') return goats;
    if (currentTab === 'pigs') return pigs;
    return [];
  };

  const activeList = getActiveList();

  // Search filter matching Animal Tag ID, breed, color
  const filteredAnimals = activeList.filter((a) => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return true;
    return (
      a.tag.toLowerCase().includes(q) ||
      a.id.toLowerCase().includes(q) ||
      a.breed.toLowerCase().includes(q) ||
      a.color.toLowerCase().includes(q) ||
      (a.parentTag && a.parentTag.toLowerCase().includes(q))
    );
  });

  // Save new sheep, goat, or pig
  const handleSaveAnimal = (e: React.FormEvent) => {
    e.preventDefault();
    if (currentTab === 'chickens') return;

    const prefix = currentTab === 'sheep' ? 'SHP' : currentTab === 'goats' ? 'GT' : 'PG';
    const newAnimal: GenericAnimal = {
      id: `${prefix}-${Date.now()}`,
      tag: newTag.trim() || `${prefix}-${String(activeList.length + 1).padStart(3, '0')}`,
      sex: newSex,
      birthdate: newBirthdate,
      breed: newBreed.trim() || 'Standard Commercial',
      color: newColor.trim() || 'Natural',
      parentTag: newParentTag.trim() || undefined,
      birthEvents: []
    };

    onAddAnimal(currentTab as 'sheep' | 'goats' | 'pigs', newAnimal);
    setIsAddModalOpen(false);
    setNewTag('');
    setNewBreed('');
    setNewColor('');
    setNewParentTag('');
  };

  // Save Layer Log
  const handleSaveLayerLog = (e: React.FormEvent) => {
    e.preventDefault();

    // If layer mortality was recorded, require cause and effect
    if (layerMortality > 0 && (!layerDeathCause.trim() || !layerDeathEffect.trim())) {
      alert('Mandatory Requirement: Please provide the cause and effect/action for the deceased layers.');
      return;
    }

    const newLog: LayerLog = {
      id: `LAY-${Date.now()}`,
      date: todayISO(),
      eggs: Number(layerEggs),
      trays: Number(layerTrays) || Math.floor(Number(layerEggs) / 30),
      feedType: layerFeedType.trim() || 'Layer Mash',
      feedKg: Number(layerFeedKg),
      vaccineGiven: layerVaccine.trim() || undefined,
      vaccineDose: layerVaccineDose.trim() || undefined,
      mortality: Number(layerMortality),
      deathCause: layerMortality > 0 ? layerDeathCause.trim() : undefined,
      deathEffect: layerMortality > 0 ? layerDeathEffect.trim() : undefined,
      notes: layerNotes.trim() || undefined
    };

    onAddLayerLog(newLog);

    // If deaths occurred, also record into headcount history to raise Top Alert
    if (layerMortality > 0) {
      onSaveHeadcount('layers', {
        id: `HC-LAY-${Date.now()}`,
        date: todayISO(),
        species: 'layers',
        total: (headcounts.layers?.[0]?.present || 150),
        present: (headcounts.layers?.[0]?.present || 150) - Number(layerMortality),
        missing: Number(layerMortality),
        missingTags: [],
        deathCause: layerDeathCause.trim(),
        deathEffect: layerDeathEffect.trim(),
        notes: `Layer daily mortality: ${layerMortality} birds`
      });
    }

    setIsLayerLogModalOpen(false);
    setLayerEggs(0);
    setLayerTrays(0);
    setLayerFeedKg(0);
    setLayerVaccine('');
    setLayerVaccineDose('');
    setLayerMortality(0);
    setLayerDeathCause('');
    setLayerDeathEffect('');
    setLayerNotes('');
  };

  // Save Broiler Log
  const handleSaveBroilerLog = (e: React.FormEvent) => {
    e.preventDefault();

    // If broiler mortality was recorded, require cause and effect
    if (broilerMortality > 0 && (!broilerDeathCause.trim() || !broilerDeathEffect.trim())) {
      alert('Mandatory Requirement: Please provide the cause and effect/action for the deceased broilers.');
      return;
    }

    const newLog: BroilerLog = {
      id: `BRL-${Date.now()}`,
      date: todayISO(),
      weight: Number(broilerWeight),
      weightUnit: broilerWeightUnit,
      feedType: broilerFeedType.trim() || 'Broiler Grower Pellets',
      feedKg: Number(broilerFeedKg),
      vaccineGiven: broilerVaccine.trim() || undefined,
      vaccineDose: broilerVaccineDose.trim() || undefined,
      mortality: Number(broilerMortality),
      deathCause: broilerMortality > 0 ? broilerDeathCause.trim() : undefined,
      deathEffect: broilerMortality > 0 ? broilerDeathEffect.trim() : undefined,
      soldOrHarvested: Number(broilerSold) || undefined,
      notes: broilerNotes.trim() || undefined
    };

    onAddBroilerLog(newLog);

    // If deaths occurred, record into headcount history to raise Top Alert
    if (broilerMortality > 0) {
      onSaveHeadcount('broilers', {
        id: `HC-BRL-${Date.now()}`,
        date: todayISO(),
        species: 'broilers',
        total: (headcounts.broilers?.[0]?.present || 200),
        present: (headcounts.broilers?.[0]?.present || 200) - Number(broilerMortality),
        missing: Number(broilerMortality),
        missingTags: [],
        deathCause: broilerDeathCause.trim(),
        deathEffect: broilerDeathEffect.trim(),
        notes: `Broiler daily mortality: ${broilerMortality} birds`
      });
    }

    setIsBroilerLogModalOpen(false);
    setBroilerWeight(0);
    setBroilerFeedKg(0);
    setBroilerVaccine('');
    setBroilerVaccineDose('');
    setBroilerMortality(0);
    setBroilerDeathCause('');
    setBroilerDeathEffect('');
    setBroilerSold(0);
    setBroilerNotes('');
  };

  const handleSaveFlockStatus = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateChickenStatus({
      breed: flockBreed.trim(),
      sick: flockSick,
      notes: flockSickNotes.trim()
    });
    setIsFlockStatusModalOpen(false);
  };

  // Open Headcount modal
  const openHeadcountModal = () => {
    if (currentTab === 'chickens') {
      const currentFlock = chickenSubTab === 'layers' 
        ? (headcounts.layers?.[0]?.present || 150)
        : (headcounts.broilers?.[0]?.present || 200);
      setFlockHeadcountTotal(currentFlock);
      setFlockHeadcountPresent(currentFlock);
    } else {
      const initial: Record<string, boolean> = {};
      activeList.forEach((a) => {
        initial[a.id] = true;
      });
      setHeadcountChecked(initial);
    }
    setIsHeadcountModalOpen(true);
  };

  // Validate Headcount Submission: If present < total, trigger Alert popup!
  const handleInitiateHeadcountSave = () => {
    let total = 0;
    let present = 0;
    let missingTags: string[] = [];
    const speciesName = currentTab === 'chickens' ? chickenSubTab : currentTab;

    if (currentTab === 'chickens') {
      total = Number(flockHeadcountTotal);
      present = Number(flockHeadcountPresent);
    } else {
      total = activeList.length;
      present = Object.values(headcountChecked).filter(Boolean).length;
      missingTags = activeList
        .filter((a) => !headcountChecked[a.id])
        .map((a) => a.tag);
    }

    const missing = total - present;

    const candidateRecord: HeadcountRecord = {
      id: `HC-${Date.now()}`,
      date: todayISO(),
      species: speciesName,
      total,
      present,
      missing: Math.max(0, missing),
      missingTags
    };

    // If headcount is less than previous count: TRIGGER MANDATORY ALERT POPUP!
    if (present < total) {
      setPendingHeadcount(candidateRecord);
      setDeathCause('');
      setDeathEffect('');
      setDeathFormError('');
      setIsHeadcountModalOpen(false);
      setIsDeathAlertModalOpen(true);
      return;
    }

    // If 100% accounted for, save directly
    onSaveHeadcount(speciesName, candidateRecord);
    setIsHeadcountModalOpen(false);
  };

  // Confirm Mortality Alert & Save Headcount
  const handleConfirmMortalityAlert = (e: React.FormEvent) => {
    e.preventDefault();
    if (!pendingHeadcount) return;

    if (!deathCause.trim()) {
      setDeathFormError('Mandatory: Please select or enter the Cause of Death / Loss.');
      return;
    }
    if (!deathEffect.trim()) {
      setDeathFormError('Mandatory: Please describe the Effect observed and Corrective Action taken.');
      return;
    }

    const finalRecord: HeadcountRecord = {
      ...pendingHeadcount,
      deathCause: deathCause.trim(),
      deathEffect: deathEffect.trim(),
      notes: `Loss of ${pendingHeadcount.missing} ${pendingHeadcount.species}. Cause: ${deathCause.trim()}`
    };

    onSaveHeadcount(pendingHeadcount.species, finalRecord);

    // If sheep, goats, or pigs missing, automatically remove them or flag them
    if (pendingHeadcount.missingTags && pendingHeadcount.missingTags.length > 0) {
      pendingHeadcount.missingTags.forEach((missingTag) => {
        const found = activeList.find((a) => a.tag === missingTag);
        if (found) {
          onRemoveAnimal(currentTab as 'sheep' | 'goats' | 'pigs', found.id);
        }
      });
    }

    setIsDeathAlertModalOpen(false);
    setPendingHeadcount(null);
  };

  return (
    <div className="space-y-5">
      {/* Top Tab Selectors */}
      <div className="flex items-center gap-2 border-b border-[#D5CDBC] pb-3 overflow-x-auto no-scrollbar touch-pan-x flex-nowrap -mx-1 px-1">
        <button
          onClick={() => onTabChange('sheep')}
          className={`px-3.5 py-2 text-xs font-bold rounded-lg whitespace-nowrap cursor-pointer transition-colors shrink-0 ${
            currentTab === 'sheep'
              ? 'bg-[#2E3C31] text-white shadow-xs'
              : 'bg-white border border-[#DCD5C3] text-[#4E4B3E] hover:bg-[#F2EFE6]'
          }`}
        >
          🐑 Sheep ({sheep.length})
        </button>
        <button
          onClick={() => onTabChange('goats')}
          className={`px-3.5 py-2 text-xs font-bold rounded-lg whitespace-nowrap cursor-pointer transition-colors shrink-0 ${
            currentTab === 'goats'
              ? 'bg-[#2E3C31] text-white shadow-xs'
              : 'bg-white border border-[#DCD5C3] text-[#4E4B3E] hover:bg-[#F2EFE6]'
          }`}
        >
          🐐 Goats ({goats.length})
        </button>
        <button
          onClick={() => onTabChange('pigs')}
          className={`px-3.5 py-2 text-xs font-bold rounded-lg whitespace-nowrap cursor-pointer transition-colors shrink-0 ${
            currentTab === 'pigs'
              ? 'bg-[#2E3C31] text-white shadow-xs'
              : 'bg-white border border-[#DCD5C3] text-[#4E4B3E] hover:bg-[#F2EFE6]'
          }`}
        >
          🐖 Pigs ({pigs.length})
        </button>
        <button
          onClick={() => onTabChange('chickens')}
          className={`px-3.5 py-2 text-xs font-bold rounded-lg whitespace-nowrap cursor-pointer transition-colors shrink-0 ${
            currentTab === 'chickens'
              ? 'bg-[#2E3C31] text-white shadow-xs'
              : 'bg-white border border-[#DCD5C3] text-[#4E4B3E] hover:bg-[#F2EFE6]'
          }`}
        >
          🐔 Poultry Flocks (Broilers &amp; Layers)
        </button>
      </div>

      {currentTab === 'chickens' ? (
        /* ================= SEPARATED CHICKENS VIEW: LAYERS vs BROILERS ================= */
        <div className="space-y-4">
          {/* Poultry Sub-Tabs: Layers vs Broilers */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-[#FAF8F3] p-3 rounded-xl border border-[#DDD5C0]">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-[#4B5143] uppercase tracking-wider mr-1 hidden sm:inline">
                Poultry Type:
              </span>
              <div className="inline-flex rounded-lg bg-[#EFEAE0] p-1 border border-[#D5CDBC]">
                <button
                  onClick={() => setChickenSubTab('layers')}
                  className={`px-4 py-2 text-xs font-bold rounded-md transition-all cursor-pointer flex items-center gap-1.5 ${
                    chickenSubTab === 'layers'
                      ? 'bg-[#2E3C31] text-white shadow-xs'
                      : 'text-[#4E4B3E] hover:text-[#1E241F]'
                  }`}
                >
                  <Egg className="w-3.5 h-3.5 text-[#E5A84B]" />
                  <span>🥚 Layers (Eggs, Vaccines, Feed)</span>
                </button>
                <button
                  onClick={() => setChickenSubTab('broilers')}
                  className={`px-4 py-2 text-xs font-bold rounded-md transition-all cursor-pointer flex items-center gap-1.5 ${
                    chickenSubTab === 'broilers'
                      ? 'bg-[#2E3C31] text-white shadow-xs'
                      : 'text-[#4E4B3E] hover:text-[#1E241F]'
                  }`}
                >
                  <Scale className="w-3.5 h-3.5 text-[#C28B38]" />
                  <span>🍗 Broilers (Weight, Vaccines, Feed)</span>
                </button>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsFlockStatusModalOpen(true)}
                className="px-3 py-2 text-xs font-semibold rounded-lg bg-[#EAE4D5] text-[#363428] hover:bg-[#DCD5C4] transition-colors cursor-pointer text-center min-h-[40px] flex items-center gap-1.5"
              >
                <HeartPulse className="w-3.5 h-3.5 text-[#C84B31]" />
                <span>Flock Health</span>
              </button>

              <button
                onClick={openHeadcountModal}
                className="px-3 py-2 text-xs font-semibold rounded-lg bg-[#EAE4D5] text-[#363428] hover:bg-[#DCD5C4] transition-colors cursor-pointer text-center min-h-[40px] flex items-center gap-1.5"
              >
                <CheckSquare className="w-3.5 h-3.5 text-[#2E3C31]" />
                <span>Headcount</span>
              </button>

              {chickenSubTab === 'layers' ? (
                <button
                  onClick={() => setIsLayerLogModalOpen(true)}
                  className="px-3.5 py-2 text-xs font-bold rounded-lg bg-[#C28B38] text-[#1B1405] hover:bg-[#A9752A] transition-colors cursor-pointer shadow-xs min-h-[40px] flex items-center gap-1.5 whitespace-nowrap"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>+ Log Layer Day</span>
                </button>
              ) : (
                <button
                  onClick={() => setIsBroilerLogModalOpen(true)}
                  className="px-3.5 py-2 text-xs font-bold rounded-lg bg-[#C28B38] text-[#1B1405] hover:bg-[#A9752A] transition-colors cursor-pointer shadow-xs min-h-[40px] flex items-center gap-1.5 whitespace-nowrap"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>+ Log Broiler Day</span>
                </button>
              )}
            </div>
          </div>

          {/* Sickness banner if flagged */}
          {chickenStatus.sick && (
            <div className="p-3 bg-[#FCE5E2] border border-[#F8B8B0] rounded-xl text-xs text-[#A62F1E] flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <div>
                <strong>Flock Health Notice:</strong> Signs of illness recorded in poultry pens. {chickenStatus.notes}
              </div>
            </div>
          )}

          {/* ================= SECTION A: LAYERS ================= */}
          {chickenSubTab === 'layers' && (
            <div className="space-y-4">
              {/* Layers Metric Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                <div className="bg-white border border-[#D5CDBC] rounded-xl p-4 shadow-2xs">
                  <div className="flex items-center justify-between text-[#63685C]">
                    <span className="text-xs uppercase font-semibold">Total Eggs Harvested</span>
                    <Egg className="w-4 h-4 text-[#C28B38]" />
                  </div>
                  <div className="text-2xl font-bold font-mono-numbers text-[#1E241F] mt-1">
                    {layerLogs.reduce((acc, l) => acc + (l.eggs || 0), 0).toLocaleString()}
                  </div>
                  <span className="text-[11px] text-[#696F61] mt-0.5 block">
                    ~{Math.floor(layerLogs.reduce((acc, l) => acc + (l.eggs || 0), 0) / 30)} standard 30-egg trays
                  </span>
                </div>

                <div className="bg-white border border-[#D5CDBC] rounded-xl p-4 shadow-2xs">
                  <div className="flex items-center justify-between text-[#63685C]">
                    <span className="text-xs uppercase font-semibold">Total Feed Logged</span>
                    <Wheat className="w-4 h-4 text-[#8C5E1E]" />
                  </div>
                  <div className="text-2xl font-bold font-mono-numbers text-[#1E241F] mt-1">
                    {layerLogs.reduce((acc, l) => acc + (l.feedKg || 0), 0).toLocaleString()} kg
                  </div>
                  <span className="text-[11px] text-[#696F61] mt-0.5 block">
                    Layer mash &amp; grain intake
                  </span>
                </div>

                <div className="bg-white border border-[#D5CDBC] rounded-xl p-4 shadow-2xs">
                  <div className="flex items-center justify-between text-[#63685C]">
                    <span className="text-xs uppercase font-semibold">Vaccine Doses Administered</span>
                    <Syringe className="w-4 h-4 text-[#294B32]" />
                  </div>
                  <div className="text-2xl font-bold font-mono-numbers text-[#294B32] mt-1">
                    {layerLogs.filter((l) => l.vaccineGiven).length} rounds
                  </div>
                  <span className="text-[11px] text-[#696F61] mt-0.5 block">
                    Latest: {layerLogs.find((l) => l.vaccineGiven)?.vaccineGiven || 'Newcastle / Gumboro'}
                  </span>
                </div>

                <div className="bg-white border border-[#D5CDBC] rounded-xl p-4 shadow-2xs">
                  <div className="flex items-center justify-between text-[#63685C]">
                    <span className="text-xs uppercase font-semibold">Total Mortality Recorded</span>
                    <AlertCircle className="w-4 h-4 text-[#C84B31]" />
                  </div>
                  <div className="text-2xl font-bold font-mono-numbers text-[#A62F1E] mt-1">
                    {layerLogs.reduce((acc, l) => acc + (l.mortality || 0), 0)} birds
                  </div>
                  <span className="text-[11px] text-[#696F61] mt-0.5 block">
                    Documented with Cause &amp; Effect
                  </span>
                </div>
              </div>

              {/* Layer Logs Ledger Table */}
              <div className="bg-white border border-[#D5CDBC] rounded-xl overflow-hidden shadow-2xs">
                <div className="p-3 bg-[#FAF8F2] border-b border-[#D5CDBC] flex items-center justify-between">
                  <div className="text-xs font-bold text-[#3E453A] flex items-center gap-1.5">
                    <Egg className="w-4 h-4 text-[#C28B38]" />
                    <span>Layer Hens Production &amp; Care Ledger (Eggs, Vaccines, Feed)</span>
                  </div>
                  <span className="text-[11px] font-mono text-[#696F61]">{layerLogs.length} entries</span>
                </div>

                {layerLogs.length === 0 ? (
                  <div className="p-8 text-center text-[#696F61]">
                    <Egg className="w-8 h-8 text-[#C28B38] mx-auto mb-2 opacity-60" />
                    <p className="font-semibold text-sm">No Layer Daily Logs registered yet.</p>
                    <p className="text-xs mt-1">Click "+ Log Layer Day" to track eggs collected, feed rations, and vaccines.</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full min-w-[650px] text-left text-xs border-collapse">
                      <thead className="bg-[#F0ECE1] border-b border-[#DDD5C0] text-[11px] font-bold text-[#4B5143] uppercase tracking-wider">
                        <tr>
                          <th className="p-3">Date</th>
                          <th className="p-3">Eggs (Trays)</th>
                          <th className="p-3">Feed (Type &amp; Kg)</th>
                          <th className="p-3">Vaccine Administered</th>
                          <th className="p-3">Mortality</th>
                          <th className="p-3">Notes &amp; Cause</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#EFEAE0]">
                        {layerLogs.map((log) => (
                          <tr key={log.id} className="hover:bg-[#FAF8F3]">
                            <td className="p-3 font-mono-numbers font-semibold">{fmtDate(log.date)}</td>
                            <td className="p-3">
                              <span className="font-mono-numbers font-bold text-[#294B32]">{log.eggs} eggs</span>
                              {log.trays ? <span className="text-[10px] text-[#696F61] ml-1">({log.trays} trays)</span> : null}
                            </td>
                            <td className="p-3">
                              <span className="font-semibold text-[#1E241F]">{log.feedKg} kg</span>
                              <span className="text-[11px] text-[#696F61] block">{log.feedType}</span>
                            </td>
                            <td className="p-3">
                              {log.vaccineGiven ? (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#E3EBE4] text-[#294B32]">
                                  <Syringe className="w-3 h-3" />
                                  {log.vaccineGiven} {log.vaccineDose ? `(${log.vaccineDose})` : ''}
                                </span>
                              ) : (
                                <span className="text-[#8C8675] italic">None today</span>
                              )}
                            </td>
                            <td className="p-3">
                              {log.mortality > 0 ? (
                                <span className="inline-flex items-center gap-1 font-bold text-[#C84B31] bg-[#FCE5E2] px-2 py-0.5 rounded">
                                  ⚠️ -{log.mortality}
                                </span>
                              ) : (
                                <span className="text-[#294B32] font-semibold">0</span>
                              )}
                            </td>
                            <td className="p-3 text-[#555A4E]">
                              {log.deathCause && (
                                <div className="text-[#A62F1E] font-medium text-[11px] mb-0.5">
                                  Cause: {log.deathCause} (Effect: {log.deathEffect})
                                </div>
                              )}
                              <span>{log.notes || '—'}</span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ================= SECTION B: BROILERS ================= */}
          {chickenSubTab === 'broilers' && (
            <div className="space-y-4">
              {/* Broilers Metric Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                <div className="bg-white border border-[#D5CDBC] rounded-xl p-4 shadow-2xs">
                  <div className="flex items-center justify-between text-[#63685C]">
                    <span className="text-xs uppercase font-semibold">Latest Sample Weight</span>
                    <Scale className="w-4 h-4 text-[#C28B38]" />
                  </div>
                  <div className="text-2xl font-bold font-mono-numbers text-[#1E241F] mt-1">
                    {broilerLogs.length > 0 ? `${broilerLogs[0].weight} ${broilerLogs[0].weightUnit}` : '—'}
                  </div>
                  <span className="text-[11px] text-[#696F61] mt-0.5 block">
                    Average bird weight
                  </span>
                </div>

                <div className="bg-white border border-[#D5CDBC] rounded-xl p-4 shadow-2xs">
                  <div className="flex items-center justify-between text-[#63685C]">
                    <span className="text-xs uppercase font-semibold">Total Broiler Feed</span>
                    <Wheat className="w-4 h-4 text-[#8C5E1E]" />
                  </div>
                  <div className="text-2xl font-bold font-mono-numbers text-[#1E241F] mt-1">
                    {broilerLogs.reduce((acc, l) => acc + (l.feedKg || 0), 0).toLocaleString()} kg
                  </div>
                  <span className="text-[11px] text-[#696F61] mt-0.5 block">
                    Starter / Grower / Finisher
                  </span>
                </div>

                <div className="bg-white border border-[#D5CDBC] rounded-xl p-4 shadow-2xs">
                  <div className="flex items-center justify-between text-[#63685C]">
                    <span className="text-xs uppercase font-semibold">Vaccine Doses Administered</span>
                    <Syringe className="w-4 h-4 text-[#294B32]" />
                  </div>
                  <div className="text-2xl font-bold font-mono-numbers text-[#294B32] mt-1">
                    {broilerLogs.filter((l) => l.vaccineGiven).length} rounds
                  </div>
                  <span className="text-[11px] text-[#696F61] mt-0.5 block">
                    Infectious Bronchitis / Gumboro
                  </span>
                </div>

                <div className="bg-white border border-[#D5CDBC] rounded-xl p-4 shadow-2xs">
                  <div className="flex items-center justify-between text-[#63685C]">
                    <span className="text-xs uppercase font-semibold">Birds Harvested / Sold</span>
                    <TrendingUp className="w-4 h-4 text-[#2E3C31]" />
                  </div>
                  <div className="text-2xl font-bold font-mono-numbers text-[#2E3C31] mt-1">
                    {broilerLogs.reduce((acc, l) => acc + (l.soldOrHarvested || 0), 0)} birds
                  </div>
                  <span className="text-[11px] text-[#696F61] mt-0.5 block">
                    Ready market birds
                  </span>
                </div>
              </div>

              {/* Broiler Logs Ledger Table */}
              <div className="bg-white border border-[#D5CDBC] rounded-xl overflow-hidden shadow-2xs">
                <div className="p-3 bg-[#FAF8F2] border-b border-[#D5CDBC] flex items-center justify-between">
                  <div className="text-xs font-bold text-[#3E453A] flex items-center gap-1.5">
                    <Scale className="w-4 h-4 text-[#C28B38]" />
                    <span>Broilers Growth &amp; Rations Ledger (Weight, Vaccines, Feed)</span>
                  </div>
                  <span className="text-[11px] font-mono text-[#696F61]">{broilerLogs.length} entries</span>
                </div>

                {broilerLogs.length === 0 ? (
                  <div className="p-8 text-center text-[#696F61]">
                    <Scale className="w-8 h-8 text-[#C28B38] mx-auto mb-2 opacity-60" />
                    <p className="font-semibold text-sm">No Broiler Daily Logs registered yet.</p>
                    <p className="text-xs mt-1">Click "+ Log Broiler Day" to log bird weights (g/kg), rations, and vaccines.</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full min-w-[650px] text-left text-xs border-collapse">
                      <thead className="bg-[#F0ECE1] border-b border-[#DDD5C0] text-[11px] font-bold text-[#4B5143] uppercase tracking-wider">
                        <tr>
                          <th className="p-3">Date</th>
                          <th className="p-3">Avg Bird Weight</th>
                          <th className="p-3">Feed Intake (Kg &amp; Type)</th>
                          <th className="p-3">Vaccine Administered</th>
                          <th className="p-3">Mortality</th>
                          <th className="p-3">Harvested / Sold</th>
                          <th className="p-3">Notes &amp; Cause</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#EFEAE0]">
                        {broilerLogs.map((log) => (
                          <tr key={log.id} className="hover:bg-[#FAF8F3]">
                            <td className="p-3 font-mono-numbers font-semibold">{fmtDate(log.date)}</td>
                            <td className="p-3 font-mono-numbers font-bold text-[#1E241F]">
                              {log.weight} {log.weightUnit}
                            </td>
                            <td className="p-3">
                              <span className="font-semibold text-[#1E241F]">{log.feedKg} kg</span>
                              <span className="text-[11px] text-[#696F61] block">{log.feedType}</span>
                            </td>
                            <td className="p-3">
                              {log.vaccineGiven ? (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#E3EBE4] text-[#294B32]">
                                  <Syringe className="w-3 h-3" />
                                  {log.vaccineGiven} {log.vaccineDose ? `(${log.vaccineDose})` : ''}
                                </span>
                              ) : (
                                <span className="text-[#8C8675] italic">None today</span>
                              )}
                            </td>
                            <td className="p-3">
                              {log.mortality > 0 ? (
                                <span className="inline-flex items-center gap-1 font-bold text-[#C84B31] bg-[#FCE5E2] px-2 py-0.5 rounded">
                                  ⚠️ -{log.mortality}
                                </span>
                              ) : (
                                <span className="text-[#294B32] font-semibold">0</span>
                              )}
                            </td>
                            <td className="p-3 font-mono-numbers text-[#8C5E1E] font-bold">
                              {log.soldOrHarvested ? `${log.soldOrHarvested} birds` : '—'}
                            </td>
                            <td className="p-3 text-[#555A4E]">
                              {log.deathCause && (
                                <div className="text-[#A62F1E] font-medium text-[11px] mb-0.5">
                                  Cause: {log.deathCause} (Effect: {log.deathEffect})
                                </div>
                              )}
                              <span>{log.notes || '—'}</span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      ) : (
        /* ================= SHEEP / GOATS / PIGS VIEW ================= */
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-lg font-bold text-[#1E2620] capitalize">
                {currentTab} Flock &amp; Herd Register
              </h3>
              <p className="text-xs text-[#5D6357]">
                Track individual tag identification, parentage, age, and perform verified headcounts.
              </p>
            </div>
            <div className="grid grid-cols-2 sm:flex sm:items-center gap-2 w-full sm:w-auto">
              <button
                onClick={openHeadcountModal}
                className="px-3 py-2 text-xs font-semibold rounded-lg bg-[#EAE4D5] text-[#363428] hover:bg-[#DCD5C4] transition-colors cursor-pointer text-center justify-center min-h-[40px] flex items-center gap-1.5"
              >
                <CheckSquare className="w-3.5 h-3.5 text-[#2E3C31]" />
                <span>Physical Headcount</span>
              </button>
              <button
                onClick={() => setIsAddModalOpen(true)}
                className="px-3.5 py-2 text-xs font-semibold rounded-lg bg-[#C28B38] text-[#1B1405] hover:bg-[#A9752A] transition-colors cursor-pointer shadow-xs capitalize text-center justify-center min-h-[40px] whitespace-nowrap font-bold flex items-center gap-1.5"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>+ Add {getAnimalSingular(currentTab)}</span>
              </button>
            </div>
          </div>

          {/* Quick Search Bar for Animal Tag ID / Breed */}
          <div className="bg-white border border-[#D5CDBC] rounded-xl p-3 sm:p-3.5 shadow-2xs flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5">
            <div className="flex-1 relative">
              <Search className="w-4 h-4 text-[#8C8675] absolute left-3 top-3" />
              <input
                type="text"
                placeholder={`Search ${getAnimalSingular(currentTab)} by Tag ID, Breed, or Color...`}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2.5 text-base sm:text-xs border border-[#D3CBB9] rounded-lg bg-[#FAF8F3] text-[#1E231F] placeholder-[#8A8574] focus:outline-none focus:border-[#2E3C31] min-h-[42px]"
              />
            </div>
            <span className="text-xs text-[#636A5B] font-mono shrink-0 text-right">
              Showing {filteredAnimals.length} of {activeList.length} registered {currentTab}
            </span>
          </div>

          {/* Cards Grid */}
          {filteredAnimals.length === 0 ? (
            <div className="bg-white border border-[#D5CDBC] rounded-xl p-8 text-center text-[#686E61]">
              <p className="font-semibold text-sm">No {currentTab} matched the search criteria.</p>
              <p className="text-xs mt-1">Try clearing the search or click "+ Add {getAnimalSingular(currentTab)}" to register one.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {filteredAnimals.map((animal) => {
                const age = calculateAge(animal.birthdate);
                return (
                  <div
                    key={animal.id}
                    className="bg-white border border-[#D5CDBC] rounded-xl p-3.5 shadow-2xs hover:border-[#8E9B82] transition-colors flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-center justify-between pb-2 border-b border-[#EDE7D6]">
                        <span className="font-mono-numbers font-bold text-sm px-2 py-0.5 rounded bg-[#2E3C31] text-white">
                          Tag: {animal.tag}
                        </span>
                        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                          animal.sex === 'F' ? 'bg-[#E3EBE4] text-[#294B32]' : 'bg-[#F4E9D7] text-[#8C5E1E]'
                        }`}>
                          {animal.sex === 'F' ? 'Female' : 'Male'}
                        </span>
                      </div>

                      <div className="py-2.5 text-xs space-y-1">
                        <div className="flex justify-between">
                          <span className="text-[#6D7365]">Breed:</span>
                          <span className="font-semibold text-[#1E241F]">{animal.breed}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-[#6D7365]">Color / Markings:</span>
                          <span className="font-semibold text-[#1E241F]">{animal.color}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-[#6D7365]">Age:</span>
                          <span className="font-semibold font-mono-numbers text-[#1E241F]">{age.formatted}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-[#6D7365]">Born:</span>
                          <span>{fmtDate(animal.birthdate)}</span>
                        </div>
                        {animal.parentTag && (
                          <div className="flex justify-between">
                            <span className="text-[#6D7365]">Parent Tag:</span>
                            <span className="font-semibold text-[#2E3C31]">{animal.parentTag}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="pt-2 border-t border-[#EDE7D6] flex justify-end">
                      <button
                        onClick={() => onRemoveAnimal(currentTab as 'sheep' | 'goats' | 'pigs', animal.id)}
                        className="text-xs text-[#A62F1E] hover:underline cursor-pointer flex items-center gap-1 p-1 min-h-[36px]"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Remove / Archive</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ================= MODAL: ADD GENERIC ANIMAL (Sheep, Goats, Pigs) ================= */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:p-4 bg-black/50 backdrop-blur-xs overflow-y-auto">
          <div className="bg-[#FAF8F2] border-t sm:border border-[#D5CDBC] rounded-t-2xl sm:rounded-2xl w-full max-w-md p-4 sm:p-6 shadow-2xl max-h-[92vh] overflow-y-auto my-0 sm:my-8 flex flex-col">
            <div className="w-12 h-1.5 bg-[#D1C9B6] rounded-full mx-auto mb-2 sm:hidden shrink-0"></div>
            <div className="flex items-center justify-between pb-3 border-b border-[#E8E1CE] shrink-0">
              <h3 className="text-base sm:text-lg font-bold text-[#1E2620] capitalize">
                Register New {getAnimalSingular(currentTab)}
              </h3>
              <button
                type="button"
                onClick={() => setIsAddModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 text-lg font-bold cursor-pointer p-1 min-h-[36px]"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveAnimal} className="space-y-3.5 pt-4 text-xs">
              <div>
                <label className="block text-[11px] font-bold text-[#4B5143] uppercase tracking-wider mb-1">
                  Tag ID Number *
                </label>
                <input
                  type="text"
                  placeholder={`e.g. ${getAnimalSingular(currentTab).toUpperCase().slice(0, 2)}-014`}
                  value={newTag}
                  onChange={(e) => setNewTag(e.target.value)}
                  className="w-full px-3 py-2 border border-[#D5CDBC] rounded-lg bg-white font-mono-numbers font-semibold text-sm"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-[#4B5143] uppercase tracking-wider mb-1">
                    Sex *
                  </label>
                  <select
                    value={newSex}
                    onChange={(e) => setNewSex(e.target.value as 'F' | 'M')}
                    className="w-full px-3 py-2 border border-[#D5CDBC] rounded-lg bg-white"
                  >
                    <option value="F">Female (Dam / Ewe / Sow)</option>
                    <option value="M">Male (Sire / Ram / Boar)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-[#4B5143] uppercase tracking-wider mb-1">
                    Birthdate *
                  </label>
                  <input
                    type="date"
                    required
                    value={newBirthdate}
                    onChange={(e) => setNewBirthdate(e.target.value)}
                    className="w-full px-3 py-2 border border-[#D5CDBC] rounded-lg bg-white font-semibold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-[#4B5143] uppercase tracking-wider mb-1">
                    Breed
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Dorper, Boer Goat, Large White"
                    value={newBreed}
                    onChange={(e) => setNewBreed(e.target.value)}
                    className="w-full px-3 py-2 border border-[#D5CDBC] rounded-lg bg-white"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-[#4B5143] uppercase tracking-wider mb-1">
                    Color / Markings
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. White with Black Head"
                    value={newColor}
                    onChange={(e) => setNewColor(e.target.value)}
                    className="w-full px-3 py-2 border border-[#D5CDBC] rounded-lg bg-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-[#4B5143] uppercase tracking-wider mb-1">
                  Parent Tag ID (Optional Dam/Sire Reference)
                </label>
                <input
                  type="text"
                  placeholder="e.g. SHP-002"
                  value={newParentTag}
                  onChange={(e) => setNewParentTag(e.target.value)}
                  className="w-full px-3 py-2 border border-[#D5CDBC] rounded-lg bg-white font-mono-numbers"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#E8E1CE]">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2.5 rounded-lg border border-[#D5CDBC] font-semibold text-xs min-h-[42px]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-lg bg-[#C28B38] text-[#1B1405] font-bold min-h-[42px]"
                >
                  Register {getAnimalSingular(currentTab)}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= MODAL: PHYSICAL HEADCOUNT ================= */}
      {isHeadcountModalOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:p-4 bg-black/50 backdrop-blur-xs overflow-y-auto">
          <div className="bg-[#FAF8F2] border-t sm:border border-[#D5CDBC] rounded-t-2xl sm:rounded-2xl w-full max-w-md p-4 sm:p-6 shadow-2xl max-h-[92vh] overflow-y-auto my-0 sm:my-8 flex flex-col">
            <div className="w-12 h-1.5 bg-[#D1C9B6] rounded-full mx-auto mb-2 sm:hidden shrink-0"></div>
            <div className="flex items-center justify-between pb-2 border-b border-[#E8E1CE] shrink-0">
              <h3 className="text-base font-bold text-[#1E2620] capitalize">
                Physical Headcount — {currentTab === 'chickens' ? chickenSubTab : currentTab}
              </h3>
              <button
                type="button"
                onClick={() => setIsHeadcountModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 font-bold p-1 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-[#636A5B] my-2">
              Verify all animals physically present today. If headcount is less than previous count, a mandatory cause/effect mortality alert will be triggered.
            </p>

            {currentTab === 'chickens' ? (
              <div className="space-y-3 py-2 text-xs">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold mb-1">Previous Registered Total</label>
                    <input
                      type="number"
                      min="0"
                      value={flockHeadcountTotal}
                      onChange={(e) => setFlockHeadcountTotal(parseInt(e.target.value) || 0)}
                      className="w-full px-3 py-2 border rounded-lg bg-white font-mono-numbers text-sm font-semibold"
                    />
                  </div>
                  <div>
                    <label className="block font-bold mb-1">Count Present Today *</label>
                    <input
                      type="number"
                      min="0"
                      value={flockHeadcountPresent}
                      onChange={(e) => setFlockHeadcountPresent(parseInt(e.target.value) || 0)}
                      className="w-full px-3 py-2 border rounded-lg bg-white font-mono-numbers text-sm font-semibold"
                    />
                  </div>
                </div>

                {flockHeadcountPresent < flockHeadcountTotal && (
                  <div className="p-2.5 bg-[#FFF2F0] border border-[#FAD0CB] rounded-lg text-xs text-[#A62F1E] flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 shrink-0" />
                    <span>
                      ⚠️ Drop detected: <strong>{flockHeadcountTotal - flockHeadcountPresent} birds</strong> unaccounted for. You will be prompted for mandatory Cause &amp; Effect.
                    </span>
                  </div>
                )}
              </div>
            ) : (
              <div>
                <div className="flex items-center justify-between text-xs font-semibold py-1 mb-1 text-[#4F5647]">
                  <span>Total Registered: {activeList.length}</span>
                  <span>Checked Present: {Object.values(headcountChecked).filter(Boolean).length}</span>
                </div>

                <div className="max-h-60 overflow-y-auto space-y-1.5 border border-[#DDD5C0] p-2 rounded-lg bg-white">
                  {activeList.map((a) => (
                    <label key={a.id} className="flex items-center gap-2 p-2 hover:bg-[#FAF8F3] rounded text-xs cursor-pointer">
                      <input
                        type="checkbox"
                        className="w-4 h-4 rounded text-[#2E3C31]"
                        checked={headcountChecked[a.id] ?? true}
                        onChange={(e) =>
                          setHeadcountChecked({ ...headcountChecked, [a.id]: e.target.checked })
                        }
                      />
                      <span className="font-bold text-[#1E2620]">{a.tag}</span>
                      <span className="text-[#6D7365]">({a.breed} · {a.sex})</span>
                    </label>
                  ))}
                </div>

                {Object.values(headcountChecked).filter(Boolean).length < activeList.length && (
                  <div className="p-2.5 bg-[#FFF2F0] border border-[#FAD0CB] rounded-lg text-xs text-[#A62F1E] flex items-center gap-2 mt-2">
                    <AlertTriangle className="w-4 h-4 shrink-0" />
                    <span>
                      ⚠️ Missing count: <strong>{activeList.length - Object.values(headcountChecked).filter(Boolean).length} {currentTab}</strong> missing. Cause &amp; Effect required upon saving.
                    </span>
                  </div>
                )}
              </div>
            )}

            <div className="flex justify-end gap-2 pt-3 border-t border-[#E8E1CE] mt-3">
              <button
                type="button"
                onClick={() => setIsHeadcountModalOpen(false)}
                className="px-4 py-2.5 rounded-lg border border-[#D5CDBC] font-semibold text-xs min-h-[42px]"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleInitiateHeadcountSave}
                className="px-5 py-2.5 rounded-lg bg-[#2E3C31] text-white font-bold text-xs min-h-[42px]"
              >
                Submit Headcount
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================= ALERT POP-UP: MANDATORY CAUSE & EFFECT FOR HEADCOUNT DROPS ================= */}
      {isDeathAlertModalOpen && pendingHeadcount && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:p-4 bg-black/60 backdrop-blur-xs overflow-y-auto">
          <div className="bg-[#FAF8F2] border-2 border-[#C84B31] rounded-t-2xl sm:rounded-2xl w-full max-w-lg p-5 sm:p-6 shadow-2xl max-h-[92vh] overflow-y-auto my-0 sm:my-8 flex flex-col">
            <div className="w-12 h-1.5 bg-[#D1C9B6] rounded-full mx-auto mb-2 sm:hidden shrink-0"></div>

            {/* Alert Header */}
            <div className="flex items-start gap-3 pb-3 border-b border-[#FAD0CB]">
              <div className="w-10 h-10 rounded-full bg-[#FCE5E2] text-[#C84B31] flex items-center justify-center shrink-0 border border-[#F8B8B0]">
                <ShieldAlert className="w-6 h-6 animate-pulse" />
              </div>
              <div className="flex-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#C84B31] block">
                  Mandatory Farm Alert
                </span>
                <h3 className="text-base sm:text-lg font-extrabold text-[#992E1B]">
                  Livestock Headcount Drop Detected ({pendingHeadcount.missing} {pendingHeadcount.species} Lost)
                </h3>
                <p className="text-xs text-[#5D6357] mt-0.5">
                  Previous: <strong>{pendingHeadcount.total}</strong> → Present: <strong>{pendingHeadcount.present}</strong>.
                  Deaths and missing livestock require a documented Cause and Clinical Effect before records can update.
                </p>
              </div>
            </div>

            <form onSubmit={handleConfirmMortalityAlert} className="space-y-3.5 pt-4 text-xs">
              {deathFormError && (
                <div className="p-2.5 bg-[#FCE5E2] border border-[#F8B8B0] rounded-lg text-xs text-[#A62F1E] font-semibold">
                  {deathFormError}
                </div>
              )}

              {/* Cause of Death / Loss */}
              <div>
                <label className="block text-[11px] font-bold text-[#4B5143] uppercase tracking-wider mb-1.5">
                  Cause of Death / Unaccounted Loss * (Mandatory)
                </label>
                <div className="flex flex-wrap gap-1.5 mb-2">
                  {[
                    'Disease / Infection',
                    'Predator Attack',
                    'Extreme Cold / Hypothermia',
                    'Heat Stress',
                    'Poisonous Plant Ingestion',
                    'Accidental Injury',
                    'Unknown Sudden Death'
                  ].map((commonCause) => (
                    <button
                      key={commonCause}
                      type="button"
                      onClick={() => setDeathCause(commonCause)}
                      className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition-colors cursor-pointer border ${
                        deathCause === commonCause
                          ? 'bg-[#A62F1E] text-white border-[#872416]'
                          : 'bg-white text-[#4A4739] border-[#D5CDBC] hover:bg-[#F2EFE6]'
                      }`}
                    >
                      {commonCause}
                    </button>
                  ))}
                </div>
                <input
                  type="text"
                  required
                  placeholder="Specify cause (e.g. Heartwater, Pulpy Kidney, Coccidiosis, Jackal attack, etc.)"
                  value={deathCause}
                  onChange={(e) => setDeathCause(e.target.value)}
                  className="w-full px-3 py-2 border border-[#D5CDBC] rounded-lg bg-white text-sm font-semibold"
                />
              </div>

              {/* Effect & Corrective Action */}
              <div>
                <label className="block text-[11px] font-bold text-[#4B5143] uppercase tracking-wider mb-1">
                  Clinical Effect Observed &amp; Corrective Action Taken * (Mandatory)
                </label>
                <textarea
                  required
                  rows={3}
                  placeholder="Describe observed symptoms, post-mortem findings, carcass disposal method, pen disinfection, and booster vaccinations given to protect surviving flock..."
                  value={deathEffect}
                  onChange={(e) => setDeathEffect(e.target.value)}
                  className="w-full px-3 py-2 border border-[#D5CDBC] rounded-lg bg-white text-xs leading-relaxed"
                />
              </div>

              {pendingHeadcount.missingTags && pendingHeadcount.missingTags.length > 0 && (
                <div className="text-[11px] text-[#696F61] bg-[#F5EFE1] p-2.5 rounded-lg border border-[#DDD5C0]">
                  <strong>Tags marked missing:</strong> {pendingHeadcount.missingTags.join(', ')}.
                  These animals will be recorded as deceased in biosecurity audit logs.
                </div>
              )}

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#FAD0CB]">
                <button
                  type="button"
                  onClick={() => {
                    setIsDeathAlertModalOpen(false);
                    setIsHeadcountModalOpen(true);
                  }}
                  className="px-4 py-2.5 rounded-lg border border-[#D5CDBC] font-semibold text-xs min-h-[42px] cursor-pointer"
                >
                  Cancel &amp; Re-count
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-lg bg-[#C84B31] text-white font-bold text-xs min-h-[42px] shadow-xs hover:bg-[#A93820] cursor-pointer flex items-center gap-1.5"
                >
                  <AlertTriangle className="w-3.5 h-3.5" />
                  <span>Confirm &amp; Log Mortality Alert</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= MODAL: LOG LAYER DAY (Eggs, Vaccines, Feed) ================= */}
      {isLayerLogModalOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:p-4 bg-black/50 backdrop-blur-xs overflow-y-auto">
          <div className="bg-[#FAF8F2] border-t sm:border border-[#D5CDBC] rounded-t-2xl sm:rounded-2xl w-full max-w-lg p-4 sm:p-6 shadow-2xl max-h-[92vh] overflow-y-auto my-0 sm:my-8 flex flex-col">
            <div className="w-12 h-1.5 bg-[#D1C9B6] rounded-full mx-auto mb-2 sm:hidden shrink-0"></div>
            <div className="flex items-center justify-between pb-3 border-b border-[#E8E1CE] shrink-0">
              <h3 className="text-base sm:text-lg font-bold text-[#1E2620] flex items-center gap-1.5">
                <Egg className="w-4 h-4 text-[#C28B38]" />
                <span>Log Layer Flock: Eggs, Feed &amp; Vaccines</span>
              </h3>
              <button
                type="button"
                onClick={() => setIsLayerLogModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 font-bold p-1 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveLayerLog} className="space-y-3.5 pt-4 text-xs">
              {/* Eggs Collected */}
              <div className="grid grid-cols-2 gap-3 bg-[#FAF4E8] p-3 rounded-xl border border-[#E8DEC7]">
                <div>
                  <label className="block text-[11px] font-bold text-[#4B5143] uppercase tracking-wider mb-1">
                    Total Eggs Harvested *
                  </label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={layerEggs}
                    onChange={(e) => {
                      const val = parseInt(e.target.value) || 0;
                      setLayerEggs(val);
                      setLayerTrays(Math.floor(val / 30));
                    }}
                    className="w-full px-3 py-2 border border-[#D5CDBC] rounded-lg bg-white font-mono-numbers text-base font-bold text-[#294B32]"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-[#4B5143] uppercase tracking-wider mb-1">
                    Trays Packed (30 eggs/tray)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={layerTrays}
                    onChange={(e) => setLayerTrays(parseInt(e.target.value) || 0)}
                    className="w-full px-3 py-2 border border-[#D5CDBC] rounded-lg bg-white font-mono-numbers text-base font-semibold"
                  />
                </div>
              </div>

              {/* Feed Intake */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-[#4B5143] uppercase tracking-wider mb-1">
                    Feed Quantity (Kg) *
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.5"
                    required
                    placeholder="e.g. 35"
                    value={layerFeedKg}
                    onChange={(e) => setLayerFeedKg(parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-2 border border-[#D5CDBC] rounded-lg bg-white font-semibold font-mono-numbers text-sm"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-[#4B5143] uppercase tracking-wider mb-1">
                    Feed Type *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Layer Mash 16%, Shell Grit"
                    value={layerFeedType}
                    onChange={(e) => setLayerFeedType(e.target.value)}
                    className="w-full px-3 py-2 border border-[#D5CDBC] rounded-lg bg-white font-semibold text-xs"
                  />
                </div>
              </div>

              {/* Vaccines Administered */}
              <div className="grid grid-cols-2 gap-3 bg-[#F2F7F2] p-3 rounded-xl border border-[#D1E3D3]">
                <div>
                  <label className="block text-[11px] font-bold text-[#294B32] uppercase tracking-wider mb-1">
                    Vaccine Administered (If Any)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Newcastle ND-LaSota, Gumboro"
                    value={layerVaccine}
                    onChange={(e) => setLayerVaccine(e.target.value)}
                    className="w-full px-3 py-2 border border-[#B9D5BC] rounded-lg bg-white text-xs"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-[#294B32] uppercase tracking-wider mb-1">
                    Dose &amp; Application Route
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. In drinking water / Eye drop"
                    value={layerVaccineDose}
                    onChange={(e) => setLayerVaccineDose(e.target.value)}
                    className="w-full px-3 py-2 border border-[#B9D5BC] rounded-lg bg-white text-xs"
                  />
                </div>
              </div>

              {/* Mortality / Deaths Tracking */}
              <div>
                <label className="block text-[11px] font-bold text-[#4B5143] uppercase tracking-wider mb-1">
                  Dead Birds Today (Mortality Count)
                </label>
                <input
                  type="number"
                  min="0"
                  value={layerMortality}
                  onChange={(e) => setLayerMortality(parseInt(e.target.value) || 0)}
                  className="w-full px-3 py-2 border border-[#D5CDBC] rounded-lg bg-white font-mono-numbers text-sm font-semibold"
                />

                {layerMortality > 0 && (
                  <div className="mt-2.5 p-3 bg-[#FFF2F0] border border-[#FAD0CB] rounded-xl space-y-2">
                    <div className="flex items-center gap-1.5 text-[#C84B31] font-bold text-xs">
                      <AlertTriangle className="w-4 h-4" />
                      <span>Mortality Alert: Cause &amp; Effect Required</span>
                    </div>
                    <div>
                      <input
                        type="text"
                        required
                        placeholder="Cause of Death (e.g. Egg peritonitis, Heat stress, Coccidiosis)"
                        value={layerDeathCause}
                        onChange={(e) => setLayerDeathCause(e.target.value)}
                        className="w-full px-3 py-1.5 border border-[#F4BBB3] rounded-lg bg-white text-xs font-semibold"
                      />
                    </div>
                    <div>
                      <textarea
                        required
                        rows={2}
                        placeholder="Clinical Effect observed &amp; Corrective Action (quarantine, carcass buried, antibiotics in water)..."
                        value={layerDeathEffect}
                        onChange={(e) => setLayerDeathEffect(e.target.value)}
                        className="w-full px-3 py-1.5 border border-[#F4BBB3] rounded-lg bg-white text-xs"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Notes */}
              <div>
                <label className="block text-[11px] font-bold text-[#4B5143] uppercase tracking-wider mb-1">
                  General Production Notes
                </label>
                <input
                  type="text"
                  placeholder="e.g. Clean bedding added, water lines flushed"
                  value={layerNotes}
                  onChange={(e) => setLayerNotes(e.target.value)}
                  className="w-full px-3 py-2 border border-[#D5CDBC] rounded-lg bg-white text-xs"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#E8E1CE]">
                <button
                  type="button"
                  onClick={() => setIsLayerLogModalOpen(false)}
                  className="px-4 py-2.5 rounded-lg border border-[#D5CDBC] font-semibold text-xs min-h-[42px]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-lg bg-[#2E3C31] text-white font-bold text-xs min-h-[42px]"
                >
                  Save Layer Log
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= MODAL: LOG BROILER DAY (Weight, Vaccines, Feed) ================= */}
      {isBroilerLogModalOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:p-4 bg-black/50 backdrop-blur-xs overflow-y-auto">
          <div className="bg-[#FAF8F2] border-t sm:border border-[#D5CDBC] rounded-t-2xl sm:rounded-2xl w-full max-w-lg p-4 sm:p-6 shadow-2xl max-h-[92vh] overflow-y-auto my-0 sm:my-8 flex flex-col">
            <div className="w-12 h-1.5 bg-[#D1C9B6] rounded-full mx-auto mb-2 sm:hidden shrink-0"></div>
            <div className="flex items-center justify-between pb-3 border-b border-[#E8E1CE] shrink-0">
              <h3 className="text-base sm:text-lg font-bold text-[#1E2620] flex items-center gap-1.5">
                <Scale className="w-4 h-4 text-[#C28B38]" />
                <span>Log Broiler Flock: Weight, Feed &amp; Vaccines</span>
              </h3>
              <button
                type="button"
                onClick={() => setIsBroilerLogModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 font-bold p-1 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveBroilerLog} className="space-y-3.5 pt-4 text-xs">
              {/* Average Weight with Unit (g / kg) */}
              <div className="bg-[#FAF4E8] p-3 rounded-xl border border-[#E8DEC7] space-y-2">
                <label className="block text-[11px] font-bold text-[#4B5143] uppercase tracking-wider">
                  Average Bird Weight *
                </label>
                <div className="grid grid-cols-2 gap-3 items-center">
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    required
                    placeholder={broilerWeightUnit === 'g' ? 'e.g. 1850' : 'e.g. 1.85'}
                    value={broilerWeight}
                    onChange={(e) => setBroilerWeight(parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-2 border border-[#D5CDBC] rounded-lg bg-white font-mono-numbers text-base font-bold text-[#1E241F]"
                  />
                  <div className="grid grid-cols-2 gap-1 p-1 bg-[#EAE3D3] rounded-lg">
                    <button
                      type="button"
                      onClick={() => setBroilerWeightUnit('g')}
                      className={`py-1.5 text-xs font-bold rounded cursor-pointer transition-colors ${
                        broilerWeightUnit === 'g'
                          ? 'bg-[#2E3C31] text-white shadow-xs'
                          : 'text-[#4E4B3E] hover:bg-white/50'
                      }`}
                    >
                      Grams (g)
                    </button>
                    <button
                      type="button"
                      onClick={() => setBroilerWeightUnit('kg')}
                      className={`py-1.5 text-xs font-bold rounded cursor-pointer transition-colors ${
                        broilerWeightUnit === 'kg'
                          ? 'bg-[#2E3C31] text-white shadow-xs'
                          : 'text-[#4E4B3E] hover:bg-white/50'
                      }`}
                    >
                      Kilograms (kg)
                    </button>
                  </div>
                </div>
              </div>

              {/* Feed Intake */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-[#4B5143] uppercase tracking-wider mb-1">
                    Feed Quantity (Kg) *
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.5"
                    required
                    placeholder="e.g. 45"
                    value={broilerFeedKg}
                    onChange={(e) => setBroilerFeedKg(parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-2 border border-[#D5CDBC] rounded-lg bg-white font-semibold font-mono-numbers text-sm"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-[#4B5143] uppercase tracking-wider mb-1">
                    Feed Type *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Broiler Grower Pellets, Starter, Finisher"
                    value={broilerFeedType}
                    onChange={(e) => setBroilerFeedType(e.target.value)}
                    className="w-full px-3 py-2 border border-[#D5CDBC] rounded-lg bg-white font-semibold text-xs"
                  />
                </div>
              </div>

              {/* Vaccines Administered */}
              <div className="grid grid-cols-2 gap-3 bg-[#F2F7F2] p-3 rounded-xl border border-[#D1E3D3]">
                <div>
                  <label className="block text-[11px] font-bold text-[#294B32] uppercase tracking-wider mb-1">
                    Vaccine Administered (If Any)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Newcastle ND+IB, Gumboro IBD"
                    value={broilerVaccine}
                    onChange={(e) => setBroilerVaccine(e.target.value)}
                    className="w-full px-3 py-2 border border-[#B9D5BC] rounded-lg bg-white text-xs"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-[#294B32] uppercase tracking-wider mb-1">
                    Dose &amp; Application Route
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Spray / Water additive"
                    value={broilerVaccineDose}
                    onChange={(e) => setBroilerVaccineDose(e.target.value)}
                    className="w-full px-3 py-2 border border-[#B9D5BC] rounded-lg bg-white text-xs"
                  />
                </div>
              </div>

              {/* Birds Sold / Harvested */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-[#4B5143] uppercase tracking-wider mb-1">
                    Birds Harvested / Sold
                  </label>
                  <input
                    type="number"
                    min="0"
                    placeholder="0"
                    value={broilerSold}
                    onChange={(e) => setBroilerSold(parseInt(e.target.value) || 0)}
                    className="w-full px-3 py-2 border border-[#D5CDBC] rounded-lg bg-white font-mono-numbers text-sm"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-[#4B5143] uppercase tracking-wider mb-1">
                    Mortality (Dead Birds)
                  </label>
                  <input
                    type="number"
                    min="0"
                    placeholder="0"
                    value={broilerMortality}
                    onChange={(e) => setBroilerMortality(parseInt(e.target.value) || 0)}
                    className="w-full px-3 py-2 border border-[#D5CDBC] rounded-lg bg-white font-mono-numbers text-sm"
                  />
                </div>
              </div>

              {broilerMortality > 0 && (
                <div className="p-3 bg-[#FFF2F0] border border-[#FAD0CB] rounded-xl space-y-2">
                  <div className="flex items-center gap-1.5 text-[#C84B31] font-bold text-xs">
                    <AlertTriangle className="w-4 h-4" />
                    <span>Broiler Mortality Alert: Cause &amp; Effect Required</span>
                  </div>
                  <div>
                    <input
                      type="text"
                      required
                      placeholder="Cause of Death (e.g. Ascites, Sudden Death Syndrome, Heat stress)"
                      value={broilerDeathCause}
                      onChange={(e) => setBroilerDeathCause(e.target.value)}
                      className="w-full px-3 py-1.5 border border-[#F4BBB3] rounded-lg bg-white text-xs font-semibold"
                    />
                  </div>
                  <div>
                    <textarea
                      required
                      rows={2}
                      placeholder="Clinical Effect observed &amp; Action Taken (ventilator speed increased, vitamins added to water)..."
                      value={broilerDeathEffect}
                      onChange={(e) => setBroilerDeathEffect(e.target.value)}
                      className="w-full px-3 py-1.5 border border-[#F4BBB3] rounded-lg bg-white text-xs"
                    />
                  </div>
                </div>
              )}

              {/* Notes */}
              <div>
                <label className="block text-[11px] font-bold text-[#4B5143] uppercase tracking-wider mb-1">
                  General Broiler Notes
                </label>
                <input
                  type="text"
                  placeholder="e.g. Day 28 target weight reached, batch healthy"
                  value={broilerNotes}
                  onChange={(e) => setBroilerNotes(e.target.value)}
                  className="w-full px-3 py-2 border border-[#D5CDBC] rounded-lg bg-white text-xs"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#E8E1CE]">
                <button
                  type="button"
                  onClick={() => setIsBroilerLogModalOpen(false)}
                  className="px-4 py-2.5 rounded-lg border border-[#D5CDBC] font-semibold text-xs min-h-[42px]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-lg bg-[#2E3C31] text-white font-bold text-xs min-h-[42px]"
                >
                  Save Broiler Log
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= MODAL: FLOCK HEALTH ================= */}
      {isFlockStatusModalOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:p-4 bg-black/50 backdrop-blur-xs overflow-y-auto">
          <div className="bg-[#FAF8F2] border-t sm:border border-[#D5CDBC] rounded-t-2xl sm:rounded-2xl w-full max-w-md p-4 sm:p-6 shadow-2xl max-h-[92vh] overflow-y-auto my-0 sm:my-8 flex flex-col">
            <div className="w-12 h-1.5 bg-[#D1C9B6] rounded-full mx-auto mb-2 sm:hidden shrink-0"></div>
            <div className="flex items-center justify-between pb-3 border-b border-[#E8E1CE] shrink-0">
              <h3 className="text-base font-bold text-[#1E2620]">Poultry Biosecurity &amp; Health</h3>
              <button
                type="button"
                onClick={() => setIsFlockStatusModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 font-bold p-1 cursor-pointer"
              >
                ✕
              </button>
            </div>
            <form onSubmit={handleSaveFlockStatus} className="space-y-3.5 pt-4 text-xs">
              <div>
                <label className="block text-[11px] font-bold text-[#4B5143] uppercase tracking-wider mb-1">
                  Primary Flock Breed
                </label>
                <input
                  type="text"
                  placeholder="e.g. Lohmann Brown (Layers) / Cobb 500 (Broilers)"
                  value={flockBreed}
                  onChange={(e) => setFlockBreed(e.target.value)}
                  className="w-full px-3 py-2 border border-[#D5CDBC] rounded-lg bg-white"
                />
              </div>

              <div className="flex items-center gap-2 p-3 bg-white border border-[#D5CDBC] rounded-lg">
                <input
                  type="checkbox"
                  id="flockSick"
                  checked={flockSick}
                  onChange={(e) => setFlockSick(e.target.checked)}
                  className="w-4 h-4 text-[#C84B31] rounded"
                />
                <label htmlFor="flockSick" className="font-bold text-[#A62F1E] cursor-pointer">
                  Flag active sickness in pens / alert biosecurity team
                </label>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-[#4B5143] uppercase tracking-wider mb-1">
                  Health Observations &amp; Clinical Symptoms
                </label>
                <textarea
                  rows={3}
                  placeholder="Document signs of respiratory distress, drop in feed intake, or abnormal droppings..."
                  value={flockSickNotes}
                  onChange={(e) => setFlockSickNotes(e.target.value)}
                  className="w-full px-3 py-2 border border-[#D5CDBC] rounded-lg bg-white"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-[#E8E1CE]">
                <button
                  type="button"
                  onClick={() => setIsFlockStatusModalOpen(false)}
                  className="px-4 py-2.5 rounded-lg border border-[#D5CDBC] font-semibold text-xs min-h-[42px]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-lg bg-[#2E3C31] text-white font-bold text-xs min-h-[42px]"
                >
                  Update Flock Status
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
