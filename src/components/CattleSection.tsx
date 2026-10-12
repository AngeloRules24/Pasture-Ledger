import React, { useState, useMemo } from 'react';
import { 
  Plus, 
  Search, 
  Filter, 
  Calendar, 
  Droplets, 
  Syringe, 
  Trash2, 
  Tag, 
  Baby, 
  Check, 
  AlertTriangle, 
  History, 
  ChevronRight,
  ShieldCheck,
  Info,
  Clock,
  ArrowRight
} from 'lucide-react';
import { Cow, FarmMedication, AnimalSex, RemovalReason, CattleRemovalLog } from '../types/farm';
import { 
  calculateAge, 
  fmtDate, 
  todayISO, 
  getDippingStatus, 
  calculateNextAnnualDipping, 
  getCurrentSeason 
} from '../utils/dateAndAge';

interface CattleSectionProps {
  cows: Cow[];
  medications: FarmMedication[];
  onAddCow: (newCow: Cow) => void;
  onUpdateCow: (updatedCow: Cow) => void;
  onRemoveCow: (cowId: string, removalData: { reason: RemovalReason; newTagId?: string; notes: string; salePrice?: number; buyer?: string }) => void;
  onOpenMedications: () => void;
}

export const CattleSection: React.FC<CattleSectionProps> = ({
  cows,
  medications,
  onAddCow,
  onUpdateCow,
  onRemoveCow,
  onOpenMedications
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [sexFilter, setSexFilter] = useState<'all' | 'F' | 'M'>('all');
  const [ageFilter, setAgeFilter] = useState<'all' | 'young' | 'mature'>('all');
  const [dippingFilter, setDippingFilter] = useState<'all' | 'overdue' | 'due_soon'>('all');

  // Modals state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedCowForDetail, setSelectedCowForDetail] = useState<Cow | null>(null);
  const [cowToRemove, setCowToRemove] = useState<Cow | null>(null);
  const [cowForDipping, setCowForDipping] = useState<Cow | null>(null);
  const [cowForVaccine, setCowForVaccine] = useState<Cow | null>(null);

  const activeCows = useMemo(() => cows.filter((c) => c.status === 'Active'), [cows]);

  // Find children / offspring for any cow
  const getCowChildren = (cow: Cow): Cow[] => {
    const cowTags = [cow.tag, ...(cow.tagHistory ? cow.tagHistory.map((h) => h.oldTag) : [])];
    return activeCows.filter((c) => {
      if (c.id === cow.id) return false;
      return cowTags.includes(c.damTag) || cowTags.includes(c.sireTag);
    });
  };

  // Filtered cows list
  const filteredCows = useMemo(() => {
    return activeCows.filter((cow) => {
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch = !q || (
        cow.tag.toLowerCase().includes(q) ||
        cow.breed.toLowerCase().includes(q) ||
        cow.color.toLowerCase().includes(q) ||
        cow.damTag.toLowerCase().includes(q) ||
        cow.sireTag.toLowerCase().includes(q)
      );

      const matchesSex = sexFilter === 'all' || cow.sex === sexFilter;
      const ageInfo = calculateAge(cow.birthdate);
      const matchesAge = ageFilter === 'all' || (ageFilter === 'young' ? ageInfo.isYoungStock : !ageInfo.isYoungStock);

      const dipStatus = getDippingStatus(cow.lastDippingDate);
      const matchesDip = dippingFilter === 'all' || 
        (dippingFilter === 'overdue' && dipStatus.status === 'Overdue') ||
        (dippingFilter === 'due_soon' && dipStatus.status === 'Due Soon');

      return matchesSearch && matchesSex && matchesAge && matchesDip;
    });
  }, [activeCows, searchQuery, sexFilter, ageFilter, dippingFilter]);

  // Available Dams and Sires for dropdowns
  const availableDams = useMemo(() => activeCows.filter((c) => c.sex === 'F'), [activeCows]);
  const availableSires = useMemo(() => activeCows.filter((c) => c.sex === 'M'), [activeCows]);

  // ================= ADD COW FORM STATE =================
  const [newTag, setNewTag] = useState('');
  const [newSex, setNewSex] = useState<AnimalSex>('F');
  const [newBirthdate, setNewBirthdate] = useState(todayISO());
  const [newBreed, setNewBreed] = useState('');
  const [newColor, setNewColor] = useState('');
  const [newDamTag, setNewDamTag] = useState('');
  const [newSireTag, setNewSireTag] = useState('');
  const [customDamInput, setCustomDamInput] = useState('');
  const [customSireInput, setCustomSireInput] = useState('');
  const [newHerdGroup, setNewHerdGroup] = useState<'Breeding Cow' | 'Bull' | 'Heifer' | 'Calf' | 'Steer'>('Heifer');
  const [addFormErrors, setAddFormErrors] = useState<Record<string, string>>({});

  const handleOpenAddModal = () => {
    // Generate default suggested tag based on birth year
    const yr = todayISO().slice(2, 4);
    const countYr = activeCows.filter((c) => c.tag.startsWith(`${yr}-`)).length + 1;
    setNewTag(`${yr}-${String(countYr).padStart(2, '0')}`);
    setNewSex('F');
    setNewBirthdate(todayISO());
    setNewBreed('');
    setNewColor('');
    setNewDamTag(availableDams.length > 0 ? availableDams[0].tag : '');
    setNewSireTag(availableSires.length > 0 ? availableSires[0].tag : '');
    setCustomDamInput('');
    setCustomSireInput('');
    setNewHerdGroup('Heifer');
    setAddFormErrors({});
    setIsAddModalOpen(true);
  };

  const handleSaveNewCow = (e: React.FormEvent) => {
    e.preventDefault();
    const errors: Record<string, string> = {};

    const finalTag = newTag.trim();
    if (!finalTag) errors.tag = 'Tag ID is required';
    if (activeCows.some((c) => c.tag.toLowerCase() === finalTag.toLowerCase())) {
      errors.tag = 'A cow with this Tag ID is already registered in the active herd.';
    }

    if (!newSex) errors.sex = 'Sex is mandatory (Female or Male)';
    if (!newBirthdate) errors.birthdate = 'Birthdate is mandatory';
    if (!newBreed.trim()) errors.breed = 'Breed is mandatory (e.g. Brahman, Simmental, Nguni)';

    const effectiveDam = newDamTag === 'custom' ? customDamInput.trim() : newDamTag.trim();
    const effectiveSire = newSireTag === 'custom' ? customSireInput.trim() : newSireTag.trim();

    if (!effectiveDam) errors.damTag = 'Mother (Dam) is NOT optional. Enter or select Dam tag.';
    if (!effectiveSire) errors.sireTag = 'Father (Sire) is NOT optional. Enter or select Sire tag.';

    if (Object.keys(errors).length > 0) {
      setAddFormErrors(errors);
      return;
    }

    const newCowRecord: Cow = {
      id: `COW-${String(cows.length + 1).padStart(4, '0')}`,
      tag: finalTag,
      sex: newSex,
      birthdate: newBirthdate,
      breed: newBreed.trim(),
      color: newColor.trim() || 'Standard coat',
      damTag: effectiveDam,
      sireTag: effectiveSire,
      herdGroup: newHerdGroup,
      birthEvents: [],
      lastDippingDate: undefined,
      vaccinations: [],
      dippings: [],
      status: 'Active'
    };

    onAddCow(newCowRecord);
    setIsAddModalOpen(false);
  };

  // ================= REMOVE COW FORM STATE =================
  const [removalReason, setRemovalReason] = useState<RemovalReason>('sale');
  const [newReplacementTag, setNewReplacementTag] = useState('');
  const [removalNotes, setRemovalNotes] = useState('');
  const [salePrice, setSalePrice] = useState<string>('');
  const [buyerName, setBuyerName] = useState<string>('');
  const [removalError, setRemovalError] = useState<string>('');

  const handleOpenRemoveModal = (cow: Cow) => {
    setCowToRemove(cow);
    setRemovalReason('sale');
    setNewReplacementTag('');
    setRemovalNotes('');
    setSalePrice('');
    setBuyerName('');
    setRemovalError('');
  };

  const handleConfirmRemoval = () => {
    if (!cowToRemove) return;
    setRemovalError('');

    if (removalReason === 'lost_tag_replaced') {
      const cleanNewTag = newReplacementTag.trim();
      if (!cleanNewTag) {
        setRemovalError('New Tag ID is MANDATORY when tag replacement is selected as the reason.');
        return;
      }
      if (activeCows.some((c) => c.tag.toLowerCase() === cleanNewTag.toLowerCase() && c.id !== cowToRemove.id)) {
        setRemovalError(`Tag "${cleanNewTag}" is already assigned to another active cow.`);
        return;
      }

      onRemoveCow(cowToRemove.id, {
        reason: 'lost_tag_replaced',
        newTagId: cleanNewTag,
        notes: removalNotes.trim() || `Lost original ear tag ${cowToRemove.tag}; replaced with new tag ${cleanNewTag}.`
      });
      setCowToRemove(null);
      return;
    }

    if (!removalNotes.trim() && removalReason !== 'sale') {
      setRemovalError('Please provide details/explanation for this removal.');
      return;
    }

    onRemoveCow(cowToRemove.id, {
      reason: removalReason,
      notes: removalNotes.trim(),
      salePrice: salePrice ? parseFloat(salePrice) : undefined,
      buyer: buyerName.trim() || undefined
    });
    setCowToRemove(null);
  };

  // ================= DIPPING MODAL STATE =================
  const [dipDate, setDipDate] = useState(todayISO());
  const [dipChemical, setDipChemical] = useState('Triatix 12.5% EC (Amitraz)');
  const [dipOperator, setDipOperator] = useState('Samuel Mokoena');
  const [dipNotes, setDipNotes] = useState('');

  const handleRecordDipping = (e: React.FormEvent) => {
    e.preventDefault();
    if (!cowForDipping) return;

    const nextDue = calculateNextAnnualDipping(dipDate);
    const newRecord = {
      id: `DIP-${Date.now()}`,
      date: dipDate,
      chemicalUsed: dipChemical,
      operator: dipOperator,
      nextDueDate: nextDue,
      notes: dipNotes
    };

    const updatedCow: Cow = {
      ...cowForDipping,
      lastDippingDate: dipDate,
      lastDippingChemical: dipChemical,
      dippings: [newRecord, ...cowForDipping.dippings]
    };

    onUpdateCow(updatedCow);
    setCowForDipping(null);
  };

  // ================= VACCINE MODAL STATE =================
  const [vaccineDate, setVaccineDate] = useState(todayISO());
  const [selectedMedId, setSelectedMedId] = useState(medications[0]?.id || '');
  const [vaccineDosage, setVaccineDosage] = useState('2ml subcutaneous');
  const [administeredBy, setAdministeredBy] = useState('Grace Sibanda');
  const [vaccineNotes, setVaccineNotes] = useState('');

  const handleRecordVaccine = (e: React.FormEvent) => {
    e.preventDefault();
    if (!cowForVaccine) return;

    const med = medications.find((m) => m.id === selectedMedId);
    if (!med) return;

    const newRecord = {
      id: `VAC-${Date.now()}`,
      date: vaccineDate,
      medicationId: med.id,
      medicationName: med.name,
      season: med.targetSeason,
      administeredBy,
      dosage: vaccineDosage,
      notes: vaccineNotes
    };

    const updatedCow: Cow = {
      ...cowForVaccine,
      vaccinations: [newRecord, ...cowForVaccine.vaccinations]
    };

    onUpdateCow(updatedCow);
    setCowForVaccine(null);
  };

  return (
    <div className="space-y-5">
      {/* Action Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-lg sm:text-xl font-bold tracking-tight text-[#1E2620]">🐄 Cattle Herd &amp; Pedigree Registry</h2>
          <p className="text-xs text-[#5D6357]">
            Full pedigree tracking with mandatory parentage, annual dipping compliance, seasonal vaccinations, and offspring lineage.
          </p>
        </div>

        <div className="grid grid-cols-2 sm:flex sm:items-center gap-2 w-full sm:w-auto">
          <button
            onClick={onOpenMedications}
            className="px-2.5 sm:px-3 py-2 text-xs font-semibold rounded-lg bg-[#EAE4D5] text-[#363428] hover:bg-[#DCD5C4] transition-colors cursor-pointer flex items-center justify-center gap-1.5 min-h-[40px] text-center"
          >
            <Syringe className="w-3.5 h-3.5 text-[#B8772E]" />
            <span className="truncate">Medications</span>
          </button>
          <button
            onClick={handleOpenAddModal}
            className="px-3 sm:px-3.5 py-2 text-xs font-semibold rounded-lg bg-[#C28B38] text-[#1B1405] hover:bg-[#A9752A] transition-colors cursor-pointer flex items-center justify-center gap-1.5 shadow-xs whitespace-nowrap min-h-[40px] text-center font-bold"
          >
            <Plus className="w-3.5 h-3.5" />
            <span className="truncate">+ Register Cow</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white border border-[#D5CDBC] rounded-xl p-3 sm:p-3.5 shadow-2xs space-y-3">
        <div className="flex flex-col md:flex-row gap-2.5 sm:gap-3">
          <div className="flex-1 relative">
            <Search className="w-4 h-4 text-[#8C8675] absolute left-3 top-3" />
            <input
              type="text"
              placeholder="Search by Tag ID, Breed, Dam Tag, or Sire Tag..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2.5 text-base sm:text-xs border border-[#D3CBB9] rounded-lg bg-[#FAF8F3] text-[#1E231F] placeholder-[#8A8574] focus:outline-none focus:border-[#2E3C31] min-h-[42px]"
            />
          </div>

          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar touch-pan-x pb-1 pt-0.5 -mx-1 px-1 flex-nowrap">
            {/* Sex Filter */}
            <div className="flex items-center rounded-lg bg-[#F3EFE4] p-0.5 border border-[#DCD5C3] shrink-0">
              <button
                onClick={() => setSexFilter('all')}
                className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors cursor-pointer min-h-[34px] ${
                  sexFilter === 'all' ? 'bg-[#2E3C31] text-white' : 'text-[#534E40] hover:text-black'
                }`}
              >
                All Sex
              </button>
              <button
                onClick={() => setSexFilter('F')}
                className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors cursor-pointer min-h-[34px] ${
                  sexFilter === 'F' ? 'bg-[#2E3C31] text-white' : 'text-[#534E40] hover:text-black'
                }`}
              >
                Females ({activeCows.filter((c) => c.sex === 'F').length})
              </button>
              <button
                onClick={() => setSexFilter('M')}
                className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors cursor-pointer min-h-[34px] ${
                  sexFilter === 'M' ? 'bg-[#2E3C31] text-white' : 'text-[#534E40] hover:text-black'
                }`}
              >
                Males ({activeCows.filter((c) => c.sex === 'M').length})
              </button>
            </div>

            {/* Age Filter */}
            <div className="flex items-center rounded-lg bg-[#F3EFE4] p-0.5 border border-[#DCD5C3] shrink-0">
              <button
                onClick={() => setAgeFilter('all')}
                className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors cursor-pointer min-h-[34px] ${
                  ageFilter === 'all' ? 'bg-[#2E3C31] text-white' : 'text-[#534E40] hover:text-black'
                }`}
              >
                All Ages
              </button>
              <button
                onClick={() => setAgeFilter('young')}
                className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors cursor-pointer min-h-[34px] ${
                  ageFilter === 'young' ? 'bg-[#2E3C31] text-white' : 'text-[#534E40] hover:text-black'
                }`}
              >
                Young &lt;2y
              </button>
              <button
                onClick={() => setAgeFilter('mature')}
                className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors cursor-pointer min-h-[34px] ${
                  ageFilter === 'mature' ? 'bg-[#2E3C31] text-white' : 'text-[#534E40] hover:text-black'
                }`}
              >
                Mature &ge;2y
              </button>
            </div>

            {/* Dipping Filter */}
            <div className="flex items-center rounded-lg bg-[#F3EFE4] p-0.5 border border-[#DCD5C3] shrink-0">
              <button
                onClick={() => setDippingFilter('all')}
                className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors cursor-pointer min-h-[34px] ${
                  dippingFilter === 'all' ? 'bg-[#2E3C31] text-white' : 'text-[#534E40] hover:text-black'
                }`}
              >
                All Dipping
              </button>
              <button
                onClick={() => setDippingFilter('overdue')}
                className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors cursor-pointer min-h-[34px] ${
                  dippingFilter === 'overdue' ? 'bg-[#B8402A] text-white' : 'text-[#534E40] hover:text-black'
                }`}
              >
                Overdue Dip ({activeCows.filter((c) => getDippingStatus(c.lastDippingDate).status === 'Overdue').length})
              </button>
            </div>
          </div>
        </div>

        {/* Dipping & Vaccine rules note */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between text-[11px] text-[#696F61] pt-1 gap-1">
          <div className="flex items-center gap-1.5">
            <Info className="w-3.5 h-3.5 text-[#B8772E] shrink-0" />
            <span>
              <strong>Dipping Protocol:</strong> Compulsory annual dip (every 12 months).{' '}
              <strong>Vaccination Protocol:</strong> Administered seasonally when new medication is registered in system.
            </span>
          </div>
          <span className="font-mono text-[#585E51] self-end sm:self-auto shrink-0">Showing {filteredCows.length} of {activeCows.length} cattle</span>
        </div>
      </div>

      {/* Cattle Cards Grid */}
      {filteredCows.length === 0 ? (
        <div className="bg-white border border-[#D5CDBC] rounded-xl p-8 text-center text-[#686E61]">
          <p className="font-semibold text-sm">No cattle matched the selected search or filters.</p>
          <p className="text-xs mt-1">Try resetting the filter tabs or registering a new cow.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredCows.map((cow) => {
            const ageInfo = calculateAge(cow.birthdate);
            const children = getCowChildren(cow);
            const dipInfo = getDippingStatus(cow.lastDippingDate);

            // Check current season vaccine compliance
            const currentSeason = getCurrentSeason();
            const currentSeasonMed = medications.find(
              (m) => m.category === 'Vaccine' && m.targetSeason.toLowerCase() === currentSeason.toLowerCase()
            );
            const hasSeasonalDose = currentSeasonMed
              ? cow.vaccinations.some((v) => v.medicationId === currentSeasonMed.id)
              : true;

            return (
              <div
                key={cow.id}
                className="bg-white border border-[#D5CDBC] rounded-xl p-4 shadow-2xs hover:border-[#8E9B82] transition-colors flex flex-col justify-between"
              >
                <div>
                  {/* Top Header of Card */}
                  <div className="flex items-start justify-between gap-2 pb-3 border-b border-[#EDE7D6]">
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span className="font-mono-numbers font-bold text-sm sm:text-base px-2 py-0.5 rounded bg-[#2E3C31] text-white">
                          Tag: {cow.tag}
                        </span>
                        <span className={`text-[10px] sm:text-[11px] font-bold px-2 py-0.5 rounded ${
                          cow.sex === 'F' ? 'bg-[#E3EBE4] text-[#294B32]' : 'bg-[#F4E9D7] text-[#8C5E1E]'
                        }`}>
                          {cow.sex === 'F' ? 'Female' : 'Male'}
                        </span>
                        {ageInfo.isYoungStock ? (
                          <span className="text-[10px] sm:text-[11px] font-semibold px-2 py-0.5 rounded bg-[#E4EBE5] text-[#294B32]">
                            Young (&lt;2y)
                          </span>
                        ) : (
                          <span className="text-[10px] sm:text-[11px] font-semibold px-2 py-0.5 rounded bg-[#EAE4D2] text-[#554E38]">
                            Mature (&ge;2y)
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-2 mt-1.5 text-xs text-[#5D6456] flex-wrap">
                        <span className="font-medium text-[#1E241F]">{cow.breed}</span>
                        <span>•</span>
                        <span>{cow.color}</span>
                        {cow.tagHistory && cow.tagHistory.length > 0 && (
                          <span className="text-[10px] bg-[#FFF5E6] border border-[#FAD7A0] px-1.5 py-0.5 rounded text-[#93520A] font-medium" title={`Replaced tag: previous tag was ${cow.tagHistory[0].oldTag}`}>
                            Replaced (prev: {cow.tagHistory[0].oldTag})
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        onClick={() => setSelectedCowForDetail(cow)}
                        className="p-1.5 text-xs text-[#2E3C31] hover:bg-[#F2EFE6] rounded-md transition-colors cursor-pointer min-h-[36px] min-w-[36px] flex items-center justify-center"
                        title="View Full Pedigree & Care Profile"
                      >
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Metadata Grid */}
                  <div className="grid grid-cols-2 gap-2.5 py-3 text-xs border-b border-[#EDE7D6]">
                    <div>
                      <span className="text-[10px] uppercase tracking-wider font-semibold text-[#73796A] block">
                        Calculated Age
                      </span>
                      <span className="font-bold text-[#1F2721] font-mono-numbers text-xs sm:text-sm">
                        {ageInfo.formatted}
                      </span>
                      <span className="text-[10px] text-[#73796A] block">Born: {fmtDate(cow.birthdate)}</span>
                    </div>

                    <div>
                      <span className="text-[10px] uppercase tracking-wider font-semibold text-[#73796A] block">
                        Parents (Mandatory)
                      </span>
                      <div className="text-[11px]">
                        <span className="text-[#294B32] font-semibold">Dam: {cow.damTag}</span>
                        <br />
                        <span className="text-[#8C5E1E] font-semibold">Sire: {cow.sireTag}</span>
                      </div>
                    </div>

                    <div>
                      <span className="text-[10px] uppercase tracking-wider font-semibold text-[#73796A] block">
                        Annual Dipping (12mo)
                      </span>
                      <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                          dipInfo.status === 'Up to Date'
                            ? 'bg-[#E3ECE4] text-[#284E33]'
                            : dipInfo.status === 'Due Soon'
                            ? 'bg-[#F9ECCF] text-[#87550C]'
                            : 'bg-[#FCE5E2] text-[#A62F1E]'
                        }`}>
                          {dipInfo.status}
                        </span>
                        <span className="text-[10px] text-[#555B4E]">
                          {cow.lastDippingDate ? fmtDate(cow.lastDippingDate) : 'Not recorded'}
                        </span>
                      </div>
                    </div>

                    <div>
                      <span className="text-[10px] uppercase tracking-wider font-semibold text-[#73796A] block">
                        Seasonal Vaccine ({currentSeason})
                      </span>
                      <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                          hasSeasonalDose ? 'bg-[#E3ECE4] text-[#284E33]' : 'bg-[#FCE5E2] text-[#A62F1E]'
                        }`}>
                          {hasSeasonalDose ? 'Up to date' : 'Dose pending'}
                        </span>
                        <span className="text-[10px] text-[#555B4E]">
                          {cow.vaccinations.length} logged
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Offspring / Children IDs section */}
                  <div className="py-2.5">
                    <div className="flex items-center justify-between text-xs mb-1.5">
                      <span className="font-semibold text-[#2D392F] flex items-center gap-1">
                        <Baby className="w-3.5 h-3.5 text-[#B8772E]" />
                        <span>Offspring / Children IDs ({children.length})</span>
                      </span>
                      {cow.sex === 'F' && cow.birthEvents.length > 0 && (
                        <span className="text-[10px] text-[#73796A]">
                          Births: {cow.birthEvents.join(', ')}
                        </span>
                      )}
                    </div>

                    {children.length === 0 ? (
                      <p className="text-[11px] text-[#868C7E] italic">
                        No recorded offspring in the herd for tag {cow.tag}.
                      </p>
                    ) : (
                      <div className="flex flex-wrap gap-1.5">
                        {children.map((child) => {
                          const childAge = calculateAge(child.birthdate);
                          return (
                            <button
                              key={child.id}
                              onClick={() => setSelectedCowForDetail(child)}
                              className="text-left px-2 py-1 rounded bg-[#F4EFE2] hover:bg-[#EAE2D0] border border-[#DDD5C0] text-[11px] transition-colors cursor-pointer flex items-center gap-1.5 min-h-[32px]"
                            >
                              <span className="font-bold text-[#1E2620]">{child.tag}</span>
                              <span className="text-[10px] text-[#696F61]">
                                ({child.sex} · {childAge.formatted})
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>

                {/* Card Actions Bottom Strip */}
                <div className="mt-3 pt-3 border-t border-[#EDE7D6] flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <button
                      onClick={() => {
                        setCowForDipping(cow);
                        setDipDate(todayISO());
                      }}
                      className="px-2.5 py-1.5 text-xs font-semibold rounded bg-[#F0ECE1] hover:bg-[#E3DDCD] text-[#29362B] transition-colors cursor-pointer flex items-center gap-1 min-h-[36px]"
                      title="Log Annual Dipping"
                    >
                      <Droplets className="w-3 h-3 text-[#294B32]" />
                      <span>Dip</span>
                    </button>

                    <button
                      onClick={() => {
                        setCowForVaccine(cow);
                        setVaccineDate(todayISO());
                      }}
                      className="px-2.5 py-1.5 text-xs font-semibold rounded bg-[#F0ECE1] hover:bg-[#E3DDCD] text-[#29362B] transition-colors cursor-pointer flex items-center gap-1 min-h-[36px]"
                      title="Log Seasonal Vaccine"
                    >
                      <Syringe className="w-3 h-3 text-[#B8772E]" />
                      <span>Vaccinate</span>
                    </button>
                  </div>

                  <div className="flex items-center gap-1.5 flex-wrap">
                    <button
                      onClick={() => setSelectedCowForDetail(cow)}
                      className="px-2.5 py-1.5 text-xs font-semibold rounded border border-[#D5CDBC] text-[#343A2F] hover:bg-[#F3EFE4] transition-colors cursor-pointer min-h-[36px]"
                    >
                      Profile &amp; Pedigree
                    </button>

                    <button
                      onClick={() => handleOpenRemoveModal(cow)}
                      className="px-2.5 py-1.5 text-xs font-medium rounded text-[#A62F1E] hover:bg-[#FCE5E2] transition-colors cursor-pointer flex items-center gap-1 min-h-[36px]"
                      title="Remove cow with mandatory valid reason"
                    >
                      <Trash2 className="w-3 h-3" />
                      <span>Remove</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ================= MODAL: ADD COW (MANDATORY PARENTS, BREED, SEX, BIRTHDATE) ================= */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:p-4 bg-black/50 backdrop-blur-xs overflow-y-auto">
          <div className="bg-[#FAF8F2] border-t sm:border border-[#D5CDBC] rounded-t-2xl sm:rounded-2xl w-full max-w-xl p-4 sm:p-6 shadow-2xl max-h-[92vh] flex flex-col">
            <div className="w-10 h-1 bg-[#D1C9B6] rounded-full mx-auto mb-2 sm:hidden shrink-0"></div>
            <div className="flex items-center justify-between pb-3 border-b border-[#E8E1CE] shrink-0">
              <div>
                <h3 className="text-base sm:text-lg font-bold text-[#1E2620]">Register New Cow / Calf</h3>
                <p className="text-[11px] sm:text-xs text-[#636A5B]">
                  Parents (Mother &amp; Father), Sex, Breed, and Birthdate are strictly mandatory fields.
                </p>
              </div>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 text-lg font-bold cursor-pointer p-1 min-h-[36px]"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveNewCow} className="flex-1 overflow-y-auto space-y-3.5 pt-3 pb-1 text-xs pr-1">
              {/* Row 1: Tag & Sex */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-[#4B5143] uppercase tracking-wider mb-1">
                    Tag / Identifier *
                  </label>
                  <input
                    type="text"
                    required
                    value={newTag}
                    onChange={(e) => setNewTag(e.target.value)}
                    placeholder="e.g. 26-08 or BRAH-102"
                    className="w-full px-3 py-2 border border-[#D5CDBC] rounded-lg bg-white text-sm font-semibold focus:outline-none focus:border-[#2E3C31]"
                  />
                  {addFormErrors.tag && <p className="text-[#C84B31] text-[11px] mt-1 font-semibold">{addFormErrors.tag}</p>}
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-[#4B5143] uppercase tracking-wider mb-1">
                    Sex * (Mandatory)
                  </label>
                  <select
                    value={newSex}
                    onChange={(e) => {
                      const s = e.target.value as AnimalSex;
                      setNewSex(s);
                      if (s === 'M') setNewHerdGroup('Bull');
                      else setNewHerdGroup('Heifer');
                    }}
                    className="w-full px-3 py-2 border border-[#D5CDBC] rounded-lg bg-white text-sm font-semibold focus:outline-none focus:border-[#2E3C31]"
                  >
                    <option value="F">Female (Cow / Heifer)</option>
                    <option value="M">Male (Bull / Steer)</option>
                  </select>
                </div>
              </div>

              {/* Row 2: Birthdate & Calculated Age */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-[#4B5143] uppercase tracking-wider mb-1">
                    Birthdate * (Mandatory)
                  </label>
                  <input
                    type="date"
                    required
                    max={todayISO()}
                    value={newBirthdate}
                    onChange={(e) => setNewBirthdate(e.target.value)}
                    className="w-full px-3 py-2 border border-[#D5CDBC] rounded-lg bg-white text-sm font-semibold focus:outline-none focus:border-[#2E3C31]"
                  />
                  {addFormErrors.birthdate && <p className="text-[#C84B31] text-[11px] mt-1 font-semibold">{addFormErrors.birthdate}</p>}
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-[#4B5143] uppercase tracking-wider mb-1">
                    Automatic Age Calculation
                  </label>
                  <div className="px-3 py-2 border border-[#E3DCB8] rounded-lg bg-[#F5F2E8] text-sm font-mono-numbers font-bold text-[#2A372C]">
                    {calculateAge(newBirthdate).formatted}
                    <span className="text-xs text-[#63685C] font-normal ml-2">
                      ({calculateAge(newBirthdate).isYoungStock ? 'Young Stock <2y' : 'Mature ≥2y'})
                    </span>
                  </div>
                </div>
              </div>

              {/* Row 3: Breed & Coat Color */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-[#4B5143] uppercase tracking-wider mb-1">
                    Breed * (Mandatory)
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Brahman, Simmental, Nguni, Angus"
                    value={newBreed}
                    onChange={(e) => setNewBreed(e.target.value)}
                    className="w-full px-3 py-2 border border-[#D5CDBC] rounded-lg bg-white text-sm font-semibold focus:outline-none focus:border-[#2E3C31]"
                  />
                  {addFormErrors.breed && <p className="text-[#C84B31] text-[11px] mt-1 font-semibold">{addFormErrors.breed}</p>}
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-[#4B5143] uppercase tracking-wider mb-1">
                    Coat Color / Distinctive Markings
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Silver grey, red star on poll"
                    value={newColor}
                    onChange={(e) => setNewColor(e.target.value)}
                    className="w-full px-3 py-2 border border-[#D5CDBC] rounded-lg bg-white text-sm font-semibold focus:outline-none focus:border-[#2E3C31]"
                  />
                </div>
              </div>

              {/* Row 4: Mandatory Mother (Dam) & Father (Sire) Pedigree */}
              <div className="p-3.5 bg-[#F2EDE2] border border-[#DDD3BE] rounded-xl space-y-3">
                <div className="flex items-center gap-1.5 text-xs font-bold text-[#243326]">
                  <Baby className="w-4 h-4 text-[#B8772E]" />
                  <span>Mandatory Parent Pedigree (Dam &amp; Sire Required)</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* Mother / Dam */}
                  <div>
                    <label className="block text-[11px] font-bold text-[#4B5143] mb-1">
                      Mother / Dam Tag * (Mandatory)
                    </label>
                    <select
                      value={newDamTag}
                      onChange={(e) => setNewDamTag(e.target.value)}
                      className="w-full px-3 py-2 border border-[#D5CDBC] rounded-lg bg-white font-semibold focus:outline-none focus:border-[#2E3C31]"
                    >
                      <option value="">— Select Dam from Female Herd —</option>
                      {availableDams.map((dam) => (
                        <option key={dam.id} value={dam.tag}>
                          {dam.tag} ({dam.breed} · {calculateAge(dam.birthdate).formatted})
                        </option>
                      ))}
                      <option value="custom">✏️ Enter External / Registered Dam Tag</option>
                    </select>

                    {newDamTag === 'custom' && (
                      <input
                        type="text"
                        placeholder="Type external mother tag ID..."
                        value={customDamInput}
                        onChange={(e) => setCustomDamInput(e.target.value)}
                        className="w-full mt-2 px-3 py-1.5 border border-[#D5CDBC] rounded-lg bg-white font-semibold"
                      />
                    )}
                    {addFormErrors.damTag && <p className="text-[#C84B31] text-[11px] mt-1 font-semibold">{addFormErrors.damTag}</p>}
                  </div>

                  {/* Father / Sire */}
                  <div>
                    <label className="block text-[11px] font-bold text-[#4B5143] mb-1">
                      Father / Sire Tag * (Mandatory)
                    </label>
                    <select
                      value={newSireTag}
                      onChange={(e) => setNewSireTag(e.target.value)}
                      className="w-full px-3 py-2 border border-[#D5CDBC] rounded-lg bg-white font-semibold focus:outline-none focus:border-[#2E3C31]"
                    >
                      <option value="">— Select Sire from Bull Herd —</option>
                      {availableSires.map((sire) => (
                        <option key={sire.id} value={sire.tag}>
                          {sire.tag} ({sire.breed} · {calculateAge(sire.birthdate).formatted})
                        </option>
                      ))}
                      <option value="custom">✏️ Enter External / AI Stud Sire Tag</option>
                    </select>

                    {newSireTag === 'custom' && (
                      <input
                        type="text"
                        placeholder="Type external sire tag ID..."
                        value={customSireInput}
                        onChange={(e) => setCustomSireInput(e.target.value)}
                        className="w-full mt-2 px-3 py-1.5 border border-[#D5CDBC] rounded-lg bg-white font-semibold"
                      />
                    )}
                    {addFormErrors.sireTag && <p className="text-[#C84B31] text-[11px] mt-1 font-semibold">{addFormErrors.sireTag}</p>}
                  </div>
                </div>
              </div>

              {/* Form buttons */}
              <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#E8E1CE] shrink-0 mt-auto">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2.5 rounded-lg border border-[#D5CDBC] text-[#4E4B3E] hover:bg-[#EAE4D5] font-semibold transition-colors cursor-pointer min-h-[44px]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-lg bg-[#C28B38] text-[#1B1405] hover:bg-[#A9752A] font-bold transition-colors cursor-pointer shadow-xs min-h-[44px]"
                >
                  Save Cow with Pedigree
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= MODAL: REMOVE COW WITH VALID REASONS & MANDATORY NEW TAG IF REPLACED ================= */}
      {cowToRemove && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:p-4 bg-black/50 backdrop-blur-xs overflow-y-auto">
          <div className="bg-[#FAF8F2] border-t sm:border border-[#D5CDBC] rounded-t-2xl sm:rounded-2xl w-full max-w-lg p-4 sm:p-6 shadow-2xl max-h-[92vh] flex flex-col">
            <div className="w-10 h-1 bg-[#D1C9B6] rounded-full mx-auto mb-2 sm:hidden shrink-0"></div>
            <div className="flex items-center justify-between pb-3 border-b border-[#E8E1CE] shrink-0">
              <div>
                <h3 className="text-base sm:text-lg font-bold text-[#1E2620]">
                  Remove / Audit Cow — Tag {cowToRemove.tag}
                </h3>
                <p className="text-[11px] sm:text-xs text-[#636A5B]">
                  A valid reason is required. If tag is replaced, new tag ID is mandatory.
                </p>
              </div>
              <button
                onClick={() => setCowToRemove(null)}
                className="text-gray-400 hover:text-gray-600 text-lg font-bold cursor-pointer p-1 min-h-[36px]"
              >
                ✕
              </button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-4 pt-3 pb-1 text-xs pr-1">
              {removalError && (
                <div className="p-3 bg-[#FCE5E2] border border-[#F8B8B0] rounded-lg text-[#9B2B1B] font-semibold">
                  {removalError}
                </div>
              )}

              {/* Valid reason selection */}
              <div>
                <label className="block text-[11px] font-bold text-[#4B5143] uppercase tracking-wider mb-2">
                  Select Valid Reason for Removal *
                </label>
                <div className="space-y-2">
                  <label className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-colors ${
                    removalReason === 'sale' ? 'bg-[#F2ECE0] border-[#2E3C31]' : 'bg-white border-[#DCD5C3]'
                  }`}>
                    <input
                      type="radio"
                      name="removalReason"
                      value="sale"
                      checked={removalReason === 'sale'}
                      onChange={() => setRemovalReason('sale')}
                      className="mt-0.5"
                    />
                    <div>
                      <span className="font-bold text-[#1E241F] block text-xs">Sale (Commercial / Auction)</span>
                      <span className="text-[11px] text-[#696F61]">Cow transferred or auctioned off the premises.</span>
                    </div>
                  </label>

                  <label className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-colors ${
                    removalReason === 'lost_tag_replaced' ? 'bg-[#FFF8E6] border-[#C28B38]' : 'bg-white border-[#DCD5C3]'
                  }`}>
                    <input
                      type="radio"
                      name="removalReason"
                      value="lost_tag_replaced"
                      checked={removalReason === 'lost_tag_replaced'}
                      onChange={() => setRemovalReason('lost_tag_replaced')}
                      className="mt-0.5"
                    />
                    <div>
                      <span className="font-bold text-[#915B17] block text-xs">
                        🏷️ Lost tag, but replaced (Mandatory New Tag ID)
                      </span>
                      <span className="text-[11px] text-[#696F61]">
                        The cow remains in the herd, but its missing ear tag is replaced with a new unique Tag ID.
                      </span>
                    </div>
                  </label>

                  <label className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-colors ${
                    removalReason === 'death' ? 'bg-[#FDF2F0] border-[#C84B31]' : 'bg-white border-[#DCD5C3]'
                  }`}>
                    <input
                      type="radio"
                      name="removalReason"
                      value="death"
                      checked={removalReason === 'death'}
                      onChange={() => setRemovalReason('death')}
                      className="mt-0.5"
                    />
                    <div>
                      <span className="font-bold text-[#A62F1E] block text-xs">Death (Natural / Predator / Accident)</span>
                      <span className="text-[11px] text-[#696F61]">Mortality logged in permanent farm loss audit.</span>
                    </div>
                  </label>

                  <label className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-colors ${
                    removalReason === 'illness' ? 'bg-[#FDF2F0] border-[#C84B31]' : 'bg-white border-[#DCD5C3]'
                  }`}>
                    <input
                      type="radio"
                      name="removalReason"
                      value="illness"
                      checked={removalReason === 'illness'}
                      onChange={() => setRemovalReason('illness')}
                      className="mt-0.5"
                    />
                    <div>
                      <span className="font-bold text-[#A62F1E] block text-xs">Illness / Veterinary Cull</span>
                      <span className="text-[11px] text-[#696F61]">Severe terminal disease or biosecurity euthanasia.</span>
                    </div>
                  </label>
                </div>
              </div>

              {/* Conditional: IF LOST TAG REPLACED, MANDATORY NEW TAG INPUT */}
              {removalReason === 'lost_tag_replaced' && (
                <div className="p-4 bg-[#FFF8E6] border-2 border-[#C28B38] rounded-xl space-y-2">
                  <label className="block text-[11px] font-bold text-[#7E4C0F] uppercase tracking-wider">
                    New Tag ID * (Mandatory Input Field)
                  </label>
                  <p className="text-[11px] text-[#6E5526]">
                    Please attach the new ear tag to the cow and enter its new tag ID below. All pedigree and offspring records will transition to this new identifier.
                  </p>
                  <input
                    type="text"
                    required
                    placeholder="e.g. 26-99 or REPL-24-08"
                    value={newReplacementTag}
                    onChange={(e) => setNewReplacementTag(e.target.value)}
                    className="w-full px-3 py-2 border-2 border-[#C28B38] rounded-lg bg-white font-mono-numbers font-bold text-sm text-[#251B07] focus:outline-none"
                  />
                </div>
              )}

              {/* Conditional: IF SALE */}
              {removalReason === 'sale' && (
                <div className="grid grid-cols-2 gap-3 p-3 bg-[#F4EFE2] rounded-xl border border-[#DDD3BE]">
                  <div>
                    <label className="block text-[11px] font-bold text-[#4B5143] mb-1">Sale Price ($)</label>
                    <input
                      type="number"
                      placeholder="e.g. 1850"
                      value={salePrice}
                      onChange={(e) => setSalePrice(e.target.value)}
                      className="w-full px-3 py-1.5 border border-[#D5CDBC] rounded-lg bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-[#4B5143] mb-1">Buyer / Auction Name</label>
                    <input
                      type="text"
                      placeholder="e.g. Highveld Livestock Mart"
                      value={buyerName}
                      onChange={(e) => setBuyerName(e.target.value)}
                      className="w-full px-3 py-1.5 border border-[#D5CDBC] rounded-lg bg-white"
                    />
                  </div>
                </div>
              )}

              {/* Notes / Reason explanation */}
              <div>
                <label className="block text-[11px] font-bold text-[#4B5143] mb-1">
                  Explanation / Diagnostic Comments
                </label>
                <textarea
                  rows={2}
                  placeholder="Detail the circumstances, autopsy / vet notes, or tag loss cause..."
                  value={removalNotes}
                  onChange={(e) => setRemovalNotes(e.target.value)}
                  className="w-full px-3 py-2 border border-[#D5CDBC] rounded-lg bg-white text-xs focus:outline-none"
                />
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#E8E1CE]">
                <button
                  type="button"
                  onClick={() => setCowToRemove(null)}
                  className="px-4 py-2 rounded-lg border border-[#D5CDBC] text-[#4E4B3E] hover:bg-[#EAE4D5] font-semibold transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleConfirmRemoval}
                  className={`px-5 py-2 rounded-lg font-bold transition-colors cursor-pointer shadow-xs ${
                    removalReason === 'lost_tag_replaced'
                      ? 'bg-[#C28B38] text-[#1B1405] hover:bg-[#A9752A]'
                      : 'bg-[#C84B31] text-white hover:bg-[#A93820]'
                  }`}
                >
                  {removalReason === 'lost_tag_replaced' ? 'Update Tag ID & Keep Active' : 'Confirm Permanent Removal'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ================= MODAL: RECORD ANNUAL DIPPING ================= */}
      {cowForDipping && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:p-4 bg-black/50 backdrop-blur-xs overflow-y-auto">
          <div className="bg-[#FAF8F2] border-t sm:border border-[#D5CDBC] rounded-t-2xl sm:rounded-2xl w-full max-w-md p-4 sm:p-6 shadow-2xl max-h-[92vh] flex flex-col">
            <div className="w-12 h-1.5 bg-[#D1C9B6] rounded-full mx-auto mb-2 sm:hidden shrink-0"></div>
            <div className="flex items-center justify-between pb-3 border-b border-[#E8E1CE] shrink-0">
              <div>
                <h3 className="text-base sm:text-lg font-bold text-[#1E2620]">
                  Record Annual Dipping — Tag {cowForDipping.tag}
                </h3>
                <p className="text-[11px] sm:text-xs text-[#636A5B]">
                  Dipping happens annually (12-month validity window).
                </p>
              </div>
              <button
                onClick={() => setCowForDipping(null)}
                className="text-gray-400 hover:text-gray-600 text-lg font-bold cursor-pointer p-1 min-h-[36px]"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleRecordDipping} className="flex-1 overflow-y-auto space-y-3.5 pt-3 pb-1 text-xs pr-1">
              <div>
                <label className="block text-[11px] font-bold text-[#4B5143] uppercase tracking-wider mb-1">
                  Dipping Date *
                </label>
                <input
                  type="date"
                  required
                  value={dipDate}
                  onChange={(e) => setDipDate(e.target.value)}
                  className="w-full px-3 py-2 text-base sm:text-xs border border-[#D5CDBC] rounded-lg bg-white font-semibold"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-[#4B5143] uppercase tracking-wider mb-1">
                  Next Annual Dip Due Date (Automatic +1 Year)
                </label>
                <div className="px-3 py-2 border border-[#D5CDBC] rounded-lg bg-[#F5F2E8] font-mono-numbers font-bold text-[#2A372C] text-sm">
                  {fmtDate(calculateNextAnnualDipping(dipDate))}
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-[#4B5143] uppercase tracking-wider mb-1">
                  Dipping Chemical / Acaricide *
                </label>
                <input
                  type="text"
                  required
                  value={dipChemical}
                  onChange={(e) => setDipChemical(e.target.value)}
                  className="w-full px-3 py-2 text-base sm:text-xs border border-[#D5CDBC] rounded-lg bg-white"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-[#4B5143] uppercase tracking-wider mb-1">
                  Operator / Handler
                </label>
                <input
                  type="text"
                  value={dipOperator}
                  onChange={(e) => setDipOperator(e.target.value)}
                  className="w-full px-3 py-2 text-base sm:text-xs border border-[#D5CDBC] rounded-lg bg-white"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-[#4B5143] uppercase tracking-wider mb-1">
                  Tank Notes
                </label>
                <textarea
                  rows={2}
                  placeholder="e.g. Clean plunge tank bath, 100% immersion, no side effects"
                  value={dipNotes}
                  onChange={(e) => setDipNotes(e.target.value)}
                  className="w-full px-3 py-2 text-base sm:text-xs border border-[#D5CDBC] rounded-lg bg-white"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#E8E1CE] shrink-0 mt-2">
                <button
                  type="button"
                  onClick={() => setCowForDipping(null)}
                  className="px-4 py-2.5 rounded-lg border border-[#D5CDBC] text-[#4E4B3E] font-semibold cursor-pointer min-h-[44px]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-lg bg-[#2E3C31] text-white font-bold cursor-pointer min-h-[44px]"
                >
                  Save Dipping Record
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= MODAL: RECORD SEASONAL VACCINATION ================= */}
      {cowForVaccine && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:p-4 bg-black/50 backdrop-blur-xs overflow-y-auto">
          <div className="bg-[#FAF8F2] border-t sm:border border-[#D5CDBC] rounded-t-2xl sm:rounded-2xl w-full max-w-md p-4 sm:p-6 shadow-2xl max-h-[92vh] flex flex-col">
            <div className="w-12 h-1.5 bg-[#D1C9B6] rounded-full mx-auto mb-2 sm:hidden shrink-0"></div>
            <div className="flex items-center justify-between pb-3 border-b border-[#E8E1CE] shrink-0">
              <div>
                <h3 className="text-base sm:text-lg font-bold text-[#1E2620]">
                  Record Seasonal Vaccine — Tag {cowForVaccine.tag}
                </h3>
                <p className="text-[11px] sm:text-xs text-[#636A5B]">
                  Seasonal protocol: Administered per season for registered farm medications.
                </p>
              </div>
              <button
                onClick={() => setCowForVaccine(null)}
                className="text-gray-400 hover:text-gray-600 text-lg font-bold cursor-pointer p-1 min-h-[36px]"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleRecordVaccine} className="flex-1 overflow-y-auto space-y-3.5 pt-3 pb-1 text-xs pr-1">
              <div>
                <label className="block text-[11px] font-bold text-[#4B5143] uppercase tracking-wider mb-1">
                  Registered Medication / Vaccine *
                </label>
                <select
                  value={selectedMedId}
                  onChange={(e) => setSelectedMedId(e.target.value)}
                  className="w-full px-3 py-2 text-base sm:text-xs border border-[#D5CDBC] rounded-lg bg-white font-semibold"
                >
                  {medications
                    .filter((m) => m.category === 'Vaccine')
                    .map((med) => (
                      <option key={med.id} value={med.id}>
                        {med.name} ({med.targetSeason} Season)
                      </option>
                    ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-[#4B5143] uppercase tracking-wider mb-1">
                  Administration Date *
                </label>
                <input
                  type="date"
                  required
                  value={vaccineDate}
                  onChange={(e) => setVaccineDate(e.target.value)}
                  className="w-full px-3 py-2 text-base sm:text-xs border border-[#D5CDBC] rounded-lg bg-white font-semibold"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-[#4B5143] uppercase tracking-wider mb-1">
                    Dosage
                  </label>
                  <input
                    type="text"
                    value={vaccineDosage}
                    onChange={(e) => setVaccineDosage(e.target.value)}
                    className="w-full px-3 py-2 text-base sm:text-xs border border-[#D5CDBC] rounded-lg bg-white"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-[#4B5143] uppercase tracking-wider mb-1">
                    Administered By
                  </label>
                  <input
                    type="text"
                    value={administeredBy}
                    onChange={(e) => setAdministeredBy(e.target.value)}
                    className="w-full px-3 py-2 text-base sm:text-xs border border-[#D5CDBC] rounded-lg bg-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-[#4B5143] uppercase tracking-wider mb-1">
                  Clinical Notes
                </label>
                <textarea
                  rows={2}
                  placeholder="Crush pen A, temperature normal, booster due next year"
                  value={vaccineNotes}
                  onChange={(e) => setVaccineNotes(e.target.value)}
                  className="w-full px-3 py-2 text-base sm:text-xs border border-[#D5CDBC] rounded-lg bg-white"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#E8E1CE] shrink-0 mt-2">
                <button
                  type="button"
                  onClick={() => setCowForVaccine(null)}
                  className="px-4 py-2.5 rounded-lg border border-[#D5CDBC] text-[#4E4B3E] font-semibold cursor-pointer min-h-[44px]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-lg bg-[#C28B38] text-[#1B1405] font-bold cursor-pointer min-h-[44px]"
                >
                  Save Vaccine Record
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= MODAL: FULL COW PROFILE & PEDIGREE TREE ================= */}
      {selectedCowForDetail && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:p-4 bg-black/50 backdrop-blur-xs overflow-y-auto">
          <div className="bg-[#FAF8F2] border-t sm:border border-[#D5CDBC] rounded-t-2xl sm:rounded-2xl w-full max-w-2xl p-4 sm:p-6 shadow-2xl max-h-[92vh] flex flex-col">
            <div className="w-12 h-1.5 bg-[#D1C9B6] rounded-full mx-auto mb-2 sm:hidden shrink-0"></div>
            <div className="flex items-start justify-between pb-3 border-b border-[#E8E1CE] shrink-0">
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                  <span className="font-mono-numbers text-lg sm:text-xl font-extrabold px-2.5 py-0.5 rounded bg-[#2E3C31] text-white">
                    Tag: {selectedCowForDetail.tag}
                  </span>
                  <span className="text-xs px-2 py-0.5 rounded bg-[#EDE7D6] font-bold text-[#3B382D]">
                    {selectedCowForDetail.breed}
                  </span>
                  <span className={`text-xs px-2 py-0.5 rounded font-bold ${
                    selectedCowForDetail.sex === 'F' ? 'bg-[#E3EBE4] text-[#294B32]' : 'bg-[#F4E9D7] text-[#8C5E1E]'
                  }`}>
                    {selectedCowForDetail.sex === 'F' ? 'Female' : 'Male'}
                  </span>
                </div>
                <p className="text-[11px] sm:text-xs text-[#5E6458] mt-1 truncate">
                  ID: {selectedCowForDetail.id} · Coat: {selectedCowForDetail.color} · Born: {fmtDate(selectedCowForDetail.birthdate)} ({calculateAge(selectedCowForDetail.birthdate).formatted})
                </p>
              </div>
              <button
                onClick={() => setSelectedCowForDetail(null)}
                className="text-gray-400 hover:text-gray-600 text-xl font-bold cursor-pointer p-1 min-h-[36px] min-w-[36px] flex items-center justify-center"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4 sm:space-y-5 pt-3 pb-1 text-xs flex-1 overflow-y-auto pr-1">
              {/* Pedigree Lineage Box */}
              <div className="bg-white border border-[#DCD5C3] rounded-xl p-3.5 sm:p-4 shadow-2xs">
                <h4 className="font-bold text-sm text-[#243326] mb-2 flex items-center gap-1.5">
                  <Baby className="w-4 h-4 text-[#B8772E]" />
                  Pedigree &amp; Family Lineage
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 sm:gap-4 pt-1">
                  <div className="p-3 rounded-lg bg-[#FAF7F0] border border-[#E7DFCD]">
                    <span className="text-[10px] uppercase font-bold text-[#6D7365] block">Mother / Dam (Mandatory)</span>
                    <span className="text-sm font-bold text-[#294B32]">{selectedCowForDetail.damTag}</span>
                    <span className="text-[11px] text-[#6D7365] block mt-0.5">Maternal Lineage</span>
                  </div>

                  <div className="p-3 rounded-lg bg-[#FAF7F0] border border-[#E7DFCD]">
                    <span className="text-[10px] uppercase font-bold text-[#6D7365] block">Father / Sire (Mandatory)</span>
                    <span className="text-sm font-bold text-[#8C5E1E]">{selectedCowForDetail.sireTag}</span>
                    <span className="text-[11px] text-[#6D7365] block mt-0.5">Paternal Lineage</span>
                  </div>
                </div>

                {/* Children / Offspring Section */}
                <div className="mt-4 pt-3 border-t border-[#EDE7D6]">
                  <span className="font-bold text-xs text-[#243326] block mb-2">
                    Direct Children / Offspring ({getCowChildren(selectedCowForDetail).length})
                  </span>

                  {getCowChildren(selectedCowForDetail).length === 0 ? (
                    <p className="text-[11px] text-[#868C7E] italic">
                      No active offspring registered under this parent's tag.
                    </p>
                  ) : (
                    <div className="space-y-2">
                      {getCowChildren(selectedCowForDetail).map((child) => (
                        <div
                          key={child.id}
                          className="flex items-center justify-between p-2 rounded-lg bg-[#F8F5EC] border border-[#DDD5C0]"
                        >
                          <div>
                            <span className="font-bold font-mono-numbers text-xs text-[#2E3C31]">
                              Tag: {child.tag}
                            </span>
                            <span className="text-[11px] text-[#555A4E] ml-2">
                              {child.breed} · {child.sex === 'F' ? 'Female' : 'Male'}
                            </span>
                          </div>
                          <span className="text-[11px] font-semibold text-[#666B5E]">
                            Age: {calculateAge(child.birthdate).formatted}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Tag History (if tag was ever replaced) */}
              {selectedCowForDetail.tagHistory && selectedCowForDetail.tagHistory.length > 0 && (
                <div className="bg-[#FFF8E8] border border-[#EAD5A8] rounded-xl p-3.5">
                  <h4 className="font-bold text-xs text-[#8A520E] mb-2 flex items-center gap-1.5">
                    <History className="w-4 h-4" />
                    Tag Replacement Audit History
                  </h4>
                  <div className="space-y-1.5">
                    {selectedCowForDetail.tagHistory.map((hist, idx) => (
                      <div key={idx} className="text-[11px] text-[#6D5322]">
                        <span className="font-bold">Original Tag: {hist.oldTag}</span> · Replaced on {fmtDate(hist.replacedDate)}
                        <p className="italic text-[#836B3B] mt-0.5">{hist.reason}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Dipping History */}
              <div className="bg-white border border-[#DCD5C3] rounded-xl p-4 shadow-2xs">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-bold text-sm text-[#243326] flex items-center gap-1.5">
                    <Droplets className="w-4 h-4 text-[#294B32]" />
                    Annual Dipping History (1-Year Cadence)
                  </h4>
                  <button
                    onClick={() => {
                      setCowForDipping(selectedCowForDetail);
                      setSelectedCowForDetail(null);
                    }}
                    className="text-[11px] font-bold text-[#B8772E] hover:underline cursor-pointer"
                  >
                    + Log New Annual Dip
                  </button>
                </div>

                {selectedCowForDetail.dippings.length === 0 ? (
                  <p className="text-[11px] text-[#868C7E] italic">No past dipping records logged.</p>
                ) : (
                  <div className="space-y-2">
                    {selectedCowForDetail.dippings.map((d) => (
                      <div key={d.id} className="p-2.5 rounded-lg bg-[#FAF7F0] border border-[#E7DFCD] flex items-center justify-between">
                        <div>
                          <span className="font-semibold text-xs text-[#2E3C31]">{fmtDate(d.date)}</span>
                          <span className="text-[11px] text-[#555A4E] ml-2">Chemical: {d.chemicalUsed}</span>
                          {d.notes && <p className="text-[10px] text-[#737869] mt-0.5">{d.notes}</p>}
                        </div>
                        <span className="text-[11px] font-mono-numbers text-[#666B5E]">
                          Next due: {fmtDate(d.nextDueDate)}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Vaccination History */}
              <div className="bg-white border border-[#DCD5C3] rounded-xl p-4 shadow-2xs">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-bold text-sm text-[#243326] flex items-center gap-1.5">
                    <Syringe className="w-4 h-4 text-[#B8772E]" />
                    Seasonal Vaccination History
                  </h4>
                  <button
                    onClick={() => {
                      setCowForVaccine(selectedCowForDetail);
                      setSelectedCowForDetail(null);
                    }}
                    className="text-[11px] font-bold text-[#B8772E] hover:underline cursor-pointer"
                  >
                    + Log Vaccine
                  </button>
                </div>

                {selectedCowForDetail.vaccinations.length === 0 ? (
                  <p className="text-[11px] text-[#868C7E] italic">No vaccinations logged for this cow.</p>
                ) : (
                  <div className="space-y-2">
                    {selectedCowForDetail.vaccinations.map((v) => (
                      <div key={v.id} className="p-2.5 rounded-lg bg-[#FAF7F0] border border-[#E7DFCD] flex items-center justify-between">
                        <div>
                          <span className="font-semibold text-xs text-[#2E3C31]">{v.medicationName}</span>
                          <span className="text-[11px] px-1.5 py-0.5 rounded bg-[#EDE7D6] text-[#4F4B3C] font-semibold ml-2">
                            {v.season} Season
                          </span>
                          <p className="text-[10px] text-[#737869] mt-0.5">
                            Given {fmtDate(v.date)} by {v.administeredBy} ({v.dosage})
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Close Button */}
              <div className="flex justify-end pt-2 border-t border-[#E8E1CE]">
                <button
                  type="button"
                  onClick={() => setSelectedCowForDetail(null)}
                  className="px-4 py-2 rounded-lg bg-[#2E3C31] text-white font-semibold cursor-pointer"
                >
                  Close Profile
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
