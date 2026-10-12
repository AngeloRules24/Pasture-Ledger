import React, { useState, useEffect } from 'react';
import { Database, Link, CheckCircle, AlertCircle, RefreshCw, Copy, Check, ExternalLink } from 'lucide-react';
import { getApiConfig, saveApiConfig, phpApi, ApiConfig } from '../services/api';

interface PhpConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSyncFromPhp?: () => void;
}

export const PhpConfigModal: React.FC<PhpConfigModalProps> = ({
  isOpen,
  onClose,
  onSyncFromPhp
}) => {
  const [config, setConfig] = useState<ApiConfig>(getApiConfig());
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);
  const [isTesting, setIsTesting] = useState(false);
  const [copiedTab, setCopiedTab] = useState<string | null>(null);
  const [activeCodeTab, setActiveCodeTab] = useState<'schema' | 'config' | 'api'>('schema');

  useEffect(() => {
    if (isOpen) {
      setConfig(getApiConfig());
      setTestResult(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    saveApiConfig(config);
    setTestResult({ success: true, message: 'Settings saved! The application will communicate with your PHP backend.' });
  };

  const handleTest = async () => {
    setIsTesting(true);
    setTestResult(null);
    try {
      const res = await phpApi.testConnection(config.baseUrl);
      setTestResult(res);
    } catch (err: any) {
      setTestResult({ success: false, message: err.message || 'Network error connecting to PHP backend.' });
    } finally {
      setIsTesting(false);
    }
  };

  const copyToClipboard = (text: string, tab: string) => {
    navigator.clipboard.writeText(text);
    setCopiedTab(tab);
    setTimeout(() => setCopiedTab(null), 2000);
  };

  const SAMPLE_SCHEMA = `-- PastureLedger MySQL Schema
CREATE DATABASE IF NOT EXISTS pasture_ledger CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE pasture_ledger;

-- 1. Cattle Herd Table
CREATE TABLE IF NOT EXISTS cows (
    id VARCHAR(32) PRIMARY KEY,
    tag VARCHAR(64) NOT NULL UNIQUE,
    sex ENUM('M', 'F') NOT NULL,
    birthdate DATE NOT NULL,
    breed VARCHAR(128) NOT NULL,
    color VARCHAR(128) DEFAULT '',
    sire_tag VARCHAR(64) NOT NULL,
    dam_tag VARCHAR(64) NOT NULL,
    herd_group VARCHAR(64) DEFAULT 'Heifer',
    status ENUM('Active', 'Sold', 'Deceased', 'Culled') DEFAULT 'Active',
    last_dipping_date DATE NULL,
    last_dipping_chemical VARCHAR(128) NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_dam (dam_tag),
    INDEX idx_sire (sire_tag),
    INDEX idx_status (status)
) ENGINE=InnoDB;

-- 2. Cow Tag Replacement & Removal Audit Log
CREATE TABLE IF NOT EXISTS cattle_removals (
    id VARCHAR(32) PRIMARY KEY,
    cow_id VARCHAR(32) NOT NULL,
    original_tag VARCHAR(64) NOT NULL,
    date DATE NOT NULL,
    reason ENUM('death', 'sale', 'illness', 'lost_tag_replaced') NOT NULL,
    new_tag_id VARCHAR(64) NULL,
    notes TEXT NULL,
    sale_price DECIMAL(10, 2) NULL,
    buyer VARCHAR(128) NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (cow_id) REFERENCES cows(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- 3. Cattle Dipping Records (Annual Cadence)
CREATE TABLE IF NOT EXISTS cattle_dippings (
    id VARCHAR(32) PRIMARY KEY,
    cow_id VARCHAR(32) NOT NULL,
    date DATE NOT NULL,
    chemical_used VARCHAR(128) NOT NULL,
    operator VARCHAR(128) DEFAULT '',
    next_due_date DATE NOT NULL,
    notes TEXT NULL,
    FOREIGN KEY (cow_id) REFERENCES cows(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- 4. Cattle Seasonal Vaccinations
CREATE TABLE IF NOT EXISTS cattle_vaccinations (
    id VARCHAR(32) PRIMARY KEY,
    cow_id VARCHAR(32) NOT NULL,
    medication_id VARCHAR(32) NOT NULL,
    medication_name VARCHAR(128) NOT NULL,
    season ENUM('Spring', 'Summer', 'Autumn', 'Winter', 'Rainy', 'Dry') NOT NULL,
    date DATE NOT NULL,
    dosage VARCHAR(64) DEFAULT '',
    administered_by VARCHAR(128) DEFAULT '',
    notes TEXT NULL,
    FOREIGN KEY (cow_id) REFERENCES cows(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- 5. Farm Staff & Employees
CREATE TABLE IF NOT EXISTS employees (
    id VARCHAR(32) PRIMARY KEY,
    id_number VARCHAR(64) NOT NULL UNIQUE,
    name VARCHAR(128) NOT NULL,
    birthdate DATE NOT NULL,
    phone VARCHAR(64) NOT NULL,
    email VARCHAR(128) NULL,
    address TEXT NULL,
    role VARCHAR(128) DEFAULT 'Staff',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- 6. Attendance Register (Mandatory reason if absent)
CREATE TABLE IF NOT EXISTS attendance (
    id INT AUTO_INCREMENT PRIMARY KEY,
    employee_id VARCHAR(32) NOT NULL,
    date DATE NOT NULL,
    status ENUM('Present', 'Absent', 'Day Off') NOT NULL,
    check_in TIME NULL,
    check_out TIME NULL,
    absence_reason TEXT NULL,
    UNIQUE KEY uq_emp_date (employee_id, date),
    FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- 7. Farm Medications & Seasonal Schedules
CREATE TABLE IF NOT EXISTS medications (
    id VARCHAR(32) PRIMARY KEY,
    name VARCHAR(128) NOT NULL,
    category ENUM('Vaccine', 'Dip', 'Antibiotic', 'Dewormer') NOT NULL,
    target_season ENUM('Spring', 'Summer', 'Autumn', 'Winter', 'Rainy', 'Dry') NOT NULL,
    date_added DATE NOT NULL,
    batch_number VARCHAR(64) NULL,
    expiry_date DATE NULL,
    description TEXT NULL
) ENGINE=InnoDB;

-- 8. Agrochemicals
CREATE TABLE IF NOT EXISTS chemicals (
    id VARCHAR(32) PRIMARY KEY,
    name VARCHAR(128) NOT NULL,
    expiration DATE NOT NULL,
    volume VARCHAR(64) DEFAULT '',
    effects TEXT NULL,
    caution TEXT NULL
) ENGINE=InnoDB;`;

  const SAMPLE_CONFIG = `<?php
// config.php - PastureLedger MySQL Database Configuration
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, OPTIONS, PUT, DELETE");
header("Access-Control-Allow-Headers: Content-Type, Authorization, X-API-KEY");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

$db_host = 'localhost';
$db_name = 'pasture_ledger';
$db_user = 'root';
$db_pass = '';

try {
    $pdo = new PDO("mysql:host=$db_host;dbname=$db_name;charset=utf8mb4", $db_user, $db_pass, [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC
    ]);
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['error' => 'Database connection failed: ' . $e->getMessage()]);
    exit();
}
?>`;

  const SAMPLE_API = `<?php
// api.php - RESTful Handler for PastureLedger
require_once 'config.php';
header('Content-Type: application/json');

$action = $_GET['action'] ?? '';
$method = $_SERVER['REQUEST_METHOD'];
$input = json_decode(file_get_contents('php://input'), true) ?? [];

switch ($action) {
    case 'ping':
        echo json_encode(['success' => true, 'message' => 'PHP backend operational', 'version' => '1.0']);
        break;

    // Cattle Handlers
    case 'getCows':
        $stmt = $pdo->query("SELECT * FROM cows WHERE status = 'Active' ORDER BY created_at DESC");
        $cows = $stmt->fetchAll();
        // Attach dippings and vaccinations
        foreach ($cows as &$c) {
            $c['vaccinations'] = $pdo->prepare("SELECT * FROM cattle_vaccinations WHERE cow_id = ?")->execute([$c['id']]) ? [] : [];
            $c['dippings'] = $pdo->prepare("SELECT * FROM cattle_dippings WHERE cow_id = ?")->execute([$c['id']]) ? [] : [];
        }
        echo json_encode($cows);
        break;

    case 'addCow':
        $stmt = $pdo->prepare("INSERT INTO cows (id, tag, sex, birthdate, breed, color, sire_tag, dam_tag, herd_group) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)");
        $stmt->execute([
            $input['id'], $input['tag'], $input['sex'], $input['birthdate'], 
            $input['breed'], $input['color'] ?? '', $input['sireTag'], $input['damTag'], 
            $input['herdGroup'] ?? 'Heifer'
        ]);
        echo json_encode(['success' => true, 'id' => $input['id']]);
        break;

    case 'removeCow':
        if ($input['reason'] === 'lost_tag_replaced') {
            // Update tag
            $stmt = $pdo->prepare("UPDATE cows SET tag = ? WHERE id = ?");
            $stmt->execute([$input['newTagId'], $input['id']]);
        } else {
            $stmt = $pdo->prepare("UPDATE cows SET status = ? WHERE id = ?");
            $status = $input['reason'] === 'sale' ? 'Sold' : ($input['reason'] === 'death' ? 'Deceased' : 'Culled');
            $stmt->execute([$status, $input['id']]);
        }
        // Log in removal audit table
        $stmtLog = $pdo->prepare("INSERT INTO cattle_removals (id, cow_id, original_tag, date, reason, new_tag_id, notes, sale_price, buyer) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)");
        $stmtLog->execute([
            'REM-' . time(), $input['id'], $input['originalTag'] ?? '', date('Y-m-d'),
            $input['reason'], $input['newTagId'] ?? null, $input['notes'] ?? '', 
            $input['salePrice'] ?? null, $input['buyer'] ?? null
        ]);
        echo json_encode(['success' => true]);
        break;

    // Staff Handlers
    case 'getEmployees':
        $stmt = $pdo->query("SELECT * FROM employees ORDER BY name ASC");
        $employees = $stmt->fetchAll();
        foreach ($employees as &$emp) {
            $attStmt = $pdo->prepare("SELECT date, status, check_in as checkIn, check_out as checkOut, absence_reason as absenceReason FROM attendance WHERE employee_id = ? ORDER BY date DESC");
            $attStmt->execute([$emp['id']]);
            $emp['attendance'] = $attStmt->fetchAll();
        }
        echo json_encode($employees);
        break;

    case 'addEmployee':
        $stmt = $pdo->prepare("INSERT INTO employees (id, id_number, name, birthdate, phone, email, address, role) VALUES (?, ?, ?, ?, ?, ?, ?, ?)");
        $stmt->execute([
            $input['id'], $input['idNumber'], $input['name'], $input['birthdate'], 
            $input['phone'], $input['email'] ?? null, $input['address'] ?? null, $input['role'] ?? 'Staff'
        ]);
        echo json_encode(['success' => true, 'id' => $input['id']]);
        break;

    case 'saveAttendance':
        $stmt = $pdo->prepare("INSERT INTO attendance (employee_id, date, status, check_in, check_out, absence_reason) VALUES (?, ?, ?, ?, ?, ?) ON DUPLICATE KEY UPDATE status = VALUES(status), check_in = VALUES(check_in), check_out = VALUES(check_out), absence_reason = VALUES(absence_reason)");
        $stmt->execute([
            $input['employeeId'], $input['date'], $input['status'], 
            $input['checkIn'] ?? null, $input['checkOut'] ?? null, $input['absenceReason'] ?? null
        ]);
        echo json_encode(['success' => true]);
        break;

    default:
        http_response_code(400);
        echo json_encode(['error' => 'Invalid action requested']);
        break;
}
?>`;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:p-4 bg-black/50 backdrop-blur-xs overflow-y-auto">
      <div className="bg-[#FAF8F2] border-t sm:border border-[#D5CDBC] rounded-t-2xl sm:rounded-2xl w-full max-w-3xl p-4 sm:p-6 shadow-2xl my-0 sm:my-8 max-h-[92vh] flex flex-col">
        <div className="w-12 h-1.5 bg-[#D1C9B6] rounded-full mx-auto mb-2 sm:hidden shrink-0"></div>
        <div className="flex items-center justify-between pb-3 border-b border-[#E8E1CE] shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#2E3C31] text-white flex items-center justify-center shrink-0">
              <Database className="w-4 h-4 text-[#C28B38]" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-bold text-[#1E2620]">PHP Database Link &amp; API</h3>
              <p className="text-[11px] sm:text-xs text-[#636A5B]">
                Configure external MySQL/MariaDB database link via PHP API scripts.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-lg font-bold cursor-pointer p-1 min-h-[36px]"
          >
            ✕
          </button>
        </div>

        <div className="flex-1 overflow-y-auto my-3 sm:my-4 space-y-4 sm:space-y-5">
          {/* Connection settings form */}
          <form onSubmit={handleSave} className="p-3.5 sm:p-4 bg-white border border-[#D5CDBC] rounded-xl space-y-3.5 text-xs">
            <div className="flex items-center justify-between pb-2 border-b border-[#EFEAE0]">
              <span className="font-bold text-xs sm:text-sm text-[#1E241F]">Database Link Settings</span>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  className="w-4 h-4 text-[#2E3C31] rounded"
                  checked={config.enabled}
                  onChange={(e) => setConfig({ ...config, enabled: e.target.checked })}
                />
                <span className="font-bold text-xs text-[#2E3C31]">Enable PHP API Sync</span>
              </label>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-[#4B5143] uppercase tracking-wider mb-1">
                PHP API URL / Endpoint *
              </label>
              <input
                type="text"
                placeholder="e.g. http://localhost/farm/api.php or https://your-domain.com/api.php"
                value={config.baseUrl}
                onChange={(e) => setConfig({ ...config, baseUrl: e.target.value })}
                className="w-full px-3 py-2 border border-[#D5CDBC] rounded-lg bg-[#FAF8F3] font-mono text-base sm:text-xs focus:outline-none focus:border-[#2E3C31] min-h-[42px]"
              />
              <span className="text-[11px] text-[#717769] mt-1 block">
                The full URL to your hosted <code>api.php</code> script that handles MySQL operations.
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-[#4B5143] uppercase tracking-wider mb-1">
                  API Key / Bearer Token (Optional)
                </label>
                <input
                  type="password"
                  placeholder="Optional secret token..."
                  value={config.apiKey || ''}
                  onChange={(e) => setConfig({ ...config, apiKey: e.target.value })}
                  className="w-full px-3 py-2 border border-[#D5CDBC] rounded-lg bg-[#FAF8F3] text-base sm:text-xs min-h-[42px]"
                />
              </div>

              <div className="grid grid-cols-2 gap-2 sm:flex sm:items-end">
                <button
                  type="button"
                  onClick={handleTest}
                  disabled={isTesting || !config.baseUrl}
                  className="w-full px-3 py-2 rounded-lg bg-[#F0ECE1] text-[#2E3C31] hover:bg-[#E3DDCD] font-bold transition-colors cursor-pointer flex items-center justify-center gap-1.5 disabled:opacity-50 min-h-[42px]"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isTesting ? 'animate-spin' : ''}`} />
                  <span className="text-xs">{isTesting ? 'Testing...' : 'Test Link'}</span>
                </button>
                <button
                  type="submit"
                  className="w-full px-4 py-2 rounded-lg bg-[#2E3C31] text-white font-bold transition-colors cursor-pointer min-h-[42px] text-xs"
                >
                  Save Config
                </button>
              </div>
            </div>

            {testResult && (
              <div className={`p-3 rounded-lg border text-xs flex items-center gap-2 ${
                testResult.success
                  ? 'bg-[#EAF2EC] border-[#B9D9C0] text-[#1F4C28]'
                  : 'bg-[#FCE5E2] border-[#F8B8B0] text-[#A62F1E]'
              }`}>
                {testResult.success ? <CheckCircle className="w-4 h-4 shrink-0" /> : <AlertCircle className="w-4 h-4 shrink-0" />}
                <span>{testResult.message}</span>
              </div>
            )}
          </form>

          {/* PHP Code & SQL Schema Reference Viewer */}
          <div className="bg-white border border-[#D5CDBC] rounded-xl p-4 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-[#EFEAE0]">
              <div>
                <span className="font-bold text-xs text-[#1E241F]">PHP Backend Files &amp; MySQL Schema</span>
                <p className="text-[11px] text-[#696F61]">
                  Place these files on your Apache/Nginx web server with PHP 7.4+ and MySQL 5.7+ / MariaDB.
                </p>
              </div>

              <div className="flex items-center gap-1 bg-[#F0ECE1] p-0.5 rounded-lg border border-[#DDD5C0]">
                <button
                  type="button"
                  onClick={() => setActiveCodeTab('schema')}
                  className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-colors cursor-pointer ${
                    activeCodeTab === 'schema' ? 'bg-[#2E3C31] text-white' : 'text-[#4F4B3C]'
                  }`}
                >
                  schema.sql
                </button>
                <button
                  type="button"
                  onClick={() => setActiveCodeTab('config')}
                  className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-colors cursor-pointer ${
                    activeCodeTab === 'config' ? 'bg-[#2E3C31] text-white' : 'text-[#4F4B3C]'
                  }`}
                >
                  config.php
                </button>
                <button
                  type="button"
                  onClick={() => setActiveCodeTab('api')}
                  className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-colors cursor-pointer ${
                    activeCodeTab === 'api' ? 'bg-[#2E3C31] text-white' : 'text-[#4F4B3C]'
                  }`}
                >
                  api.php
                </button>
              </div>
            </div>

            <div className="relative">
              <div className="absolute right-3 top-3 z-10">
                <button
                  onClick={() =>
                    copyToClipboard(
                      activeCodeTab === 'schema'
                        ? SAMPLE_SCHEMA
                        : activeCodeTab === 'config'
                        ? SAMPLE_CONFIG
                        : SAMPLE_API,
                      activeCodeTab
                    )
                  }
                  className="px-2.5 py-1 rounded bg-[#334235] text-white hover:bg-[#435646] text-[11px] font-semibold flex items-center gap-1 cursor-pointer shadow-xs"
                >
                  {copiedTab === activeCodeTab ? <Check className="w-3 h-3 text-[#9EE5A8]" /> : <Copy className="w-3 h-3" />}
                  <span>{copiedTab === activeCodeTab ? 'Copied!' : 'Copy Code'}</span>
                </button>
              </div>

              <pre className="p-3 bg-[#1F2620] text-[#D8E6DA] rounded-lg font-mono text-[11px] max-h-72 overflow-y-auto leading-relaxed border border-[#303E33]">
                <code>
                  {activeCodeTab === 'schema' && SAMPLE_SCHEMA}
                  {activeCodeTab === 'config' && SAMPLE_CONFIG}
                  {activeCodeTab === 'api' && SAMPLE_API}
                </code>
              </pre>
            </div>
          </div>
        </div>

        <div className="pt-3 border-t border-[#E8E1CE] flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-[#2E3C31] text-white font-semibold text-xs cursor-pointer"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
