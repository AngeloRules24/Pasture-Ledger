import React, { useState, useMemo } from 'react';
import { 
  UserPlus, 
  Search, 
  Cake, 
  Calendar, 
  Clock, 
  FileSpreadsheet, 
  Download, 
  AlertCircle, 
  CheckCircle, 
  XCircle, 
  Phone, 
  MapPin, 
  Edit3, 
  Trash2,
  AlertTriangle
} from 'lucide-react';
import { Employee, AttendanceRecord } from '../types/farm';
import { fmtDate, todayISO, nowTime, checkBirthdayNotice, calculateAge } from '../utils/dateAndAge';

interface StaffSectionProps {
  employees: Employee[];
  onAddEmployee: (newEmployee: Employee) => void;
  onUpdateEmployee: (updatedEmployee: Employee) => void;
  onRemoveEmployee: (id: string) => void;
}

export const StaffSection: React.FC<StaffSectionProps> = ({
  employees,
  onAddEmployee,
  onUpdateEmployee,
  onRemoveEmployee
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);

  // Absence modal state (when marking absent, comment is strictly required)
  const [employeeForAbsence, setEmployeeForAbsence] = useState<Employee | null>(null);
  const [absenceReason, setAbsenceReason] = useState('');
  const [absenceError, setAbsenceError] = useState('');

  // Attendance Sheet Modal
  const [isAttendanceSheetOpen, setIsAttendanceSheetOpen] = useState(false);

  const today = todayISO();

  // Search filter
  const filteredEmployees = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return employees;
    return employees.filter(
      (e) =>
        e.name.toLowerCase().includes(q) ||
        e.idNumber.toLowerCase().includes(q) ||
        e.id.toLowerCase().includes(q) ||
        e.phone.toLowerCase().includes(q) ||
        (e.role && e.role.toLowerCase().includes(q))
    );
  }, [employees, searchQuery]);

  // Attendance quick handlers
  const handleCheckIn = (employee: Employee) => {
    let rec = employee.attendance.find((r) => r.date === today);
    let updatedAttendance: AttendanceRecord[];

    if (!rec) {
      rec = { date: today, status: 'Present', checkIn: nowTime() };
      updatedAttendance = [rec, ...employee.attendance];
    } else {
      updatedAttendance = employee.attendance.map((r) =>
        r.date === today ? { ...r, status: 'Present', checkIn: nowTime() } : r
      );
    }

    onUpdateEmployee({
      ...employee,
      attendance: updatedAttendance
    });
  };

  const handleCheckOut = (employee: Employee) => {
    let rec = employee.attendance.find((r) => r.date === today);
    let updatedAttendance: AttendanceRecord[];

    if (!rec) {
      rec = { date: today, status: 'Present', checkOut: nowTime() };
      updatedAttendance = [rec, ...employee.attendance];
    } else {
      updatedAttendance = employee.attendance.map((r) =>
        r.date === today ? { ...r, status: 'Present', checkOut: nowTime() } : r
      );
    }

    onUpdateEmployee({
      ...employee,
      attendance: updatedAttendance
    });
  };

  // Open mandatory absence modal
  const handleOpenAbsenceModal = (employee: Employee) => {
    const existingRec = employee.attendance.find((r) => r.date === today);
    setEmployeeForAbsence(employee);
    setAbsenceReason(existingRec?.absenceReason || '');
    setAbsenceError('');
  };

  // Save absence with mandatory comment
  const handleSaveAbsence = (e: React.FormEvent) => {
    e.preventDefault();
    if (!employeeForAbsence) return;

    const trimmedReason = absenceReason.trim();
    if (!trimmedReason) {
      setAbsenceError('Mandatory requirement: Please enter the comment/reason explaining why the employee is absent.');
      return;
    }

    const existingIndex = employeeForAbsence.attendance.findIndex((r) => r.date === today);
    let updatedAttendance: AttendanceRecord[];

    const newRecord: AttendanceRecord = {
      date: today,
      status: 'Absent',
      absenceReason: trimmedReason,
      checkIn: undefined,
      checkOut: undefined
    };

    if (existingIndex >= 0) {
      updatedAttendance = employeeForAbsence.attendance.map((r) =>
        r.date === today ? newRecord : r
      );
    } else {
      updatedAttendance = [newRecord, ...employeeForAbsence.attendance];
    }

    onUpdateEmployee({
      ...employeeForAbsence,
      attendance: updatedAttendance
    });

    setEmployeeForAbsence(null);
  };

  const handleMarkDayOff = (employee: Employee) => {
    const existingIndex = employee.attendance.findIndex((r) => r.date === today);
    const newRecord: AttendanceRecord = {
      date: today,
      status: 'Day Off',
      checkIn: undefined,
      checkOut: undefined,
      absenceReason: 'Scheduled roster day off'
    };

    const updatedAttendance =
      existingIndex >= 0
        ? employee.attendance.map((r) => (r.date === today ? newRecord : r))
        : [newRecord, ...employee.attendance];

    onUpdateEmployee({
      ...employee,
      attendance: updatedAttendance
    });
  };

  // Export attendance sheet as CSV
  const exportAttendanceCSV = () => {
    const rows: string[][] = [
      ['Employee Name', 'ID Number', 'System ID', 'Date', 'Status', 'Check In', 'Check Out', 'Absence Reason / Notes']
    ];

    employees.forEach((emp) => {
      [...emp.attendance]
        .sort((a, b) => b.date.localeCompare(a.date))
        .forEach((r) => {
          rows.push([
            emp.name,
            emp.idNumber,
            emp.id,
            r.date,
            r.status,
            r.checkIn || '',
            r.checkOut || '',
            r.absenceReason || ''
          ]);
        });
    });

    const csvContent = rows
      .map((row) =>
        row
          .map((cell) => {
            const v = (cell ?? '').toString();
            return /[",\n]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v;
          })
          .join(',')
      )
      .join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `pastureledger-attendance-${today}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // ================= ADD / EDIT EMPLOYEE FORM =================
  const [formName, setFormName] = useState('');
  const [formIdType, setFormIdType] = useState<'rsa_id' | 'passport'>('rsa_id');
  const [formIdNumber, setFormIdNumber] = useState('');
  const [formBirthdate, setFormBirthdate] = useState('1995-05-15');
  const [formPhone, setFormPhone] = useState('');
  const [formRole, setFormRole] = useState('');
  const [formAddress, setFormAddress] = useState('');
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  const handleOpenAddModal = () => {
    setEditingEmployee(null);
    setFormName('');
    setFormIdType('rsa_id');
    setFormIdNumber('');
    setFormBirthdate('1995-05-15');
    setFormPhone('');
    setFormRole('');
    setFormAddress('');
    setFormErrors({});
    setIsAddModalOpen(true);
  };

  const handleOpenEditModal = (emp: Employee) => {
    setEditingEmployee(emp);
    setFormName(emp.name);
    // Determine if SA ID (13 digits) or passport
    const cleanId = emp.idNumber.replace(/[\s-]/g, '');
    const determinedType = emp.idType || (/^\d{13}$/.test(cleanId) ? 'rsa_id' : 'passport');
    setFormIdType(determinedType);
    setFormIdNumber(emp.idNumber);
    setFormBirthdate(emp.birthdate);
    setFormPhone(emp.phone);
    setFormRole(emp.role || '');
    setFormAddress(emp.address || '');
    setFormErrors({});
    setIsAddModalOpen(true);
  };

  const handleSaveEmployeeForm = (e: React.FormEvent) => {
    e.preventDefault();
    const errors: Record<string, string> = {};

    if (!formName.trim()) errors.name = 'Full name is required';
    
    // Validate ID based on selected identification type
    const trimmedId = formIdNumber.trim();
    if (!trimmedId) {
      errors.idNumber = formIdType === 'rsa_id' 
        ? 'South African 13-digit ID number is mandatory' 
        : 'Passport number is mandatory';
    } else if (formIdType === 'rsa_id') {
      const cleanDigits = trimmedId.replace(/[\s-]/g, '');
      if (!/^\d+$/.test(cleanDigits)) {
        errors.idNumber = 'South African ID must contain numbers only';
      } else if (cleanDigits.length !== 13) {
        errors.idNumber = `South African ID must be exactly 13 digits (you entered ${cleanDigits.length} digits)`;
      }
    } else {
      // Passport validation
      if (trimmedId.length < 4) {
        errors.idNumber = 'Please enter a valid passport number (min 4 characters)';
      }
    }

    if (!formBirthdate) errors.birthdate = 'Birthdate is mandatory';
    if (!formPhone.trim()) errors.phone = 'Phone number is required';

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    const cleanedIdNumber = formIdType === 'rsa_id' 
      ? formIdNumber.trim().replace(/[\s-]/g, '') 
      : formIdNumber.trim().toUpperCase();

    if (editingEmployee) {
      const updated: Employee = {
        ...editingEmployee,
        name: formName.trim(),
        idType: formIdType,
        idNumber: cleanedIdNumber,
        birthdate: formBirthdate,
        phone: formPhone.trim(),
        role: formRole.trim() || undefined,
        address: formAddress.trim() || undefined
      };
      onUpdateEmployee(updated);
    } else {
      const newEmp: Employee = {
        id: `EMP-${String(employees.length + 1).padStart(4, '0')}`,
        name: formName.trim(),
        idType: formIdType,
        idNumber: cleanedIdNumber,
        birthdate: formBirthdate,
        phone: formPhone.trim(),
        role: formRole.trim() || undefined,
        address: formAddress.trim() || undefined,
        attendance: []
      };
      onAddEmployee(newEmp);
    }

    setIsAddModalOpen(false);
  };

  return (
    <div className="space-y-5">
      {/* Top Title and Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-lg sm:text-xl font-bold tracking-tight text-[#1E2620]">🧑‍🌾 Farm Staff &amp; Attendance Register</h2>
          <p className="text-[11px] sm:text-xs text-[#5D6357]">
            Staff directory with ID numbers, birthdates, birthday notices, and attendance register with mandatory absence explanations.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:flex items-center gap-2 w-full sm:w-auto">
          <button
            onClick={() => setIsAttendanceSheetOpen(true)}
            className="px-3 py-2 text-xs font-semibold rounded-lg bg-[#EAE4D5] text-[#363428] hover:bg-[#DCD5C4] transition-colors cursor-pointer flex items-center justify-center gap-1.5 min-h-[40px]"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-[#2E3C31]" />
            <span>Attendance Sheet &amp; Export</span>
          </button>
          <button
            onClick={handleOpenAddModal}
            className="px-3.5 py-2 text-xs font-bold rounded-lg bg-[#2E3C31] text-[#EFEAE1] hover:bg-[#3D4F41] transition-colors cursor-pointer flex items-center justify-center gap-1.5 shadow-xs whitespace-nowrap min-h-[40px]"
          >
            <UserPlus className="w-3.5 h-3.5" />
            <span>+ Add Staff Member</span>
          </button>
        </div>
      </div>

      {/* Search and stats bar */}
      <div className="bg-white border border-[#D5CDBC] rounded-xl p-3 sm:p-3.5 shadow-2xs flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="w-full sm:w-96 relative">
          <Search className="w-4 h-4 text-[#8C8675] absolute left-3 top-3" />
          <input
            type="text"
            placeholder="Search by name, ID number, role, or phone..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2.5 text-base sm:text-xs border border-[#D3CBB9] rounded-lg bg-[#FAF8F3] text-[#1E231F] focus:outline-none focus:border-[#2E3C31] min-h-[42px]"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2 sm:gap-3 text-xs text-[#636A5B] w-full sm:w-auto justify-between sm:justify-end">
          <span>Total: <strong>{employees.length}</strong></span>
          <span>•</span>
          <span>
            Present: <strong className="text-[#294B32]">{employees.filter((e) => e.attendance.find((r) => r.date === today && r.status === 'Present')).length}</strong>
          </span>
          <span>•</span>
          <span>
            Absent: <strong className="text-[#A62F1E]">{employees.filter((e) => e.attendance.find((r) => r.date === today && (r.status === 'Absent' || r.status === 'Day Off'))).length}</strong>
          </span>
        </div>
      </div>

      {/* Staff Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredEmployees.map((emp) => {
          const bdayNotice = checkBirthdayNotice(emp.birthdate, 14);
          const ageInfo = calculateAge(emp.birthdate);
          const todayRecord = emp.attendance.find((r) => r.date === today);

          return (
            <div
              key={emp.id}
              className="bg-white border border-[#D5CDBC] rounded-xl p-4 shadow-2xs hover:border-[#8E9B82] transition-colors flex flex-col justify-between"
            >
              <div>
                {/* Birthday Notice Banner on card if active */}
                {bdayNotice && (
                  <div className={`mb-3 p-2.5 rounded-lg flex items-center justify-between text-xs ${
                    bdayNotice.isToday
                      ? 'bg-[#FDF4E7] border border-[#F2D09E] text-[#8C4E0B]'
                      : 'bg-[#F9F7EE] border border-[#E8DEC7] text-[#69582A]'
                  }`}>
                    <div className="flex items-center gap-2">
                      <Cake className="w-4 h-4 text-[#C28B38]" />
                      <span className="font-bold">
                        {bdayNotice.isToday ? `🎂 Birthday Today! Turning ${bdayNotice.turningAge} years old!` : `Upcoming Birthday in ${bdayNotice.daysUntil} days (${bdayNotice.dateStr})`}
                      </span>
                    </div>
                    <span className="text-[11px] font-mono font-semibold">{emp.birthdate}</span>
                  </div>
                )}

                {/* Profile header */}
                <div className="flex items-start justify-between gap-3 pb-3 border-b border-[#EDE7D6]">
                  <div className="flex items-start gap-3">
                    <div className="w-11 h-11 rounded-full bg-[#37453A] text-white flex items-center justify-center font-bold text-base shrink-0">
                      {emp.name.slice(0, 1).toUpperCase()}
                    </div>
                    <div>
                      <h3 className="font-bold text-base text-[#1E2620]">{emp.name}</h3>
                      <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                        <span className="text-[11px] font-mono-numbers px-1.5 py-0.5 rounded bg-[#EDE7D6] text-[#474335] font-bold">
                          {emp.idType === 'passport' ? '🛂 Passport: ' : '🇿🇦 SA ID: '}{emp.idNumber}
                        </span>
                        <span className="text-[11px] text-[#63685C]">• {emp.id}</span>
                        {emp.role && (
                          <span className="text-[11px] font-medium text-[#294B32]">
                            • {emp.role}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleOpenEditModal(emp)}
                      className="p-1.5 text-xs text-[#52574A] hover:bg-[#F2EFE6] rounded-md transition-colors cursor-pointer"
                      title="Edit Staff Member"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => onRemoveEmployee(emp.id)}
                      className="p-1.5 text-xs text-[#A62F1E] hover:bg-[#FCE5E2] rounded-md transition-colors cursor-pointer"
                      title="Remove Staff"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Staff Detail Grid */}
                <div className="grid grid-cols-2 gap-2.5 py-3 text-xs border-b border-[#EDE7D6]">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-[#73796A] block">Birthdate &amp; Age</span>
                    <span className="font-semibold text-[#1F2721]">
                      {fmtDate(emp.birthdate)} ({ageInfo.years} yrs old)
                    </span>
                  </div>

                  <div>
                    <span className="text-[10px] uppercase font-bold text-[#73796A] block">Phone Number</span>
                    <span className="font-semibold text-[#1F2721] flex items-center gap-1">
                      <Phone className="w-3 h-3 text-[#73796A]" /> {emp.phone}
                    </span>
                  </div>

                  <div>
                    <span className="text-[10px] uppercase font-bold text-[#73796A] block">Today's Attendance</span>
                    <div className="mt-0.5">
                      {todayRecord ? (
                        todayRecord.status === 'Present' ? (
                          <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-[#E3EBE4] text-[#294B32]">
                            Present (In: {todayRecord.checkIn || '—'} / Out: {todayRecord.checkOut || '—'})
                          </span>
                        ) : todayRecord.status === 'Absent' ? (
                          <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-[#FCE5E2] text-[#A62F1E]">
                            Absent (Reason logged)
                          </span>
                        ) : (
                          <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-[#EDE7D6] text-[#69582A]">
                            Day Off
                          </span>
                        )
                      ) : (
                        <span className="text-[11px] text-[#868C7E] italic">Not marked yet today</span>
                      )}
                    </div>
                  </div>

                  <div>
                    <span className="text-[10px] uppercase font-bold text-[#73796A] block">Residential Address</span>
                    <span className="text-[11px] text-[#555A4E] truncate block">
                      {emp.address || 'Farm Compound'}
                    </span>
                  </div>
                </div>

                {/* Show Recorded Reason if Absent */}
                {todayRecord && todayRecord.status === 'Absent' && (
                  <div className="mt-2.5 p-2.5 bg-[#FFF2F0] border border-[#FAD0CB] rounded-lg text-xs">
                    <div className="flex items-center gap-1.5 font-bold text-[#A62F1E] text-[11px] mb-1">
                      <AlertTriangle className="w-3.5 h-3.5" />
                      <span>Absence Explanation (Mandatory Comment):</span>
                    </div>
                    <p className="text-[#6B2418] italic">"{todayRecord.absenceReason}"</p>
                  </div>
                )}
              </div>

              {/* Attendance Marking Controls */}
              <div className="mt-3 pt-3 border-t border-[#EDE7D6] flex flex-wrap items-center justify-between gap-2">
                <div className="grid grid-cols-2 sm:flex sm:items-center gap-1.5 w-full sm:w-auto">
                  <button
                    onClick={() => handleCheckIn(emp)}
                    className="px-2.5 py-1.5 text-xs font-semibold rounded bg-[#EAF2EC] text-[#25452C] hover:bg-[#D5E6D8] transition-colors cursor-pointer flex items-center justify-center gap-1 min-h-[36px]"
                  >
                    <Clock className="w-3.5 h-3.5 text-[#25452C]" />
                    <span>Check In</span>
                  </button>
                  <button
                    onClick={() => handleCheckOut(emp)}
                    className="px-2.5 py-1.5 text-xs font-semibold rounded bg-[#F3EFE4] text-[#4F4B3C] hover:bg-[#E5DEC9] transition-colors cursor-pointer flex items-center justify-center gap-1 min-h-[36px]"
                  >
                    <span>Check Out</span>
                  </button>
                </div>

                <div className="grid grid-cols-2 sm:flex sm:items-center gap-1.5 w-full sm:w-auto">
                  <button
                    onClick={() => handleOpenAbsenceModal(emp)}
                    className="px-2.5 py-1.5 text-xs font-semibold rounded bg-[#FCE5E2] text-[#A62F1E] hover:bg-[#F9D0CB] transition-colors cursor-pointer flex items-center justify-center gap-1 min-h-[36px]"
                    title="Mark Absent with Mandatory Reason"
                  >
                    <XCircle className="w-3.5 h-3.5" />
                    <span>Mark Absent</span>
                  </button>
                  <button
                    onClick={() => handleMarkDayOff(emp)}
                    className="px-2.5 py-1.5 text-xs font-medium rounded text-[#63685C] hover:bg-[#F0ECE1] transition-colors cursor-pointer text-center justify-center min-h-[36px]"
                  >
                    Day Off
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* ================= MODAL: MARK ABSENT (MANDATORY COMMENT REQUIRED) ================= */}
      {employeeForAbsence && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:p-4 bg-black/50 backdrop-blur-xs overflow-y-auto">
          <div className="bg-[#FAF8F2] border-t sm:border border-[#D5CDBC] rounded-t-2xl sm:rounded-2xl w-full max-w-md p-4 sm:p-6 shadow-2xl max-h-[92vh] flex flex-col">
            <div className="w-12 h-1.5 bg-[#D1C9B6] rounded-full mx-auto mb-2 sm:hidden shrink-0"></div>
            <div className="flex items-center justify-between pb-3 border-b border-[#E8E1CE] shrink-0">
              <div>
                <h3 className="text-base font-bold text-[#1E2620]">
                  Mark Absent — {employeeForAbsence.name}
                </h3>
                <p className="text-[11px] sm:text-xs text-[#636A5B]">
                  ID: {employeeForAbsence.idNumber} · Date: {today}
                </p>
              </div>
              <button
                onClick={() => setEmployeeForAbsence(null)}
                className="text-gray-400 hover:text-gray-600 text-lg font-bold cursor-pointer p-1 min-h-[36px]"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveAbsence} className="flex-1 overflow-y-auto space-y-3.5 pt-3 pb-1 text-xs pr-1">
              <div className="p-3 bg-[#FFF5F2] border border-[#FAD7D0] rounded-xl text-xs text-[#822416] space-y-1">
                <span className="font-bold flex items-center gap-1">
                  <AlertTriangle className="w-3.5 h-3.5" /> Mandatory Absence Protocol
                </span>
                <p>
                  As per farm management policy, when marking an employee absent in the register, a valid comment explaining the reason for absence is mandatory.
                </p>
              </div>

              {absenceError && (
                <div className="p-2.5 bg-[#FCE5E2] border border-[#F8B8B0] rounded-lg text-[#9B2B1B] font-semibold text-xs">
                  {absenceError}
                </div>
              )}

              <div>
                <label className="block text-[11px] font-bold text-[#4B5143] uppercase tracking-wider mb-1">
                  Reason / Comment for Absence * (Mandatory)
                </label>
                <textarea
                  rows={3}
                  required
                  placeholder="e.g. Severe influenza with doctor certificate, family bereavement emergency, impassable flood roads, unexcused absence..."
                  value={absenceReason}
                  onChange={(e) => setAbsenceReason(e.target.value)}
                  className="w-full px-3 py-2 border-2 border-[#C84B31] rounded-lg bg-white text-base sm:text-xs font-medium focus:outline-none focus:border-[#8E2815]"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#E8E1CE] shrink-0 mt-2">
                <button
                  type="button"
                  onClick={() => setEmployeeForAbsence(null)}
                  className="px-4 py-2.5 rounded-lg border border-[#D5CDBC] text-[#4E4B3E] font-semibold cursor-pointer min-h-[44px]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-lg bg-[#C84B31] text-white font-bold cursor-pointer shadow-xs hover:bg-[#A93820] min-h-[44px]"
                >
                  Confirm Absence in Register
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= MODAL: ADD / EDIT EMPLOYEE ================= */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:p-4 bg-black/50 backdrop-blur-xs overflow-y-auto">
          <div className="bg-[#FAF8F2] border-t sm:border border-[#D5CDBC] rounded-t-2xl sm:rounded-2xl w-full max-w-lg p-4 sm:p-6 shadow-2xl max-h-[92vh] overflow-y-auto my-0 sm:my-8 flex flex-col">
            <div className="w-12 h-1.5 bg-[#D1C9B6] rounded-full mx-auto mb-2 sm:hidden shrink-0"></div>
            <div className="flex items-center justify-between pb-3 border-b border-[#E8E1CE] shrink-0">
              <div>
                <h3 className="text-base sm:text-lg font-bold text-[#1E2620]">
                  {editingEmployee ? 'Edit Staff Member' : 'Add New Staff Member'}
                </h3>
                <p className="text-[11px] sm:text-xs text-[#636A5B]">
                  ID Number and Birthdate are required to track staff identity and birthday notices.
                </p>
              </div>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 text-lg font-bold cursor-pointer p-1 min-h-[36px]"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveEmployeeForm} className="space-y-3.5 pt-4 text-xs">
              <div>
                <label className="block text-[11px] font-bold text-[#4B5143] uppercase tracking-wider mb-1">
                  Full Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Samuel Mokoena"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  className="w-full px-3 py-2 border border-[#D5CDBC] rounded-lg bg-white text-sm font-semibold"
                />
                {formErrors.name && <p className="text-[#C84B31] text-[11px] mt-1 font-semibold">{formErrors.name}</p>}
              </div>

              {/* Identification Document Selection */}
              <div className="bg-[#EFEAE0] p-3 rounded-xl border border-[#D5CDBC] space-y-2">
                <label className="block text-[11px] font-bold text-[#3B4235] uppercase tracking-wider">
                  Select Form of Identification *
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setFormIdType('rsa_id');
                      setFormErrors((prev) => ({ ...prev, idNumber: '' }));
                    }}
                    className={`py-2 px-3 rounded-lg text-xs font-bold transition-all cursor-pointer text-center flex items-center justify-center gap-1.5 ${
                      formIdType === 'rsa_id'
                        ? 'bg-[#2E3C31] text-white shadow-xs'
                        : 'bg-white border border-[#D5CDBC] text-[#4E4B3E] hover:bg-[#F5F2EA]'
                    }`}
                  >
                    <span>🇿🇦</span>
                    <span>SA ID (13 Digits)</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setFormIdType('passport');
                      setFormErrors((prev) => ({ ...prev, idNumber: '' }));
                    }}
                    className={`py-2 px-3 rounded-lg text-xs font-bold transition-all cursor-pointer text-center flex items-center justify-center gap-1.5 ${
                      formIdType === 'passport'
                        ? 'bg-[#2E3C31] text-white shadow-xs'
                        : 'bg-white border border-[#D5CDBC] text-[#4E4B3E] hover:bg-[#F5F2EA]'
                    }`}
                  >
                    <span>🛂</span>
                    <span>Passport Number</span>
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-[11px] font-bold text-[#4B5143] uppercase tracking-wider">
                      {formIdType === 'rsa_id' ? 'SA ID Number (13 Digits) *' : 'Passport Number *'}
                    </label>
                    {formIdType === 'rsa_id' && (
                      <span className="text-[10px] font-mono text-[#6A7061]">
                        {formIdNumber.replace(/[\s-]/g, '').length}/13 digits
                      </span>
                    )}
                  </div>
                  <input
                    type="text"
                    required
                    maxLength={formIdType === 'rsa_id' ? 15 : 25}
                    placeholder={formIdType === 'rsa_id' ? 'e.g. 9403155123087 (13 digits)' : 'e.g. A12345678 or PA-992144'}
                    value={formIdNumber}
                    onChange={(e) => {
                      const val = e.target.value;
                      setFormIdNumber(val);
                      // Auto-extract birthdate if full 13-digit SA ID
                      if (formIdType === 'rsa_id') {
                        const clean = val.replace(/[\s-]/g, '');
                        if (clean.length === 13 && /^\d{13}$/.test(clean)) {
                          const yy = parseInt(clean.slice(0, 2), 10);
                          const mm = clean.slice(2, 4);
                          const dd = clean.slice(4, 6);
                          const fullYear = yy <= 26 ? 2000 + yy : 1900 + yy;
                          const parsedBday = `${fullYear}-${mm}-${dd}`;
                          if (!isNaN(Date.parse(parsedBday))) {
                            setFormBirthdate(parsedBday);
                          }
                        }
                      }
                    }}
                    className="w-full px-3 py-2 border border-[#D5CDBC] rounded-lg bg-white font-mono-numbers font-semibold"
                  />
                  <p className="text-[10px] text-[#696F61] mt-1">
                    {formIdType === 'rsa_id'
                      ? 'Prompt: Please enter the 13-digit South African ID number.'
                      : 'Prompt: Please enter the official international passport number.'}
                  </p>
                  {formErrors.idNumber && <p className="text-[#C84B31] text-[11px] mt-1 font-semibold">{formErrors.idNumber}</p>}
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-[#4B5143] uppercase tracking-wider mb-1">
                    Birthdate * (Mandatory for Notices)
                  </label>
                  <input
                    type="date"
                    required
                    value={formBirthdate}
                    onChange={(e) => setFormBirthdate(e.target.value)}
                    className="w-full px-3 py-2 border border-[#D5CDBC] rounded-lg bg-white font-semibold"
                  />
                  {formErrors.birthdate && <p className="text-[#C84B31] text-[11px] mt-1 font-semibold">{formErrors.birthdate}</p>}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-[#4B5143] uppercase tracking-wider mb-1">
                    Phone Number *
                  </label>
                  <input
                    type="tel"
                    required
                    placeholder="+27 72 000 0000"
                    value={formPhone}
                    onChange={(e) => setFormPhone(e.target.value)}
                    className="w-full px-3 py-2 border border-[#D5CDBC] rounded-lg bg-white"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-[#4B5143] uppercase tracking-wider mb-1">
                    Role / Position
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Herd Manager, Milker, Vet Assistant"
                    value={formRole}
                    onChange={(e) => setFormRole(e.target.value)}
                    className="w-full px-3 py-2 border border-[#D5CDBC] rounded-lg bg-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-[#4B5143] uppercase tracking-wider mb-1">
                  Compound / Residential Address
                </label>
                <input
                  type="text"
                  placeholder="e.g. Cottage #2, Farm Compound"
                  value={formAddress}
                  onChange={(e) => setFormAddress(e.target.value)}
                  className="w-full px-3 py-2 border border-[#D5CDBC] rounded-lg bg-white"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#E8E1CE]">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 rounded-lg border border-[#D5CDBC] text-[#4E4B3E] font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-lg bg-[#2E3C31] text-white font-bold cursor-pointer"
                >
                  {editingEmployee ? 'Save Changes' : 'Register Staff Member'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= MODAL: ATTENDANCE SHEET & CSV EXPORT ================= */}
      {isAttendanceSheetOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:p-4 bg-black/50 backdrop-blur-xs overflow-y-auto">
          <div className="bg-[#FAF8F2] border-t sm:border border-[#D5CDBC] rounded-t-2xl sm:rounded-2xl w-full max-w-4xl p-4 sm:p-6 shadow-2xl my-0 sm:my-8 max-h-[92vh] flex flex-col">
            <div className="w-12 h-1.5 bg-[#D1C9B6] rounded-full mx-auto mb-2 sm:hidden shrink-0"></div>
            <div className="flex items-center justify-between pb-3 border-b border-[#E8E1CE] shrink-0">
              <div>
                <h3 className="text-base sm:text-lg font-bold text-[#1E2620]">Comprehensive Farm Attendance Register</h3>
                <p className="text-[11px] sm:text-xs text-[#636A5B]">
                  Historical register showing in/out times and logged absence reasons.
                </p>
              </div>
              <button
                onClick={() => setIsAttendanceSheetOpen(false)}
                className="text-gray-400 hover:text-gray-600 text-lg font-bold cursor-pointer p-1 min-h-[36px]"
              >
                ✕
              </button>
            </div>

            <div className="flex-1 overflow-y-auto overflow-x-auto my-3 sm:my-4 border border-[#DDD5C0] rounded-xl bg-white">
              <table className="w-full min-w-[580px] text-left text-xs border-collapse">
                <thead className="bg-[#F0ECE1] sticky top-0 border-b border-[#DCD5C3] text-[11px] font-bold text-[#4B5143] uppercase tracking-wider">
                  <tr>
                    <th className="p-3">Staff Member</th>
                    <th className="p-3">ID Number</th>
                    <th className="p-3">Date</th>
                    <th className="p-3">Status</th>
                    <th className="p-3">Times</th>
                    <th className="p-3">Absence Reason / Notes</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#EFEAE0]">
                  {employees.flatMap((emp) =>
                    emp.attendance.map((r, idx) => (
                      <tr key={`${emp.id}-${r.date}-${idx}`} className="hover:bg-[#FAF8F3]">
                        <td className="p-3 font-semibold text-[#1E241F]">{emp.name}</td>
                        <td className="p-3 font-mono-numbers text-[#61675A]">{emp.idNumber}</td>
                        <td className="p-3 font-mono-numbers">{fmtDate(r.date)}</td>
                        <td className="p-3">
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                            r.status === 'Present'
                              ? 'bg-[#E3EBE4] text-[#294B32]'
                              : r.status === 'Absent'
                              ? 'bg-[#FCE5E2] text-[#A62F1E]'
                              : 'bg-[#EDE7D6] text-[#69582A]'
                          }`}>
                            {r.status}
                          </span>
                        </td>
                        <td className="p-3 font-mono-numbers text-[#61675A]">
                          {r.status === 'Present' ? `In ${r.checkIn || '—'} · Out ${r.checkOut || '—'}` : '—'}
                        </td>
                        <td className="p-3 text-[#52574A]">
                          {r.absenceReason ? (
                            <span className="italic text-[#8C3426] font-medium">"{r.absenceReason}"</span>
                          ) : (
                            '—'
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-3 border-t border-[#E8E1CE] shrink-0">
              <span className="text-[11px] sm:text-xs text-[#636A5B]">
                Exports format suitable for payroll and compliance reporting.
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setIsAttendanceSheetOpen(false)}
                  className="flex-1 sm:flex-initial px-4 py-2.5 rounded-lg border border-[#D5CDBC] text-[#4E4B3E] font-semibold cursor-pointer min-h-[42px]"
                >
                  Close
                </button>
                <button
                  onClick={exportAttendanceCSV}
                  className="flex-1 sm:flex-initial px-4 py-2.5 rounded-lg bg-[#C28B38] text-[#1B1405] hover:bg-[#A9752A] font-bold transition-colors cursor-pointer flex items-center justify-center gap-1.5 shadow-xs min-h-[42px]"
                >
                  <Download className="w-4 h-4" />
                  <span>Download CSV</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
