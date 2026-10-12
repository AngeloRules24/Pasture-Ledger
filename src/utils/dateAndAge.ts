/**
 * Date and Age calculation utilities
 */

export function todayISO(): string {
  // Respect current environment or fallback to local date
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function nowTime(): string {
  const d = new Date();
  return d.toTimeString().slice(0, 5);
}

export function currentYear(): number {
  return new Date().getFullYear();
}

export function fmtDate(iso?: string): string {
  if (!iso) return '—';
  try {
    const d = new Date(iso + 'T00:00:00');
    if (isNaN(d.getTime())) return iso;
    return d.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  } catch {
    return iso;
  }
}

export interface AgeCalculation {
  years: number;
  months: number;
  totalMonths: number;
  formatted: string;
  isYoungStock: boolean; // Under 2 years (24 months)
}

export function calculateAge(birthdate?: string, refDateStr?: string): AgeCalculation {
  if (!birthdate) {
    return { years: 0, months: 0, totalMonths: 0, formatted: '—', isYoungStock: false };
  }

  const birth = new Date(birthdate + 'T00:00:00');
  const ref = refDateStr ? new Date(refDateStr + 'T00:00:00') : new Date();

  if (isNaN(birth.getTime())) {
    return { years: 0, months: 0, totalMonths: 0, formatted: '—', isYoungStock: false };
  }

  let years = ref.getFullYear() - birth.getFullYear();
  let months = ref.getMonth() - birth.getMonth();
  const days = ref.getDate() - birth.getDate();

  if (days < 0) {
    months--;
  }

  if (months < 0) {
    years--;
    months += 12;
  }

  const totalMonths = years * 12 + months;
  const isYoungStock = years < 2; // young stock is < 2 years

  let formatted = '';
  if (years === 0) {
    if (months === 0) {
      const diffTime = Math.abs(ref.getTime() - birth.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      formatted = `${diffDays} days old`;
    } else {
      formatted = `${months} ${months === 1 ? 'month' : 'months'}`;
    }
  } else if (months === 0) {
    formatted = `${years} ${years === 1 ? 'year' : 'years'}`;
  } else {
    formatted = `${years}y ${months}m`;
  }

  return {
    years,
    months,
    totalMonths,
    formatted,
    isYoungStock
  };
}

export interface BirthdayNotice {
  isToday: boolean;
  isUpcoming: boolean;
  daysUntil: number;
  turningAge: number;
  dateStr: string;
}

export function checkBirthdayNotice(birthdate?: string, daysAhead = 14): BirthdayNotice | null {
  if (!birthdate) return null;
  const parts = birthdate.split('-');
  if (parts.length < 3) return null;

  const birthMonth = parseInt(parts[1], 10) - 1;
  const birthDay = parseInt(parts[2], 10);
  const birthYear = parseInt(parts[0], 10);

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const currentYr = today.getFullYear();

  // Birthday this year
  let bdayThisYear = new Date(currentYr, birthMonth, birthDay);
  bdayThisYear.setHours(0, 0, 0, 0);

  // If already passed earlier this year, check next year
  if (bdayThisYear.getTime() < today.getTime()) {
    const isToday = bdayThisYear.getTime() === today.getTime();
    if (isToday) {
      return {
        isToday: true,
        isUpcoming: false,
        daysUntil: 0,
        turningAge: currentYr - birthYear,
        dateStr: `${bdayThisYear.getDate()} ${bdayThisYear.toLocaleString('en-US', { month: 'short' })}`
      };
    }
    // Check if within negative hours (same day check)
    const diffMs = today.getTime() - bdayThisYear.getTime();
    if (diffMs < 24 * 3600 * 1000) {
      return {
        isToday: true,
        isUpcoming: false,
        daysUntil: 0,
        turningAge: currentYr - birthYear,
        dateStr: `${bdayThisYear.getDate()} ${bdayThisYear.toLocaleString('en-US', { month: 'short' })}`
      };
    }
    // It already passed this year, let's look at next year
    bdayThisYear = new Date(currentYr + 1, birthMonth, birthDay);
  }

  const diffMs = bdayThisYear.getTime() - today.getTime();
  const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) {
    return {
      isToday: true,
      isUpcoming: false,
      daysUntil: 0,
      turningAge: currentYr - birthYear,
      dateStr: `${bdayThisYear.getDate()} ${bdayThisYear.toLocaleString('en-US', { month: 'short' })}`
    };
  }

  if (diffDays > 0 && diffDays <= daysAhead) {
    const turningYear = bdayThisYear.getFullYear();
    return {
      isToday: false,
      isUpcoming: true,
      daysUntil: diffDays,
      turningAge: turningYear - birthYear,
      dateStr: `${bdayThisYear.getDate()} ${bdayThisYear.toLocaleString('en-US', { month: 'short' })}`
    };
  }

  return null;
}

export function getCurrentSeason(): 'Spring' | 'Summer' | 'Autumn' | 'Winter' {
  const month = new Date().getMonth(); // 0 - 11
  // Typical calendar seasons:
  // Dec, Jan, Feb = Winter (or Summer in Southern hemisphere; let's support general or agricultural)
  // Mar, Apr, May = Spring
  // Jun, Jul, Aug = Summer
  // Sep, Oct, Nov = Autumn
  if (month >= 2 && month <= 4) return 'Spring';
  if (month >= 5 && month <= 7) return 'Summer';
  if (month >= 8 && month <= 10) return 'Autumn';
  return 'Winter';
}

export function calculateNextAnnualDipping(lastDateStr: string): string {
  const d = new Date(lastDateStr + 'T00:00:00');
  d.setFullYear(d.getFullYear() + 1);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function getDippingStatus(lastDateStr?: string): {
  status: 'Up to Date' | 'Due Soon' | 'Overdue' | 'Not Dipped';
  daysLeft: number;
  nextDueDate?: string;
} {
  if (!lastDateStr) {
    return { status: 'Not Dipped', daysLeft: 0 };
  }

  const nextDue = calculateNextAnnualDipping(lastDateStr);
  const nextDueDate = new Date(nextDue + 'T00:00:00');
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const diffMs = nextDueDate.getTime() - today.getTime();
  const daysLeft = Math.round(diffMs / (1000 * 60 * 60 * 24));

  if (daysLeft < 0) {
    return { status: 'Overdue', daysLeft, nextDueDate: nextDue };
  } else if (daysLeft <= 30) {
    return { status: 'Due Soon', daysLeft, nextDueDate: nextDue };
  } else {
    return { status: 'Up to Date', daysLeft, nextDueDate: nextDue };
  }
}
