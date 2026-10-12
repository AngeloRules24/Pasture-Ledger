/**
 * PHP Database API Client & Sync Service
 * Connects PastureLedger frontend to your backend PHP API (api.php)
 */

import { 
  Cow, 
  Employee, 
  FarmMedication, 
  GenericAnimal, 
  ChickenLog, 
  ChickenStatus, 
  Chemical, 
  CattleRemovalLog,
  AttendanceRecord 
} from '../types/farm';

export interface ApiConfig {
  baseUrl: string; // e.g. "http://localhost/farm/api.php" or "/api.php"
  apiKey?: string;
  enabled: boolean;
}

const DEFAULT_CONFIG: ApiConfig = {
  baseUrl: (import.meta as any).env?.VITE_PHP_API_URL || '',
  enabled: false
};

export function getApiConfig(): ApiConfig {
  try {
    const saved = localStorage.getItem('pl_php_api_config');
    if (saved) return JSON.parse(saved);
  } catch {}
  return DEFAULT_CONFIG;
}

export function saveApiConfig(config: ApiConfig): void {
  localStorage.setItem('pl_php_api_config', JSON.stringify(config));
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const config = getApiConfig();
  if (!config.enabled || !config.baseUrl) {
    throw new Error('PHP API connection is not enabled or URL is not configured.');
  }

  const url = config.baseUrl.includes('?') 
    ? `${config.baseUrl}&action=${endpoint}` 
    : `${config.baseUrl}?action=${endpoint}`;

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> || {})
  };

  if (config.apiKey) {
    headers['Authorization'] = `Bearer ${config.apiKey}`;
    headers['X-API-KEY'] = config.apiKey;
  }

  const response = await fetch(url, {
    ...options,
    headers
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`PHP API Error (${response.status}): ${text || response.statusText}`);
  }

  return response.json();
}

export const phpApi = {
  // Test connection to PHP backend
  async testConnection(urlToTest?: string): Promise<{ success: boolean; message: string; version?: string }> {
    const config = getApiConfig();
    const url = urlToTest || config.baseUrl;
    if (!url) {
      return { success: false, message: 'Please enter a valid PHP API endpoint URL.' };
    }

    try {
      const pingUrl = url.includes('?') ? `${url}&action=ping` : `${url}?action=ping`;
      const res = await fetch(pingUrl, { method: 'GET' });
      if (!res.ok) {
        return { success: false, message: `Server responded with HTTP ${res.status}: ${res.statusText}` };
      }
      const data = await res.json().catch(() => ({}));
      return { 
        success: true, 
        message: 'Successfully connected to PHP backend!', 
        version: data.version || '1.0' 
      };
    } catch (err: any) {
      return { 
        success: false, 
        message: err.message || 'Failed to reach PHP server. Check CORS headers and URL.' 
      };
    }
  },

  // Cattle endpoints
  async getCows(): Promise<Cow[]> {
    return request<Cow[]>('getCows');
  },

  async addCow(cow: Cow): Promise<{ success: boolean; id: string }> {
    return request('addCow', {
      method: 'POST',
      body: JSON.stringify(cow)
    });
  },

  async updateCow(cow: Cow): Promise<{ success: boolean }> {
    return request('updateCow', {
      method: 'POST',
      body: JSON.stringify(cow)
    });
  },

  async removeCow(id: string, removal: Partial<CattleRemovalLog>): Promise<{ success: boolean }> {
    return request('removeCow', {
      method: 'POST',
      body: JSON.stringify({ id, ...removal })
    });
  },

  // Staff endpoints
  async getEmployees(): Promise<Employee[]> {
    return request<Employee[]>('getEmployees');
  },

  async addEmployee(emp: Employee): Promise<{ success: boolean; id: string }> {
    return request('addEmployee', {
      method: 'POST',
      body: JSON.stringify(emp)
    });
  },

  async updateEmployee(emp: Employee): Promise<{ success: boolean }> {
    return request('updateEmployee', {
      method: 'POST',
      body: JSON.stringify(emp)
    });
  },

  async deleteEmployee(id: string): Promise<{ success: boolean }> {
    return request('deleteEmployee', {
      method: 'POST',
      body: JSON.stringify({ id })
    });
  },

  async saveAttendance(empId: string, record: AttendanceRecord): Promise<{ success: boolean }> {
    return request('saveAttendance', {
      method: 'POST',
      body: JSON.stringify({ employeeId: empId, ...record })
    });
  },

  // Medications
  async getMedications(): Promise<FarmMedication[]> {
    return request<FarmMedication[]>('getMedications');
  },

  async addMedication(med: FarmMedication): Promise<{ success: boolean }> {
    return request('addMedication', {
      method: 'POST',
      body: JSON.stringify(med)
    });
  },

  // Chemicals
  async getChemicals(): Promise<Chemical[]> {
    return request<Chemical[]>('getChemicals');
  },

  async addChemical(chem: Chemical): Promise<{ success: boolean }> {
    return request('addChemical', {
      method: 'POST',
      body: JSON.stringify(chem)
    });
  }
};
