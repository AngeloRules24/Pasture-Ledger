import React, { useState } from 'react';
import { Syringe, Plus, Calendar, AlertCircle, CheckCircle, ShieldCheck } from 'lucide-react';
import { FarmMedication } from '../types/farm';
import { fmtDate, todayISO, getCurrentSeason } from '../utils/dateAndAge';

interface MedicationsModalProps {
  isOpen: boolean;
  medications: FarmMedication[];
  onClose: () => void;
  onAddMedication: (med: FarmMedication) => void;
}

export const MedicationsModal: React.FC<MedicationsModalProps> = ({
  isOpen,
  medications,
  onClose,
  onAddMedication
}) => {
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [name, setName] = useState('');
  const [category, setCategory] = useState<'Vaccine' | 'Dip' | 'Antibiotic' | 'Dewormer'>('Vaccine');
  const [targetSeason, setTargetSeason] = useState<'Spring' | 'Summer' | 'Autumn' | 'Winter'>('Autumn');
  const [batchNumber, setBatchNumber] = useState('');
  const [expiryDate, setExpiryDate] = useState('2027-12-31');
  const [description, setDescription] = useState('');

  if (!isOpen) return null;

  const currentSeason = getCurrentSeason();

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const newMed: FarmMedication = {
      id: `MED-${String(medications.length + 1).padStart(3, '0')}`,
      name: name.trim(),
      category,
      targetSeason,
      dateAdded: todayISO(),
      batchNumber: batchNumber.trim() || undefined,
      expiryDate: expiryDate || undefined,
      description: description.trim() || `${category} registered for ${targetSeason} season.`
    };

    onAddMedication(newMed);
    setIsAddingNew(false);
    setName('');
    setDescription('');
    setBatchNumber('');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:p-4 bg-black/50 backdrop-blur-xs overflow-y-auto">
      <div className="bg-[#FAF8F2] border-t sm:border border-[#D5CDBC] rounded-t-2xl sm:rounded-2xl w-full max-w-2xl p-4 sm:p-6 shadow-2xl my-0 sm:my-8 max-h-[92vh] flex flex-col">
        <div className="w-12 h-1.5 bg-[#D1C9B6] rounded-full mx-auto mb-2 sm:hidden shrink-0"></div>
        <div className="flex items-center justify-between pb-3 border-b border-[#E8E1CE] shrink-0">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="text-base sm:text-lg font-bold text-[#1E2620]">Farm Medications &amp; Seasonal Schedule</h3>
              <span className="text-[11px] sm:text-xs px-2 py-0.5 rounded bg-[#EDE7D6] text-[#69582A] font-bold">
                Current Season: {currentSeason}
              </span>
            </div>
            <p className="text-[11px] sm:text-xs text-[#636A5B]">
              Vaccination happens per season, only if a new medication is added to the system.
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-lg font-bold cursor-pointer p-1 min-h-[36px]"
          >
            ✕
          </button>
        </div>

        <div className="flex-1 overflow-y-auto my-3 sm:my-4 space-y-4">
          {/* Informational banner */}
          <div className="p-3 bg-[#F2EDE2] border border-[#DDD3BE] rounded-xl text-xs text-[#484435] flex items-start gap-2.5">
            <ShieldCheck className="w-4 h-4 text-[#294B32] shrink-0 mt-0.5" />
            <div>
              <span className="font-bold text-[#1F261F] block">Seasonal Vaccination Protocol</span>
              <span>
                Whenever you add a new vaccine or medication here, the system automatically checks your cattle herd and highlights animals due for their seasonal dose during that medication's target season.
              </span>
            </div>
          </div>

          {/* Form to add new medication */}
          {isAddingNew ? (
            <form onSubmit={handleSave} className="p-3.5 sm:p-4 bg-white border border-[#D5CDBC] rounded-xl space-y-3 text-xs">
              <h4 className="font-bold text-sm text-[#1E2620]">Add New Farm Medication / Vaccine</h4>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-[#4B5143] uppercase tracking-wider mb-1">
                    Medication / Vaccine Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Foot & Mouth Bivalent Vaccine"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full px-3 py-2 border border-[#D5CDBC] rounded-lg bg-[#FAF8F3] text-base sm:text-xs min-h-[42px]"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-[#4B5143] uppercase tracking-wider mb-1">
                    Category
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value as any)}
                    className="w-full px-3 py-2 border border-[#D5CDBC] rounded-lg bg-[#FAF8F3] font-semibold text-base sm:text-xs min-h-[42px]"
                  >
                    <option value="Vaccine">Vaccine (Seasonal Administration)</option>
                    <option value="Dip">Dip (Acaricide Immersion)</option>
                    <option value="Dewormer">Dewormer / Parasiticide</option>
                    <option value="Antibiotic">Antibiotic (Veterinary)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-[#4B5143] uppercase tracking-wider mb-1">
                    Target Season *
                  </label>
                  <select
                    value={targetSeason}
                    onChange={(e) => setTargetSeason(e.target.value as any)}
                    className="w-full px-3 py-2 border border-[#D5CDBC] rounded-lg bg-[#FAF8F3] font-semibold"
                  >
                    <option value="Autumn">Autumn Season</option>
                    <option value="Spring">Spring Season</option>
                    <option value="Summer">Summer Season</option>
                    <option value="Winter">Winter Season</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-[#4B5143] uppercase tracking-wider mb-1">
                    Batch Number
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. BATCH-2026-X4"
                    value={batchNumber}
                    onChange={(e) => setBatchNumber(e.target.value)}
                    className="w-full px-3 py-2 border border-[#D5CDBC] rounded-lg bg-[#FAF8F3]"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-[#4B5143] uppercase tracking-wider mb-1">
                    Expiry Date
                  </label>
                  <input
                    type="date"
                    value={expiryDate}
                    onChange={(e) => setExpiryDate(e.target.value)}
                    className="w-full px-3 py-2 border border-[#D5CDBC] rounded-lg bg-[#FAF8F3]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-[#4B5143] uppercase tracking-wider mb-1">
                  Usage Instructions &amp; Veterinary Notes
                </label>
                <textarea
                  rows={2}
                  placeholder="Target strains, dosage per head, storage temperature..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-3 py-2 border border-[#D5CDBC] rounded-lg bg-[#FAF8F3]"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAddingNew(false)}
                  className="px-3 py-1.5 rounded-lg border border-[#D5CDBC] text-[#4E4B3E] font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-lg bg-[#C28B38] text-[#1B1405] font-bold"
                >
                  Save &amp; Activate for Herd
                </button>
              </div>
            </form>
          ) : (
            <div className="flex justify-end">
              <button
                onClick={() => setIsAddingNew(true)}
                className="px-3.5 py-1.5 text-xs font-semibold rounded-lg bg-[#C28B38] text-[#1B1405] hover:bg-[#A9752A] transition-colors cursor-pointer flex items-center gap-1.5 shadow-xs"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>+ Register New Medication / Seasonal Vaccine</span>
              </button>
            </div>
          )}

          {/* Existing Medications List */}
          <div className="space-y-2.5">
            {medications.map((med) => {
              const isCurrentSeason = med.targetSeason.toLowerCase() === currentSeason.toLowerCase();
              return (
                <div
                  key={med.id}
                  className={`p-3.5 rounded-xl border transition-colors ${
                    isCurrentSeason
                      ? 'bg-white border-[#C28B38] shadow-xs'
                      : 'bg-white border-[#DCD5C3]'
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2">
                    <div>
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span className="font-bold text-xs sm:text-sm text-[#1E2620]">{med.name}</span>
                        <span className="text-[10px] px-2 py-0.5 rounded bg-[#EDE7D6] font-semibold text-[#484435]">
                          {med.category}
                        </span>
                        <span className={`text-[10px] px-2 py-0.5 rounded font-bold ${
                          isCurrentSeason ? 'bg-[#C28B38] text-white' : 'bg-[#E3EBE4] text-[#294B32]'
                        }`}>
                          {med.targetSeason} Season {isCurrentSeason ? '(Active Now)' : ''}
                        </span>
                      </div>
                      <p className="text-xs text-[#5D6456] mt-1 leading-relaxed">{med.description}</p>
                    </div>

                    <div className="text-left sm:text-right text-[11px] text-[#737869] shrink-0 font-mono-numbers flex sm:block items-center gap-3">
                      <div>Added: {fmtDate(med.dateAdded)}</div>
                      {med.expiryDate && <div>Exp: {fmtDate(med.expiryDate)}</div>}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="pt-3 border-t border-[#E8E1CE] flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-[#2E3C31] text-white font-semibold cursor-pointer"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
