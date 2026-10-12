import React, { useState } from 'react';
import { 
  AlertTriangle, 
  Cake, 
  CalendarOff, 
  Syringe, 
  ShieldAlert, 
  ChevronDown, 
  ChevronUp, 
  CheckCircle2,
  Clock,
  ExternalLink
} from 'lucide-react';
import { Employee, Cow, FarmMedication, Chemical, ChickenStatus, HeadcountRecord } from '../types/farm';
import { checkBirthdayNotice, todayISO, getDippingStatus, getCurrentSeason } from '../utils/dateAndAge';

interface TopAlertsProps {
  employees: Employee[];
  cows: Cow[];
  medications: FarmMedication[];
  chemicals: Chemical[];
  chickenStatus: ChickenStatus;
  headcounts?: Record<string, HeadcountRecord[]>;
  maleThreshold: number;
  onNavigate: (view: string, subTab?: string) => void;
}

export interface AlertItem {
  id: string;
  category: 'birthday' | 'absence' | 'vaccination' | 'dipping' | 'herd' | 'chemical' | 'health';
  severity: 'info' | 'warning' | 'critical';
  title: string;
  message: string;
  actionLabel?: string;
  actionTarget?: { view: string; subTab?: string };
}

export const TopAlerts: React.FC<TopAlertsProps> = ({
  employees,
  cows,
  medications,
  chemicals,
  chickenStatus,
  headcounts,
  maleThreshold,
  onNavigate
}) => {
  const [isExpanded, setIsExpanded] = useState(true);
  const [activeFilter, setActiveFilter] = useState<'all' | 'birthdays' | 'staff' | 'livestock' | 'chemicals'>('all');

  const alerts: AlertItem[] = [];
  const today = todayISO();
  const currentSeason = getCurrentSeason();

  // 1. Staff Birthday Notices
  employees.forEach((emp) => {
    const bday = checkBirthdayNotice(emp.birthdate, 14);
    if (bday) {
      if (bday.isToday) {
        alerts.push({
          id: `bday-${emp.id}`,
          category: 'birthday',
          severity: 'info',
          title: `Staff Birthday Today!`,
          message: `${emp.name} (${emp.idNumber}) turns ${bday.turningAge} today (${bday.dateStr})! Wish them a happy birthday.`,
          actionLabel: 'View Staff',
          actionTarget: { view: 'staff' }
        });
      } else if (bday.isUpcoming) {
        alerts.push({
          id: `bday-${emp.id}`,
          category: 'birthday',
          severity: 'info',
          title: `Upcoming Staff Birthday`,
          message: `${emp.name} turns ${bday.turningAge} in ${bday.daysUntil} day${bday.daysUntil === 1 ? '' : 's'} (${bday.dateStr}).`,
          actionLabel: 'View Staff',
          actionTarget: { view: 'staff' }
        });
      }
    }
  });

  // 2. Absence with Reason Notices
  employees.forEach((emp) => {
    const todayRecord = emp.attendance.find((r) => r.date === today);
    if (todayRecord && todayRecord.status === 'Absent') {
      alerts.push({
        id: `absent-${emp.id}`,
        category: 'absence',
        severity: 'warning',
        title: `Staff Absence Logged Today`,
        message: `${emp.name} is absent. Reason: "${todayRecord.absenceReason || 'No comment provided'}"`,
        actionLabel: 'Open Register',
        actionTarget: { view: 'staff' }
      });
    }
  });

  // 3. Cattle Annual Dipping Alerts
  const activeCows = cows.filter((c) => c.status === 'Active');
  const overdueDip = activeCows.filter((c) => getDippingStatus(c.lastDippingDate).status === 'Overdue');
  const dueSoonDip = activeCows.filter((c) => getDippingStatus(c.lastDippingDate).status === 'Due Soon');

  if (overdueDip.length > 0) {
    alerts.push({
      id: 'dip-overdue',
      category: 'dipping',
      severity: 'critical',
      title: `Annual Cattle Dipping Overdue`,
      message: `${overdueDip.length} cow${overdueDip.length === 1 ? '' : 's'} (${overdueDip.map((c) => c.tag).join(', ')}) exceeded the 1-year compulsory dipping threshold.`,
      actionLabel: 'Inspect Cattle',
      actionTarget: { view: 'animals', subTab: 'cattle' }
    });
  } else if (dueSoonDip.length > 0) {
    alerts.push({
      id: 'dip-duesoon',
      category: 'dipping',
      severity: 'warning',
      title: `Annual Cattle Dipping Due Soon`,
      message: `${dueSoonDip.length} cow${dueSoonDip.length === 1 ? '' : 's'} due for annual dipping within 30 days.`,
      actionLabel: 'Inspect Cattle',
      actionTarget: { view: 'animals', subTab: 'cattle' }
    });
  }

  // 4. Seasonal Vaccination Alerts (vaccination happens per season, only if new medication is added to system)
  // Check active vaccines for current season
  const seasonalVaccines = medications.filter(
    (m) => m.category === 'Vaccine' && m.targetSeason.toLowerCase() === currentSeason.toLowerCase()
  );

  seasonalVaccines.forEach((med) => {
    const unvaccinatedCows = activeCows.filter(
      (cow) => !cow.vaccinations.some((v) => v.medicationId === med.id)
    );
    if (unvaccinatedCows.length > 0) {
      alerts.push({
        id: `vax-needed-${med.id}`,
        category: 'vaccination',
        severity: 'warning',
        title: `Seasonal Vaccination Pending (${currentSeason})`,
        message: `${med.name} is registered for ${currentSeason} season: ${unvaccinatedCows.length} active cow${unvaccinatedCows.length === 1 ? '' : 's'} still pending vaccination.`,
        actionLabel: 'Vaccination Log',
        actionTarget: { view: 'animals', subTab: 'cattle' }
      });
    }
  });

  // 5. Male Ratio Threshold in Cattle Herd
  const maleCattle = activeCows.filter((c) => c.sex === 'M').length;
  if (maleCattle > maleThreshold) {
    alerts.push({
      id: 'male-threshold',
      category: 'herd',
      severity: 'warning',
      title: `High Male Cattle Ratio`,
      message: `${maleCattle} male cattle on record (Threshold limit: ${maleThreshold}). Review herd balance to prevent bull competition and grazing pressure.`,
      actionLabel: 'Herd Ratios',
      actionTarget: { view: 'dashboard' }
    });
  }

  // 6. Agro-Chemical Expirations
  chemicals.forEach((chem) => {
    if (!chem.expiration) return;
    const diffMs = new Date(chem.expiration + 'T00:00:00').getTime() - new Date(today + 'T00:00:00').getTime();
    const daysLeft = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    if (daysLeft < 0) {
      alerts.push({
        id: `chem-exp-${chem.id}`,
        category: 'chemical',
        severity: 'critical',
        title: `Agrochemical Expired`,
        message: `${chem.name} expired on ${chem.expiration}. Do not administer to livestock.`,
        actionLabel: 'Chemical Store',
        actionTarget: { view: 'chemicals' }
      });
    } else if (daysLeft <= 30) {
      alerts.push({
        id: `chem-soon-${chem.id}`,
        category: 'chemical',
        severity: 'warning',
        title: `Agrochemical Expiring Soon`,
        message: `${chem.name} expires in ${daysLeft} day${daysLeft === 1 ? '' : 's'}. Prepare alternative stock.`,
        actionLabel: 'Chemical Store',
        actionTarget: { view: 'chemicals' }
      });
    }
  });

  // 7. Chicken Flock Health
  if (chickenStatus.sick) {
    alerts.push({
      id: 'chicken-sick',
      category: 'health',
      severity: 'critical',
      title: `Poultry Flock Health Alert`,
      message: `Flock reported showing signs of illness: ${chickenStatus.notes || 'Quarantine and veterinary inspection advised.'}`,
      actionLabel: 'Flock Log',
      actionTarget: { view: 'animals', subTab: 'chickens' }
    });
  }

  // 7. Headcount Drop & Livestock Mortality Alerts (All Animals)
  if (headcounts) {
    Object.entries(headcounts).forEach(([speciesKey, records]) => {
      if (Array.isArray(records)) {
        records.forEach((rec) => {
          if (rec.missing > 0 && rec.deathCause) {
            const displaySpecies = 
              speciesKey === 'layers' ? 'Layer Hens' :
              speciesKey === 'broilers' ? 'Broilers' :
              speciesKey === 'sheep' ? 'Sheep' :
              speciesKey === 'goats' ? 'Goats' :
              speciesKey === 'pigs' ? 'Pigs' : 'Cattle';

            alerts.push({
              id: `mortality-${speciesKey}-${rec.id || rec.date}`,
              category: 'health',
              severity: 'critical',
              title: `⚠️ Mortality Notice: ${rec.missing} ${displaySpecies} Lost`,
              message: `Verified Drop (${rec.present}/${rec.total} present on ${rec.date}). Cause: "${rec.deathCause}". Clinical Effect & Action: "${rec.deathEffect || 'Biosecurity measures logged'}".`,
              actionLabel: `View ${displaySpecies}`,
              actionTarget: {
                view: speciesKey === 'cattle' ? 'cattle' : 'animals',
                subTab: speciesKey === 'layers' || speciesKey === 'broilers' ? 'chickens' : speciesKey
              }
            });
          }
        });
      }
    });
  }

  // Filter alerts
  const filteredAlerts = alerts.filter((a) => {
    if (activeFilter === 'birthdays') return a.category === 'birthday';
    if (activeFilter === 'staff') return a.category === 'absence' || a.category === 'birthday';
    if (activeFilter === 'livestock') return a.category === 'dipping' || a.category === 'vaccination' || a.category === 'herd' || a.category === 'health';
    if (activeFilter === 'chemicals') return a.category === 'chemical';
    return true;
  });

  if (alerts.length === 0) {
    return (
      <div className="bg-[#E4ECE3] border border-[#BACDBA] rounded-xl px-3.5 sm:px-5 py-3 mb-4 sm:mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-[#37453A] text-white flex items-center justify-center shrink-0">
            <CheckCircle2 className="w-5 h-5 text-[#8EDB9A]" />
          </div>
          <div>
            <p className="text-xs sm:text-sm font-semibold text-[#253528]">Top Notification Center: All Systems Clear</p>
            <p className="text-[11px] sm:text-xs text-[#4F6352]">No overdue annual dippings, missing vaccines, employee birthdays, or emergency notices today.</p>
          </div>
        </div>
        <span className="text-[11px] sm:text-xs font-mono text-[#4F6352] tabular-nums self-end sm:self-auto">Season: {currentSeason} · {today}</span>
      </div>
    );
  }

  return (
    <div className="bg-white border border-[#DCD5C4] rounded-xl shadow-xs overflow-hidden mb-4 sm:mb-6 transition-all">
      {/* Top Header Bar */}
      <div className="bg-[#2E3B30] text-[#F3EFE6] px-3.5 sm:px-5 py-2.5 sm:py-3 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
          <div className="flex items-center justify-center w-6 sm:w-7 h-6 sm:h-7 rounded-lg bg-[#E07A5F] text-white font-bold text-xs shrink-0">
            {alerts.length}
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5 sm:gap-2">
              <span className="text-xs sm:text-sm font-bold tracking-tight text-white truncate">Active Farm Alerts</span>
              <span className="text-[10px] sm:text-xs text-[#B9CBB9] hidden xs:inline">• Top Notices</span>
            </div>
            <p className="text-[10px] sm:text-xs text-[#B9CBB9] truncate">
              {alerts.filter((a) => a.severity === 'critical').length} critical ·{' '}
              {alerts.filter((a) => a.category === 'birthday').length} birthday ·{' '}
              {alerts.filter((a) => a.category === 'absence').length} absent
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="flex items-center gap-1 px-2.5 sm:px-3 py-1.5 rounded-md text-xs font-medium bg-[#3E4F41] hover:bg-[#4E6252] text-white transition-colors cursor-pointer min-h-[36px]"
          >
            <span>{isExpanded ? 'Hide' : 'View'}</span>
            {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {isExpanded && (
        <div className="p-3 sm:p-4 bg-[#FBF9F4]">
          {/* Filter segment */}
          <div className="flex items-center gap-1.5 mb-3 pb-2 border-b border-[#ECE5D4] overflow-x-auto no-scrollbar touch-pan-x flex-nowrap -mx-1 px-1">
            <span className="text-[11px] font-semibold text-[#666355] uppercase tracking-wider shrink-0 mr-1">Filter:</span>
            <button
              onClick={() => setActiveFilter('all')}
              className={`px-2.5 py-1 text-xs font-medium rounded-md whitespace-nowrap cursor-pointer transition-colors shrink-0 min-h-[32px] ${
                activeFilter === 'all'
                  ? 'bg-[#2E3B30] text-white'
                  : 'bg-white border border-[#D9D1BE] text-[#4E4B3E] hover:bg-[#F0ECE1]'
              }`}
            >
              All ({alerts.length})
            </button>
            <button
              onClick={() => setActiveFilter('birthdays')}
              className={`px-2.5 py-1 text-xs font-medium rounded-md whitespace-nowrap cursor-pointer transition-colors shrink-0 min-h-[32px] ${
                activeFilter === 'birthdays'
                  ? 'bg-[#2E3B30] text-white'
                  : 'bg-white border border-[#D9D1BE] text-[#4E4B3E] hover:bg-[#F0ECE1]'
              }`}
            >
              🎂 Birthdays ({alerts.filter((a) => a.category === 'birthday').length})
            </button>
            <button
              onClick={() => setActiveFilter('staff')}
              className={`px-2.5 py-1 text-xs font-medium rounded-md whitespace-nowrap cursor-pointer transition-colors shrink-0 min-h-[32px] ${
                activeFilter === 'staff'
                  ? 'bg-[#2E3B30] text-white'
                  : 'bg-white border border-[#D9D1BE] text-[#4E4B3E] hover:bg-[#F0ECE1]'
              }`}
            >
              🧑‍🌾 Staff ({alerts.filter((a) => a.category === 'absence' || a.category === 'birthday').length})
            </button>
            <button
              onClick={() => setActiveFilter('livestock')}
              className={`px-2.5 py-1 text-xs font-medium rounded-md whitespace-nowrap cursor-pointer transition-colors shrink-0 min-h-[32px] ${
                activeFilter === 'livestock'
                  ? 'bg-[#2E3B30] text-white'
                  : 'bg-white border border-[#D9D1BE] text-[#4E4B3E] hover:bg-[#F0ECE1]'
              }`}
            >
              🐄 Cattle Care ({alerts.filter((a) => a.category === 'dipping' || a.category === 'vaccination' || a.category === 'herd').length})
            </button>
            <button
              onClick={() => setActiveFilter('chemicals')}
              className={`px-2.5 py-1 text-xs font-medium rounded-md whitespace-nowrap cursor-pointer transition-colors shrink-0 min-h-[32px] ${
                activeFilter === 'chemicals'
                  ? 'bg-[#2E3B30] text-white'
                  : 'bg-white border border-[#D9D1BE] text-[#4E4B3E] hover:bg-[#F0ECE1]'
              }`}
            >
              🧪 Agrochemicals ({alerts.filter((a) => a.category === 'chemical').length})
            </button>
          </div>

          {/* Alert cards grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-[320px] overflow-y-auto pr-1">
            {filteredAlerts.map((alert) => {
              const isBirthday = alert.category === 'birthday';
              const isAbsence = alert.category === 'absence';
              const isCritical = alert.severity === 'critical';

              let borderColor = 'border-[#E3DCB8]';
              let bgColor = 'bg-white';
              let badgeColor = 'bg-[#EDE7D6] text-[#4F4B3C]';
              let Icon = AlertTriangle;

              if (isBirthday) {
                borderColor = 'border-[#E7CBA8]';
                bgColor = 'bg-[#FDF9F2]';
                badgeColor = 'bg-[#F2DEC2] text-[#844F18]';
                Icon = Cake;
              } else if (isCritical) {
                borderColor = 'border-[#F0B8AE]';
                bgColor = 'bg-[#FDF2F0]';
                badgeColor = 'bg-[#F9D4CD] text-[#A63A29]';
                Icon = ShieldAlert;
              } else if (isAbsence) {
                borderColor = 'border-[#EAD5BA]';
                bgColor = 'bg-[#FCF6EE]';
                badgeColor = 'bg-[#F5E2CB] text-[#915B17]';
                Icon = CalendarOff;
              } else if (alert.category === 'vaccination') {
                borderColor = 'border-[#CADBCE]';
                bgColor = 'bg-[#F4F9F5]';
                badgeColor = 'bg-[#D6E6DA] text-[#295F37]';
                Icon = Syringe;
              }

              return (
                <div
                  key={alert.id}
                  className={`border ${borderColor} ${bgColor} rounded-lg p-3.5 flex flex-col justify-between shadow-2xs hover:border-[#8E9B82] transition-colors`}
                >
                  <div className="flex items-start gap-2.5">
                    <div className={`p-2 rounded-md ${badgeColor} shrink-0 mt-0.5`}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-semibold text-xs tracking-tight text-[#1F2520]">
                          {alert.title}
                        </span>
                        <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold uppercase tracking-wider ${
                          isCritical ? 'bg-[#C84B31] text-white' : isBirthday ? 'bg-[#B8772E] text-white' : 'bg-[#556758] text-white'
                        }`}>
                          {alert.severity}
                        </span>
                      </div>
                      <p className="text-xs text-[#40433E] mt-1 leading-relaxed">
                        {alert.message}
                      </p>
                    </div>
                  </div>

                  {alert.actionLabel && alert.actionTarget && (
                    <div className="mt-2.5 pt-2 border-t border-black/5 flex justify-end">
                      <button
                        onClick={() => onNavigate(alert.actionTarget!.view, alert.actionTarget!.subTab)}
                        className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#283B2C] hover:text-[#B8772E] cursor-pointer"
                      >
                        <span>{alert.actionLabel}</span>
                        <ExternalLink className="w-3 h-3" />
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
