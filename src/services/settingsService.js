import { MAX_NOZZLES, MAX_EMPLOYEES } from '../utils/constants';
import { v4 as uuidv4 } from 'uuid';

const SETTINGS_KEY = 'dsr_settings';
const NOZZLES_KEY = 'dsr_nozzles';
const EMPLOYEES_KEY = 'dsr_employees';

export const getSettings = async () => {
  const settings = localStorage.getItem(SETTINGS_KEY);
  return settings ? JSON.parse(settings) : { stationName: 'Memnagar CNG' };
};

export const updateStationName = async (name) => {
  const settings = await getSettings();
  settings.stationName = name;
  settings.lastUpdatedAt = new Date().toISOString();
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
};

export const getNozzles = async () => {
  const nozzles = localStorage.getItem(NOZZLES_KEY);
  return nozzles ? JSON.parse(nozzles) : [];
};

export const addNozzle = async (name) => {
  const nozzles = await getNozzles();
  const activeCount = nozzles.filter((n) => n.isActive).length;

  if (activeCount >= MAX_NOZZLES) {
    throw new Error('Maximum nozzle limit reached (15)');
  }

  if (nozzles.some((n) => n.name === name && n.isActive)) {
    throw new Error('A nozzle with this name already exists');
  }

  const newNozzle = {
    id: uuidv4(),
    name: name.trim(),
    isActive: true,
    addedAt: new Date().toISOString(),
  };

  nozzles.push(newNozzle);
  localStorage.setItem(NOZZLES_KEY, JSON.stringify(nozzles));
  return newNozzle;
};

export const removeNozzle = async (nozzleId) => {
  const nozzles = await getNozzles();
  const updated = nozzles.map((n) =>
    n.id === nozzleId ? { ...n, isActive: false } : n
  );
  localStorage.setItem(NOZZLES_KEY, JSON.stringify(updated));
};

export const getEmployees = async () => {
  const employees = localStorage.getItem(EMPLOYEES_KEY);
  return employees ? JSON.parse(employees) : [];
};

export const addEmployee = async (name) => {
  const employees = await getEmployees();
  const activeCount = employees.filter((e) => e.isActive).length;

  if (activeCount >= MAX_EMPLOYEES) {
    throw new Error('Maximum employee limit reached (50)');
  }

  const newEmployee = {
    id: uuidv4(),
    name: name.trim(),
    isActive: true,
    addedAt: new Date().toISOString(),
  };

  employees.push(newEmployee);
  localStorage.setItem(EMPLOYEES_KEY, JSON.stringify(employees));
  return newEmployee;
};

export const removeEmployee = async (employeeId) => {
  const employees = await getEmployees();
  const updated = employees.map((e) =>
    e.id === employeeId ? { ...e, isActive: false } : e
  );
  localStorage.setItem(EMPLOYEES_KEY, JSON.stringify(updated));
};
