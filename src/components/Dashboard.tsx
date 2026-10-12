import React, { useState, useMemo } from 'react';
import { 
  Users, 
  Layers, 
  Baby, 
  Activity, 
  Filter, 
  Calendar, 
  CheckCircle, 
  AlertCircle,
  HelpCircle,
  TrendingUp,
  Droplets,
  Syringe
} from 'lucide-react';
import { Cow, Employee, GenericAnimal, ChickenLog, Chemical, FarmMedication } from '../types/farm';
import { calculateAge, getDippingStatus, getCurrentSeason } from '../utils/dateAndAge';

interface DashboardProps {
  cows: Cow[];
  employees: Employee[];
  sheep: GenericAnimal[];
  goats: GenericAnimal[];
  pigs: GenericAnimal[];
  chickenLogs: ChickenLog[];
  chemicals: Chemical[];
  medications: FarmMedication[];
  onNavigate: (view: string, subTab?: string) => void;
  onOpenAddCow: () => void;
  onOpenAttendance: () => void;
}

export type HerdFilter = 'all' | 'breeding_females' | 'males' | 'young_stock' | 'mature' | 'brahman' | 'simmental';

export const Dashboard: React.FC<DashboardProps> = ({
  cows,
  employees,
  sheep,
  goats,
  pigs,
  chickenLogs,
  medications,
  onNavigate,
  onOpenAddCow,
  onOpenAttendance
}) => {
  const [selectedHerdFilter, setSelectedHerdFilter] = useState<HerdFilter>('all');

  const activeCows = useMemo(() => cows.filter((c) => c.status === 'Active'), [cows]);

  // Overall animal totals
  const chickenTotal = useMemo(() => {
    return chickenLogs.reduce((acc, log) => acc + (log.hatchlings - log.sold), 0) + 120; // baseline flock + net logs
  }, [chickenLogs]);

  const totalLivestock = activeCows.length + sheep.length + goats.length + pigs.length + chickenTotal;

  // Filter cattle by selected herd group
  const filteredCows = useMemo(() => {
    return activeCows.filter((cow) => {
      const ageInfo = calculateAge(cow.birthdate);
      switch (selectedHerdFilter) {
        case 'breeding_females':
          return cow.sex === 'F';
        case 'males':
          return cow.sex === 'M';
        case 'young_stock':
          return ageInfo.isYoungStock; // < 2 years
        case 'mature':
          return !ageInfo.isYoungStock; // >= 2 years
        case 'brahman':
          return cow.breed.toLowerCase().includes('brahman');
        case 'simmental':
          return cow.breed.toLowerCase().includes('simmental');
        case 'all':
        default:
          return true;
      }
    });
  }, [activeCows, selectedHerdFilter]);

  // Cattle analytics based on filtered subset
  const cattleStats = useMemo(() => {
    const total = filteredCows.length;
    const males = filteredCows.filter((c) => c.sex === 'M').length;
    const females = filteredCows.filter((c) => c.sex === 'F').length;

    let youngStock = 0;
    let matureCows = 0;
    let totalMonthsSum = 0;

    filteredCows.forEach((c) => {
      const ageInfo = calculateAge(c.birthdate);
      if (ageInfo.isYoungStock) {
        youngStock++;
      } else {
        matureCows++;
      }
      totalMonthsSum += ageInfo.totalMonths;
    });

    const maleRatio = total > 0 ? Math.round((males / total) * 100) : 0;
    const femaleRatio = total > 0 ? Math.round((females / total) * 100) : 0;
    const youngRatio = total > 0 ? Math.round((youngStock / total) * 100) : 0;
    const matureRatio = total > 0 ? Math.round((matureCows / total) * 100) : 0;

    const avgAgeYears = total > 0 ? (totalMonthsSum / total / 12).toFixed(1) : '0';

    // Annual dipping compliance
    const dippedUpToDate = filteredCows.filter((c) => getDippingStatus(c.lastDippingDate).status === 'Up to Date').length;
    const dipComplianceRate = total > 0 ? Math.round((dippedUpToDate / total) * 100) : 0;

    // Seasonal vaccine compliance for current season
    const currentSeason = getCurrentSeason();
    const currentSeasonMed = medications.find(
      (m) => m.category === 'Vaccine' && m.targetSeason.toLowerCase() === currentSeason.toLowerCase()
    );
    let vaccineComplianceRate = 100;
    if (currentSeasonMed) {
      const vaccinatedCount = filteredCows.filter((c) =>
        c.vaccinations.some((v) => v.medicationId === currentSeasonMed.id)
      ).length;
      vaccineComplianceRate = total > 0 ? Math.round((vaccinatedCount / total) * 100) : 0;
    }

    return {
      total,
      males,
      females,
      maleRatio,
      femaleRatio,
      youngStock,
      matureCows,
      youngRatio,
      matureRatio,
      avgAgeYears,
      dipComplianceRate,
      vaccineComplianceRate
    };
  }, [filteredCows, medications]);

  // Staff today attendance summary
  const staffSummary = useMemo(() => {
    const today = new Date().toISOString().slice(0, 10);
    let present = 0;
    let absent = 0;
    let unrecorded = 0;

    employees.forEach((emp) => {
      const rec = emp.attendance.find((a) => a.date === today);
      if (!rec) unrecorded++;
      else if (rec.status === 'Present') present++;
      else if (rec.status === 'Absent' || rec.status === 'Day Off') absent++;
    });

    return { present, absent, unrecorded, total: employees.length };
  }, [employees]);

  return (
    <div className="space-y-5 sm:space-y-6">
      {/* Overview Totals Strip */}
      <div>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 sm:gap-3 mb-3">
          <div>
            <h2 className="text-base sm:text-xl font-bold tracking-tight text-[#1F2721]">Farm Inventory Summaries</h2>
            <p className="text-[11px] sm:text-xs text-[#5E6458]">Total livestock counted across pasture units and breeding barns.</p>
          </div>
          <div className="grid grid-cols-2 sm:flex sm:items-center gap-2 w-full sm:w-auto">
            <button
              onClick={onOpenAddCow}
              className="px-3 py-2 text-xs font-bold rounded-lg bg-[#C28B38] text-[#1B1405] hover:bg-[#A9752A] transition-colors cursor-pointer shadow-xs text-center justify-center min-h-[40px] flex items-center"
            >
              + Register Cow
            </button>
            <button
              onClick={onOpenAttendance}
              className="px-3 py-2 text-xs font-bold rounded-lg bg-[#2E3C31] text-[#EBE6D8] hover:bg-[#3C4E40] transition-colors cursor-pointer shadow-xs text-center justify-center min-h-[40px] flex items-center"
            >
              Mark Register
            </button>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 sm:gap-3">
          {/* Total Animals Card */}
          <div className="bg-white border border-[#D5CDBC] rounded-xl p-2.5 sm:p-3.5 shadow-2xs">
            <span className="text-[10px] sm:text-[11px] font-semibold text-[#666B5E] uppercase tracking-wider block truncate">Total Animals</span>
            <div className="flex items-baseline justify-between mt-1 sm:mt-1.5">
              <span className="text-lg sm:text-2xl font-bold font-mono-numbers text-[#1A231C]">{totalLivestock}</span>
              <span className="text-[10px] sm:text-[11px] font-medium text-[#2E3C31] shrink-0">All Units</span>
            </div>
          </div>

          {/* Cattle Card */}
          <div 
            onClick={() => onNavigate('animals', 'cattle')}
            className="bg-[#F8F5EC] border border-[#D5CDBC] rounded-xl p-2.5 sm:p-3.5 shadow-2xs hover:border-[#8E9B82] cursor-pointer transition-colors active:scale-[0.98]"
          >
            <span className="text-[10px] sm:text-[11px] font-semibold text-[#666B5E] uppercase tracking-wider block truncate">🐄 Cattle</span>
            <div className="flex items-baseline justify-between mt-1 sm:mt-1.5">
              <span className="text-lg sm:text-2xl font-bold font-mono-numbers text-[#2E3C31]">{activeCows.length}</span>
              <span className="text-[10px] sm:text-[11px] text-[#7A725D] shrink-0">Pedigreed</span>
            </div>
          </div>

          {/* Sheep Card */}
          <div 
            onClick={() => onNavigate('animals', 'sheep')}
            className="bg-white border border-[#D5CDBC] rounded-xl p-2.5 sm:p-3.5 shadow-2xs hover:border-[#8E9B82] cursor-pointer transition-colors active:scale-[0.98]"
          >
            <span className="text-[10px] sm:text-[11px] font-semibold text-[#666B5E] uppercase tracking-wider block truncate">🐑 Sheep</span>
            <div className="flex items-baseline justify-between mt-1 sm:mt-1.5">
              <span className="text-lg sm:text-2xl font-bold font-mono-numbers text-[#1A231C]">{sheep.length}</span>
              <span className="text-[10px] sm:text-[11px] text-[#7A725D] shrink-0">Dorper</span>
            </div>
          </div>

          {/* Goats Card */}
          <div 
            onClick={() => onNavigate('animals', 'goats')}
            className="bg-white border border-[#D5CDBC] rounded-xl p-2.5 sm:p-3.5 shadow-2xs hover:border-[#8E9B82] cursor-pointer transition-colors active:scale-[0.98]"
          >
            <span className="text-[10px] sm:text-[11px] font-semibold text-[#666B5E] uppercase tracking-wider block truncate">🐐 Goats</span>
            <div className="flex items-baseline justify-between mt-1 sm:mt-1.5">
              <span className="text-lg sm:text-2xl font-bold font-mono-numbers text-[#1A231C]">{goats.length}</span>
              <span className="text-[10px] sm:text-[11px] text-[#7A725D] shrink-0">Boer</span>
            </div>
          </div>

          {/* Pigs Card */}
          <div 
            onClick={() => onNavigate('animals', 'pigs')}
            className="bg-white border border-[#D5CDBC] rounded-xl p-2.5 sm:p-3.5 shadow-2xs hover:border-[#8E9B82] cursor-pointer transition-colors active:scale-[0.98]"
          >
            <span className="text-[10px] sm:text-[11px] font-semibold text-[#666B5E] uppercase tracking-wider block truncate">🐖 Pigs</span>
            <div className="flex items-baseline justify-between mt-1 sm:mt-1.5">
              <span className="text-lg sm:text-2xl font-bold font-mono-numbers text-[#1A231C]">{pigs.length}</span>
              <span className="text-[10px] sm:text-[11px] text-[#7A725D] shrink-0">Breeding</span>
            </div>
          </div>

          {/* Chickens Card */}
          <div 
            onClick={() => onNavigate('animals', 'chickens')}
            className="bg-white border border-[#D5CDBC] rounded-xl p-2.5 sm:p-3.5 shadow-2xs hover:border-[#8E9B82] cursor-pointer transition-colors active:scale-[0.98]"
          >
            <span className="text-[10px] sm:text-[11px] font-semibold text-[#666B5E] uppercase tracking-wider block truncate">🐔 Poultry</span>
            <div className="flex items-baseline justify-between mt-1 sm:mt-1.5">
              <span className="text-lg sm:text-2xl font-bold font-mono-numbers text-[#1A231C]">{chickenTotal}</span>
              <span className="text-[10px] sm:text-[11px] text-[#7A725D] shrink-0">Flock</span>
            </div>
          </div>
        </div>
      </div>

      {/* Interactive Herd Group Filtering & Cattle Ratio Charts */}
      <div className="bg-white border border-[#D5CDBC] rounded-xl p-3.5 sm:p-5 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-3 sm:pb-4 border-b border-[#E6E0D2]">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm sm:text-base font-bold text-[#1F2721]">Cattle Demographics &amp; Ratio Analysis</h3>
              <span className="text-[10px] sm:text-xs px-2 py-0.5 rounded bg-[#EAE3D2] text-[#4F4B3C] font-semibold">
                Interactive Filter
              </span>
            </div>
            <p className="text-[11px] sm:text-xs text-[#5E6458] mt-0.5">
              Compare sex ratios (Male vs Female) and age maturity ratios (Young Stock &lt;2y vs Mature Cows &ge;2y).
            </p>
          </div>

          {/* Herd Group Filter Buttons - Thumb Scrollable Strip */}
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar touch-pan-x pb-1 pt-0.5 -mx-1 px-1 flex-nowrap">
            <span className="text-xs font-semibold text-[#6B7163] flex items-center gap-1 mr-1 shrink-0">
              <Filter className="w-3.5 h-3.5" /> Group:
            </span>
            <button
              onClick={() => setSelectedHerdFilter('all')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg whitespace-nowrap transition-colors cursor-pointer shrink-0 min-h-[36px] ${
                selectedHerdFilter === 'all'
                  ? 'bg-[#2E3C31] text-white shadow-xs'
                  : 'bg-[#F2ECE0] text-[#474338] hover:bg-[#E6DEC8]'
              }`}
            >
              All Herd ({activeCows.length})
            </button>
            <button
              onClick={() => setSelectedHerdFilter('breeding_females')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg whitespace-nowrap transition-colors cursor-pointer shrink-0 min-h-[36px] ${
                selectedHerdFilter === 'breeding_females'
                  ? 'bg-[#2E3C31] text-white shadow-xs'
                  : 'bg-[#F2ECE0] text-[#474338] hover:bg-[#E6DEC8]'
              }`}
            >
              Females ({activeCows.filter((c) => c.sex === 'F').length})
            </button>
            <button
              onClick={() => setSelectedHerdFilter('males')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg whitespace-nowrap transition-colors cursor-pointer shrink-0 min-h-[36px] ${
                selectedHerdFilter === 'males'
                  ? 'bg-[#2E3C31] text-white shadow-xs'
                  : 'bg-[#F2ECE0] text-[#474338] hover:bg-[#E6DEC8]'
              }`}
            >
              Males ({activeCows.filter((c) => c.sex === 'M').length})
            </button>
            <button
              onClick={() => setSelectedHerdFilter('young_stock')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg whitespace-nowrap transition-colors cursor-pointer shrink-0 min-h-[36px] ${
                selectedHerdFilter === 'young_stock'
                  ? 'bg-[#2E3C31] text-white shadow-xs'
                  : 'bg-[#F2ECE0] text-[#474338] hover:bg-[#E6DEC8]'
              }`}
            >
              Young Stock &lt;2y ({activeCows.filter((c) => calculateAge(c.birthdate).isYoungStock).length})
            </button>
            <button
              onClick={() => setSelectedHerdFilter('mature')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg whitespace-nowrap transition-colors cursor-pointer shrink-0 min-h-[36px] ${
                selectedHerdFilter === 'mature'
                  ? 'bg-[#2E3C31] text-white shadow-xs'
                  : 'bg-[#F2ECE0] text-[#474338] hover:bg-[#E6DEC8]'
              }`}
            >
              Mature &ge;2y ({activeCows.filter((c) => !calculateAge(c.birthdate).isYoungStock).length})
            </button>
          </div>
        </div>

        {/* Charts Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 pt-4 sm:pt-5">
          {/* Chart 1: Male vs Female Ratio */}
          <div className="bg-[#FAF8F3] border border-[#E3DCB8] rounded-xl p-3.5 sm:p-4.5">
            <div className="flex items-center justify-between mb-3 gap-2">
              <div className="min-w-0">
                <h4 className="text-xs sm:text-sm font-bold text-[#1F2721] flex items-center gap-1.5 truncate">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#B8772E] shrink-0"></span>
                  Sex Ratio: Male vs Female
                </h4>
                <p className="text-[11px] sm:text-xs text-[#63685C]">
                  Filtered sample: {cattleStats.total} cattle
                </p>
              </div>
              <span className="text-[11px] sm:text-xs font-mono-numbers px-2 py-0.5 rounded bg-[#EDE7D6] text-[#484435] font-semibold shrink-0">
                {cattleStats.maleRatio}% M : {cattleStats.femaleRatio}% F
              </span>
            </div>

            {/* Visual Ratio Bar */}
            <div className="space-y-3">
              <div className="h-6 w-full bg-[#E5DFC9] rounded-md overflow-hidden flex shadow-inner">
                <div
                  style={{ width: `${cattleStats.femaleRatio}%` }}
                  className="bg-[#2E4534] h-full flex items-center justify-center text-white text-[10px] sm:text-[11px] font-bold transition-all duration-500 overflow-hidden"
                  title={`Female: ${cattleStats.females} (${cattleStats.femaleRatio}%)`}
                >
                  {cattleStats.femaleRatio > 20 ? `${cattleStats.femaleRatio}% Female` : ''}
                </div>
                <div
                  style={{ width: `${cattleStats.maleRatio}%` }}
                  className="bg-[#B8772E] h-full flex items-center justify-center text-white text-[10px] sm:text-[11px] font-bold transition-all duration-500 overflow-hidden"
                  title={`Male: ${cattleStats.males} (${cattleStats.maleRatio}%)`}
                >
                  {cattleStats.maleRatio > 20 ? `${cattleStats.maleRatio}% Male` : ''}
                </div>
              </div>

              {/* Data Breakdown Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 sm:gap-3 pt-1">
                <div className="bg-white border border-[#E4DEC9] rounded-lg p-2.5 sm:p-3">
                  <div className="flex items-center justify-between text-xs text-[#52564C] mb-1">
                    <span className="font-semibold flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-[#2E4534]"></span> Females (Cows/Heifers)
                    </span>
                    <span className="font-mono-numbers font-bold text-sm text-[#2E4534]">{cattleStats.females}</span>
                  </div>
                  <div className="text-[11px] text-[#737869]">
                    {cattleStats.femaleRatio}% of selected herd · Breeding foundation
                  </div>
                </div>

                <div className="bg-white border border-[#E4DEC9] rounded-lg p-2.5 sm:p-3">
                  <div className="flex items-center justify-between text-xs text-[#52564C] mb-1">
                    <span className="font-semibold flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-[#B8772E]"></span> Males (Bulls/Steers)
                    </span>
                    <span className="font-mono-numbers font-bold text-sm text-[#B8772E]">{cattleStats.males}</span>
                  </div>
                  <div className="text-[11px] text-[#737869]">
                    {cattleStats.maleRatio}% of selected herd · Sires &amp; feeder steers
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Chart 2: Young Stock vs Mature Cows */}
          <div className="bg-[#FAF8F3] border border-[#E3DCB8] rounded-xl p-3.5 sm:p-4.5">
            <div className="flex items-center justify-between mb-3 gap-2">
              <div className="min-w-0">
                <h4 className="text-xs sm:text-sm font-bold text-[#1F2721] flex items-center gap-1.5 truncate">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#4A7C59] shrink-0"></span>
                  Age: Young vs Mature
                </h4>
                <p className="text-[11px] sm:text-xs text-[#63685C]">
                  Young: &lt;24mo · Mature: &ge;24mo
                </p>
              </div>
              <span className="text-[11px] sm:text-xs font-mono-numbers px-2 py-0.5 rounded bg-[#EDE7D6] text-[#484435] font-semibold shrink-0">
                Avg: {cattleStats.avgAgeYears} yrs
              </span>
            </div>

            {/* Visual Ratio Bar */}
            <div className="space-y-3">
              <div className="h-6 w-full bg-[#E5DFC9] rounded-md overflow-hidden flex shadow-inner">
                <div
                  style={{ width: `${cattleStats.youngRatio}%` }}
                  className="bg-[#4A7C59] h-full flex items-center justify-center text-white text-[10px] sm:text-[11px] font-bold transition-all duration-500 overflow-hidden"
                  title={`Young Stock: ${cattleStats.youngStock} (${cattleStats.youngRatio}%)`}
                >
                  {cattleStats.youngRatio > 20 ? `${cattleStats.youngRatio}% Young` : ''}
                </div>
                <div
                  style={{ width: `${cattleStats.matureRatio}%` }}
                  className="bg-[#2B3A2E] h-full flex items-center justify-center text-white text-[10px] sm:text-[11px] font-bold transition-all duration-500 overflow-hidden"
                  title={`Mature Cows: ${cattleStats.matureCows} (${cattleStats.matureRatio}%)`}
                >
                  {cattleStats.matureRatio > 20 ? `${cattleStats.matureRatio}% Mature` : ''}
                </div>
              </div>

              {/* Data Breakdown Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 sm:gap-3 pt-1">
                <div className="bg-white border border-[#E4DEC9] rounded-lg p-2.5 sm:p-3">
                  <div className="flex items-center justify-between text-xs text-[#52564C] mb-1">
                    <span className="font-semibold flex items-center gap-1.5">
                      <Baby className="w-3.5 h-3.5 text-[#4A7C59]" /> Young Stock (&lt;2y)
                    </span>
                    <span className="font-mono-numbers font-bold text-sm text-[#4A7C59]">{cattleStats.youngStock}</span>
                  </div>
                  <div className="text-[11px] text-[#737869]">
                    Calves &amp; replacement heifers · {cattleStats.youngRatio}% of filter
                  </div>
                </div>

                <div className="bg-white border border-[#E4DEC9] rounded-lg p-2.5 sm:p-3">
                  <div className="flex items-center justify-between text-xs text-[#52564C] mb-1">
                    <span className="font-semibold flex items-center gap-1.5">
                      <Layers className="w-3.5 h-3.5 text-[#2B3A2E]" /> Mature Stock (&ge;2y)
                    </span>
                    <span className="font-mono-numbers font-bold text-sm text-[#2B3A2E]">{cattleStats.matureCows}</span>
                  </div>
                  <div className="text-[11px] text-[#737869]">
                    Breeding cows &amp; working bulls · {cattleStats.matureRatio}% of filter
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Selected Subset Health & Care Indicators */}
        <div className="mt-4 pt-4 border-t border-[#EAE3D2] grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="flex items-center gap-3 p-2.5 bg-[#F5F2E9] rounded-lg">
            <div className="w-8 h-8 rounded-full bg-[#37453A] text-white flex items-center justify-center shrink-0">
              <Droplets className="w-4 h-4 text-[#A8D5BA]" />
            </div>
            <div>
              <span className="text-[11px] text-[#63685C] uppercase tracking-wider block font-semibold">Annual Dipping Compliance</span>
              <span className="text-sm font-bold font-mono-numbers text-[#1F2721]">{cattleStats.dipComplianceRate}% compliant</span>
            </div>
          </div>

          <div className="flex items-center gap-3 p-2.5 bg-[#F5F2E9] rounded-lg">
            <div className="w-8 h-8 rounded-full bg-[#C28B38] text-white flex items-center justify-center shrink-0">
              <Syringe className="w-4 h-4" />
            </div>
            <div>
              <span className="text-[11px] text-[#63685C] uppercase tracking-wider block font-semibold">Current Season Vaccination</span>
              <span className="text-sm font-bold font-mono-numbers text-[#1F2721]">{cattleStats.vaccineComplianceRate}% up to date</span>
            </div>
          </div>

          <div className="flex items-center gap-3 p-2.5 bg-[#F5F2E9] rounded-lg">
            <div className="w-8 h-8 rounded-full bg-[#465749] text-white flex items-center justify-center shrink-0">
              <Users className="w-4 h-4 text-[#D8E6DA]" />
            </div>
            <div>
              <span className="text-[11px] text-[#63685C] uppercase tracking-wider block font-semibold">Staff Today On Duty</span>
              <span className="text-sm font-bold font-mono-numbers text-[#1F2721]">
                {staffSummary.present}/{staffSummary.total} Present ({staffSummary.absent} with reasons)
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
