import React from 'react';
import { History, Tag, DollarSign, AlertTriangle } from 'lucide-react';
import { CattleRemovalLog } from '../types/farm';
import { fmtDate } from '../utils/dateAndAge';

interface CattleArchiveModalProps {
  isOpen: boolean;
  onClose: () => void;
  removals: CattleRemovalLog[];
}

export const CattleArchiveModal: React.FC<CattleArchiveModalProps> = ({
  isOpen,
  onClose,
  removals
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:p-4 bg-black/50 backdrop-blur-xs overflow-y-auto">
      <div className="bg-[#FAF8F2] border-t sm:border border-[#D5CDBC] rounded-t-2xl sm:rounded-2xl w-full max-w-3xl p-4 sm:p-6 shadow-2xl my-0 sm:my-8 max-h-[92vh] flex flex-col">
        <div className="w-12 h-1.5 bg-[#D1C9B6] rounded-full mx-auto mb-2 sm:hidden shrink-0"></div>
        <div className="flex items-center justify-between pb-3 border-b border-[#E8E1CE] shrink-0">
          <div>
            <h3 className="text-base sm:text-lg font-bold text-[#1E2620]">Past Cattle Removals &amp; Tag Replacement Log</h3>
            <p className="text-[11px] sm:text-xs text-[#636A5B]">
              Historical records of all cattle removed with verified reasons (Death, Sale, Illness, Lost Tag Replaced).
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-lg font-bold cursor-pointer p-1 min-h-[36px]"
          >
            ✕
          </button>
        </div>

        <div className="flex-1 overflow-y-auto my-3 sm:my-4 space-y-3">
          {removals.length === 0 ? (
            <p className="text-xs text-[#868C7E] italic text-center py-8">
              No cattle removals or tag replacements have been logged yet.
            </p>
          ) : (
            removals.map((item) => (
              <div
                key={item.id}
                className="bg-white border border-[#DCD5C3] rounded-xl p-3 sm:p-3.5 shadow-2xs space-y-2 text-xs"
              >
                <div className="flex flex-wrap items-center justify-between gap-1.5">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span className="font-mono-numbers font-bold text-xs sm:text-sm px-2 py-0.5 rounded bg-[#2E3C31] text-white">
                      Tag: {item.originalTag}
                    </span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase ${
                      item.reason === 'lost_tag_replaced'
                        ? 'bg-[#FFF8E6] text-[#915B17] border border-[#EAD5A8]'
                        : item.reason === 'sale'
                        ? 'bg-[#EAF2EC] text-[#25452C]'
                        : 'bg-[#FCE5E2] text-[#A62F1E]'
                    }`}>
                      Reason: {item.reason.replace(/_/g, ' ')}
                    </span>
                  </div>
                  <span className="text-[#6D7365] font-mono-numbers text-[11px] sm:text-xs">{fmtDate(item.date)}</span>
                </div>

                {item.reason === 'lost_tag_replaced' && item.newTagId && (
                  <div className="p-2.5 bg-[#FFF8E6] rounded-lg border border-[#FAD7A0] flex items-center gap-2 text-xs text-[#7E4C0F]">
                    <Tag className="w-4 h-4 text-[#C28B38]" />
                    <span>
                      <strong>Tag Replaced:</strong> Original Tag {item.originalTag} was retired. Assigned new active Tag: <strong>{item.newTagId}</strong>.
                    </span>
                  </div>
                )}

                {item.reason === 'sale' && (
                  <div className="flex items-center gap-4 text-xs text-[#2A372C]">
                    {item.salePrice && <span>Sale Amount: <strong>${item.salePrice.toLocaleString()}</strong></span>}
                    {item.buyer && <span>Buyer: <strong>{item.buyer}</strong></span>}
                  </div>
                )}

                {item.notes && (
                  <p className="text-[#555A4E] italic border-t border-[#F0EBE1] pt-1.5">
                    "{item.notes}"
                  </p>
                )}
              </div>
            ))
          )}
        </div>

        <div className="pt-3 border-t border-[#E8E1CE] flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-[#2E3C31] text-white font-semibold cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
