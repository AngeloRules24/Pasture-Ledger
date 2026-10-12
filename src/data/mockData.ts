import { 
  Cow, 
  Employee, 
  FarmMedication, 
  GenericAnimal, 
  ChickenLog, 
  LayerLog, 
  BroilerLog, 
  ChickenStatus, 
  Chemical, 
  HeadcountRecord, 
  CattleRemovalLog 
} from '../types/farm';

// Blank slate initial data - ready for PHP Database connection
export const INITIAL_EMPLOYEES: Employee[] = [];

export const INITIAL_COWS: Cow[] = [];

export const INITIAL_MEDICATIONS: FarmMedication[] = [];

export const INITIAL_CATTLE_REMOVALS: CattleRemovalLog[] = [];

export const INITIAL_SHEEP: GenericAnimal[] = [];

export const INITIAL_GOATS: GenericAnimal[] = [];

export const INITIAL_PIGS: GenericAnimal[] = [];

export const INITIAL_CHICKEN_LOGS: ChickenLog[] = [];

export const INITIAL_LAYER_LOGS: LayerLog[] = [];

export const INITIAL_BROILER_LOGS: BroilerLog[] = [];

export const INITIAL_CHICKEN_STATUS: ChickenStatus = {
  sick: false,
  notes: '',
  breed: '',
  flockType: 'both'
};

export const INITIAL_CHEMICALS: Chemical[] = [];

export const INITIAL_HEADCOUNTS: Record<string, HeadcountRecord[]> = {
  cattle: [],
  sheep: [],
  goats: [],
  pigs: [],
  layers: [],
  broilers: []
};

