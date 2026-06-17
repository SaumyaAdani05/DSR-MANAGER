import { MAX_NOZZLES, MAX_EMPLOYEES } from '../utils/constants.js';
import { v4 as uuidv4 } from 'uuid';
import { db } from '../db/localDB.js';
import { queueSync } from './syncService.js';

export const getSettings = async () => {
  let settings = await db.settings.get('main');
  if (!settings) {
    // Wait briefly and try again in case seeding is in progress
    await new Promise(resolve => setTimeout(resolve, 300));
    settings = await db.settings.get('main');
  }
  return settings || { stationName: 'Memnagar CNG' };
};

export const updateStationName = async (name) => {
  const now = new Date().toISOString();
  await db.settings.update('main', { stationName: name, updatedAt: now });
  await queueSync('settings', 'main', { id: 'main', station_name: name, updated_at: now });
};

export const updateSupabaseConfig = async (url, key) => {
  const now = new Date().toISOString();
  await db.settings.update('main', {
    supabaseUrl: url.trim(),
    supabaseKey: key.trim(),
    updatedAt: now,
  });
};

export const getNozzles = async () => {
  const list = await db.nozzles.toArray();
  return list.sort((a, b) => (a.displayOrder || 0) - (b.displayOrder || 0));
};

export const addNozzle = async (name) => {
  const nozzles = await getNozzles();
  const activeCount = nozzles.filter((n) => n.isActive).length;

  if (activeCount >= MAX_NOZZLES) {
    throw new Error('Maximum nozzle limit reached (15)');
  }

  if (nozzles.some((n) => n.name.toLowerCase() === name.toLowerCase().trim() && n.isActive)) {
    throw new Error('A nozzle with this name already exists');
  }

  const now = new Date().toISOString();
  const id = uuidv4();
  const newNozzle = {
    id,
    name: name.trim(),
    isActive: true,
    displayOrder: nozzles.length,
    addedAt: now,
  };

  await db.nozzles.put(newNozzle);
  await queueSync('nozzles', id, {
    id,
    name: newNozzle.name,
    is_active: true,
    display_order: newNozzle.displayOrder,
    added_at: now,
    updated_at: now,
  });
  return newNozzle;
};

export const removeNozzle = async (nozzleId) => {
  const nozzle = await db.nozzles.get(nozzleId);
  if (!nozzle) return;
  const now = new Date().toISOString();
  await db.nozzles.update(nozzleId, { isActive: false });
  await queueSync('nozzles', nozzleId, {
    id: nozzleId,
    name: nozzle.name,
    is_active: false,
    display_order: nozzle.displayOrder,
    added_at: nozzle.addedAt,
    updated_at: now,
  });
};

export const getEmployees = async () => {
  const list = await db.employees.toArray();
  return list.sort((a, b) => (a.displayOrder || 0) - (b.displayOrder || 0));
};

export const addEmployee = async (name) => {
  const employees = await getEmployees();
  const activeCount = employees.filter((e) => e.isActive).length;

  if (activeCount >= MAX_EMPLOYEES) {
    throw new Error('Maximum employee limit reached (50)');
  }

  if (employees.some((e) => e.name.toLowerCase() === name.toLowerCase().trim() && e.isActive)) {
    throw new Error('An employee with this name already exists');
  }

  const now = new Date().toISOString();
  const id = uuidv4();
  const newEmployee = {
    id,
    name: name.trim(),
    isActive: true,
    displayOrder: employees.length,
    addedAt: now,
  };

  await db.employees.put(newEmployee);
  await queueSync('employees', id, {
    id,
    name: newEmployee.name,
    is_active: true,
    display_order: newEmployee.displayOrder,
    added_at: now,
    updated_at: now,
  });
  return newEmployee;
};

export const removeEmployee = async (employeeId) => {
  const employee = await db.employees.get(employeeId);
  if (!employee) return;
  const now = new Date().toISOString();
  await db.employees.update(employeeId, { isActive: false });
  await queueSync('employees', employeeId, {
    id: employeeId,
    name: employee.name,
    is_active: false,
    display_order: employee.displayOrder,
    added_at: employee.addedAt,
    updated_at: now,
  });
};
