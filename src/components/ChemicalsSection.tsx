import React, { useState } from 'react';
import { Plus, Search, AlertTriangle, ShieldAlert, Trash2, ArrowRight } from 'lucide-react';
import { Chemical, ChemicalAlternative } from '../types/farm';
import { fmtDate, todayISO } from '../utils/dateAndAge';

interface ChemicalsSectionProps {
  chemicals: Chemical[];
  onAddChemical: (chemical: Chemical) => void;
  onRemoveChemical: (id: string) => void;
  onAddAlternative: (chemicalId: string, alt: ChemicalAlternative) => void;
}

export const ChemicalsSection: React.FC<ChemicalsSectionProps> = ({
  chemicals,
  onAddChemical,
  onRemoveChemical,
  onAddAlternative
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [altModalChemId, setAltModalChemId] = useState<string | null>(null);

  // New chemical form
  const [name, setName] = useState('');
  const [expiration, setExpiration] = useState('2027-10-12');
  const [volume, setVolume] = useState('');
  const [effects, setEffects] = useState('');
  const [caution, setCaution] = useState('');

  // New alternative form
  const [altName, setAltName] = useState('');
  const [altNote, setAltNote] = useState('');

  const today = todayISO();

  const filteredChemicals = chemicals.filter((c) => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return true;
    return (
      c.id.toLowerCase().includes(q) ||
      c.name.toLowerCase().includes(q) ||
      c.effects.toLowerCase().includes(q) ||
      c.caution.toLowerCase().includes(q) ||
      c.alternatives.some((a) => a.name.toLowerCase().includes(q) || a.note.toLowerCase().includes(q))
    );
  });

  const handleSaveChemical = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !expiration) return;

    const newChem: Chemical = {
      id: `CHEM-${Date.now()}`,
      name: name.trim(),
      expiration,
      volume: volume.trim() || 'Unspecified volume',
      effects: effects.trim() || 'Standard farm chemical',
      caution: caution.trim() || 'Handle with standard PPE',
      alternatives: []
    };

    onAddChemical(newChem);
    setIsAddModalOpen(false);
    setName('');
    setVolume('');
    setEffects('');
    setCaution('');
  };

  const handleSaveAlternative = (e: React.FormEvent) => {
    e.preventDefault();
    if (!altModalChemId || !altName.trim()) return;

    onAddAlternative(altModalChemId, {
      name: altName.trim(),
      note: altNote.trim()
    });

    setAltModalChemId(null);
    setAltName('');
    setAltNote('');
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-lg sm:text-xl font-bold tracking-tight text-[#1E2620]">🧪 Agrochemicals &amp; Veterinary Medicines</h2>
          <p className="text-[11px] sm:text-xs text-[#5D6357]">
            Maintain active inventories of acaricides, dips, anthelmintics, antibiotics, with safety cautions and expiration monitoring.
          </p>
        </div>
        <button
          onClick={() => setIsAddModalOpen(true)}
          className="w-full sm:w-auto px-4 py-2.5 text-xs font-semibold rounded-lg bg-[#C28B38] text-[#1B1405] hover:bg-[#A9752A] transition-colors cursor-pointer flex items-center justify-center gap-1.5 shadow-xs whitespace-nowrap min-h-[42px]"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>+ Add Agrochemical</span>
        </button>
      </div>

      <div className="bg-white border border-[#D5CDBC] rounded-xl p-3 sm:p-3.5 shadow-2xs flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5">
        <div className="w-full sm:w-96 relative">
          <Search className="w-4 h-4 text-[#8C8675] absolute left-3 top-3" />
          <input
            type="text"
            placeholder="Search by chemical name, effect, or caution..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2.5 text-base sm:text-xs border border-[#D3CBB9] rounded-lg bg-[#FAF8F3] min-h-[42px]"
          />
        </div>
        <span className="text-xs text-[#636A5B] font-mono text-right">
          {filteredChemicals.length} items logged
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredChemicals.map((chem) => {
          const diffMs = new Date(chem.expiration + 'T00:00:00').getTime() - new Date(today + 'T00:00:00').getTime();
          const daysLeft = Math.floor(diffMs / (1000 * 60 * 60 * 24));
          const isExpired = daysLeft < 0;
          const isExpiringSoon = daysLeft >= 0 && daysLeft <= 30;

          return (
            <div
              key={chem.id}
              className={`p-4 rounded-xl border transition-colors flex flex-col justify-between ${
                isExpired
                  ? 'bg-[#FFF6F5] border-[#F2B5AC]'
                  : isExpiringSoon
                  ? 'bg-[#FFFDF4] border-[#EAD5A0]'
                  : 'bg-white border-[#D5CDBC]'
              }`}
            >
              <div>
                <div className="flex items-start justify-between gap-2 pb-2.5 border-b border-[#EDE7D6]">
                  <div>
                    <h3 className="font-bold text-sm text-[#1E2620]">{chem.name}</h3>
                    <div className="flex items-center gap-2 mt-1">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                        isExpired
                          ? 'bg-[#C84B31] text-white'
                          : isExpiringSoon
                          ? 'bg-[#C28B38] text-white'
                          : 'bg-[#E3EBE4] text-[#294B32]'
                      }`}>
                        {isExpired ? `EXPIRED (${fmtDate(chem.expiration)})` : isExpiringSoon ? `Expires in ${daysLeft}d` : `Valid to ${fmtDate(chem.expiration)}`}
                      </span>
                      {chem.volume && <span className="text-xs text-[#63685C]">• Volume: {chem.volume}</span>}
                    </div>
                  </div>
                  <button
                    onClick={() => onRemoveChemical(chem.id)}
                    className="p-1 text-[#A62F1E] hover:bg-[#FCE5E2] rounded cursor-pointer"
                    title="Remove Chemical"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="py-2.5 text-xs space-y-1.5">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-[#6D7365] block">Effects &amp; Usage:</span>
                    <p className="text-[#2C332B]">{chem.effects}</p>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-bold text-[#A62F1E] block">Safety Cautions &amp; PPE:</span>
                    <p className="text-[#69291D]">{chem.caution}</p>
                  </div>
                </div>

                {chem.alternatives.length > 0 && (
                  <div className="pt-2 border-t border-[#EDE7D6]">
                    <span className="text-[10px] uppercase font-bold text-[#4B5143] block mb-1">
                      Suggested Alternatives:
                    </span>
                    <div className="flex flex-wrap gap-1">
                      {chem.alternatives.map((alt, idx) => (
                        <span key={idx} className="text-[11px] px-2 py-0.5 rounded bg-[#EDE7D6] text-[#423E32]">
                          <strong>{alt.name}</strong> {alt.note ? `— ${alt.note}` : ''}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="mt-3 pt-2.5 border-t border-[#EDE7D6] flex justify-end">
                <button
                  onClick={() => setAltModalChemId(chem.id)}
                  className="text-xs font-semibold text-[#B8772E] hover:underline cursor-pointer"
                >
                  + Suggest Alternative Product
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal Add Chemical */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:p-4 bg-black/50 backdrop-blur-xs overflow-y-auto">
          <div className="bg-[#FAF8F2] border-t sm:border border-[#D5CDBC] rounded-t-2xl sm:rounded-2xl w-full max-w-md p-4 sm:p-6 shadow-2xl max-h-[92vh] overflow-y-auto my-0 sm:my-8 flex flex-col">
            <div className="w-12 h-1.5 bg-[#D1C9B6] rounded-full mx-auto mb-2 sm:hidden shrink-0"></div>
            <div className="flex items-center justify-between pb-2 border-b border-[#E8E1CE] shrink-0">
              <h3 className="text-base font-bold text-[#1E2620]">
                Add Agrochemical / Medicine
              </h3>
              <button
                type="button"
                onClick={() => setIsAddModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 font-bold p-1 cursor-pointer"
              >
                ✕
              </button>
            </div>
            <form onSubmit={handleSaveChemical} className="space-y-3 pt-3 text-xs">
              <div>
                <label className="block font-bold mb-1">Product Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Triatix 12.5% EC"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg bg-white text-base sm:text-xs min-h-[42px]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold mb-1">Expiration Date *</label>
                  <input
                    type="date"
                    required
                    value={expiration}
                    onChange={(e) => setExpiration(e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg bg-white text-base sm:text-xs min-h-[42px]"
                  />
                </div>
                <div>
                  <label className="block font-bold mb-1">Volume / Stock</label>
                  <input
                    type="text"
                    placeholder="e.g. 20 Litres"
                    value={volume}
                    onChange={(e) => setVolume(e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg bg-white text-base sm:text-xs min-h-[42px]"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold mb-1">Intended Effects</label>
                <textarea
                  rows={2}
                  placeholder="Acaricide immersion for tick eradication..."
                  value={effects}
                  onChange={(e) => setEffects(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg bg-white text-base sm:text-xs"
                />
              </div>

              <div>
                <label className="block font-bold mb-1">Hazards &amp; Caution</label>
                <textarea
                  rows={2}
                  placeholder="Wear respirator and gloves, toxic to equines..."
                  value={caution}
                  onChange={(e) => setCaution(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg bg-white text-base sm:text-xs"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2.5 rounded-lg border font-semibold min-h-[42px]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-lg bg-[#C28B38] text-[#1B1405] font-bold min-h-[42px]"
                >
                  Save Chemical
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Add Alternative */}
      {altModalChemId && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:p-4 bg-black/50 backdrop-blur-xs overflow-y-auto">
          <div className="bg-[#FAF8F2] border-t sm:border border-[#D5CDBC] rounded-t-2xl sm:rounded-2xl w-full max-w-sm p-4 sm:p-6 shadow-2xl max-h-[92vh] overflow-y-auto my-0 sm:my-8 flex flex-col">
            <div className="w-12 h-1.5 bg-[#D1C9B6] rounded-full mx-auto mb-2 sm:hidden shrink-0"></div>
            <div className="flex items-center justify-between pb-2 border-b border-[#E8E1CE] shrink-0">
              <h3 className="text-base font-bold text-[#1E2620]">
                Suggest Alternative Swap
              </h3>
              <button
                type="button"
                onClick={() => setAltModalChemId(null)}
                className="text-gray-400 hover:text-gray-600 font-bold p-1 cursor-pointer"
              >
                ✕
              </button>
            </div>
            <form onSubmit={handleSaveAlternative} className="space-y-3 pt-3 text-xs">
              <div>
                <label className="block font-bold mb-1">Alternative Product Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Bayticol Pour-on"
                  value={altName}
                  onChange={(e) => setAltName(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg bg-white text-base sm:text-xs min-h-[42px]"
                />
              </div>
              <div>
                <label className="block font-bold mb-1">Clinical Note / Justification</label>
                <input
                  type="text"
                  placeholder="e.g. Good pour-on substitute if plunge tank is being cleaned"
                  value={altNote}
                  onChange={(e) => setAltNote(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg bg-white text-base sm:text-xs min-h-[42px]"
                />
              </div>
              <div className="flex justify-end gap-2 pt-3 border-t">
                <button
                  type="button"
                  onClick={() => setAltModalChemId(null)}
                  className="px-4 py-2.5 rounded-lg border font-semibold min-h-[42px]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-lg bg-[#2E3C31] text-white font-bold min-h-[42px]"
                >
                  Save Alternative
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
