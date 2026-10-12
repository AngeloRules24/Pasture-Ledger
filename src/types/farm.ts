export type AnimalSex = 'M' | 'F';

export interface OffspringSummary {
  id: string;
  tag: string;
  sex: AnimalSex;
  birthdate: string;
  breed: string;
}

export interface DippingRecord {
  id: string;
  date: string;
  chemicalUsed: string;
  operator: string;
  nextDueDate: string; // 1 year later
  notes?: string;
}

export interface VaccinationRecord {
  id: string;
  date: string;
  medicationId: string;
  medicationName: string;
  season: 'Spring' | 'Summer' | 'Autumn' | 'Winter' | 'Rainy' | 'Dry';
  administeredBy: string;
  dosage: string;
  notes?: string;
}

export interface Cow {
  id: string;
  tag: string;
  sex: AnimalSex;
  birthdate: string; // YYYY-MM-DD (Mandatory)
  breed: string; // Mandatory
  color: string;
  sireTag: string; // Father (Mandatory)
  damTag: string; // Mother (Mandatory)
  herdGroup?: 'Breeding Cow' | 'Bull' | 'Heifer' | 'Calf' | 'Steer';
  birthEvents: number[]; // Years this female gave birth
  lastDippingDate?: string; // Annual dipping date
  lastDippingChemical?: string;
  vaccinations: VaccinationRecord[];
  dippings: DippingRecord[];
  tagHistory?: { oldTag: string; replacedDate: string; reason: string }[];
  status: 'Active' | 'Sold' | 'Deceased' | 'Culled';
}

export type RemovalReason = 'death' | 'sale' | 'illness' | 'lost_tag_replaced';

export interface CattleRemovalLog {
  id: string;
  cowId: string;
  originalTag: string;
  date: string;
  reason: RemovalReason;
  newTagId?: string; // Mandatory if lost_tag_replaced
  notes: string;
  salePrice?: number;
  buyer?: string;
}

export interface FarmMedication {
  id: string;
  name: string;
  category: 'Vaccine' | 'Dip' | 'Antibiotic' | 'Dewormer';
  targetSeason: 'Spring' | 'Summer' | 'Autumn' | 'Winter' | 'Rainy' | 'Dry';
  dateAdded: string;
  batchNumber?: string;
  expiryDate?: string;
  description: string;
}

export interface AttendanceRecord {
  date: string; // YYYY-MM-DD
  status: 'Present' | 'Absent' | 'Day Off';
  checkIn?: string; // HH:MM
  checkOut?: string; // HH:MM
  absenceReason?: string; // Mandatory if absent
}

export interface Employee {
  id: string; // System ID e.g. EMP-0001
  idType?: 'rsa_id' | 'passport'; // South African ID (13-digit) or Passport
  idNumber: string; // Official ID / Passport Number (Mandatory)
  name: string;
  birthdate: string; // YYYY-MM-DD (Mandatory)
  phone: string;
  email?: string;
  address?: string;
  role?: string;
  photo?: string;
  attendance: AttendanceRecord[];
}

export interface GenericAnimal {
  id: string;
  tag: string;
  sex: AnimalSex;
  birthdate: string;
  breed: string;
  color: string;
  parentTag?: string;
  birthEvents: number[];
  lastVaccinated?: string;
}

export interface ChickenLog {
  id: string;
  date: string;
  eggs: number;
  hatchlings: number;
  sold: number;
  notes: string;
}

// Layer Flock Daily Tracking: Eggs, Vaccines, Feed
export interface LayerLog {
  id: string;
  date: string;
  eggs: number;
  trays?: number;
  feedType: string; // Layer Mash, Scratch Grain, etc.
  feedKg: number;
  vaccineGiven?: string;
  vaccineDose?: string;
  mortality: number;
  deathCause?: string;
  deathEffect?: string;
  notes?: string;
}

// Broiler Flock Daily Tracking: Weight (g/kg), Vaccines, Feed
export interface BroilerLog {
  id: string;
  date: string;
  weight: number;
  weightUnit: 'g' | 'kg';
  feedType: string; // Broiler Starter, Grower, Finisher
  feedKg: number;
  vaccineGiven?: string;
  vaccineDose?: string;
  mortality: number;
  deathCause?: string;
  deathEffect?: string;
  soldOrHarvested?: number;
  notes?: string;
}

export interface ChickenStatus {
  sick: boolean;
  notes: string;
  breed: string;
  flockType?: 'layers' | 'broilers' | 'both';
}

export interface ChemicalAlternative {
  name: string;
  note: string;
}

export interface Chemical {
  id: string;
  name: string;
  expiration: string;
  volume: string;
  effects: string;
  caution: string;
  alternatives: ChemicalAlternative[];
}

export interface HeadcountRecord {
  id?: string;
  date: string;
  species: string; // 'cattle' | 'sheep' | 'goats' | 'pigs' | 'layers' | 'broilers'
  total: number;
  present: number;
  missing: number;
  missingTags: string[];
  deathCause?: string; // Required if headcount < previous count
  deathEffect?: string; // Required effect / action if headcount < previous count
  notes?: string;
}
