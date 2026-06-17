import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import {
  getSettings,
  updateStationName as updateStationNameService,
  getNozzles,
  addNozzle as addNozzleService,
  removeNozzle as removeNozzleService,
  getEmployees,
  addEmployee as addEmployeeService,
  removeEmployee as removeEmployeeService,
} from '../services/settingsService.js';
import { useAuth } from './AuthContext.jsx';
import toast from 'react-hot-toast';

const SettingsContext = createContext(null);

export const useSettings = () => {
  const ctx = useContext(SettingsContext);
  if (!ctx) throw new Error('useSettings must be used within SettingsProvider');
  return ctx;
};

export const SettingsProvider = ({ children }) => {
  const { isAuthenticated } = useAuth();

  const [stationName, setStationNameState] = useState('');
  const [allNozzles, setAllNozzles] = useState([]);
  const [allEmployees, setAllEmployees] = useState([]);
  const [settingsLoading, setSettingsLoading] = useState(true);

  /** Active-only filtered lists */
  const nozzles = allNozzles.filter((n) => n.isActive);
  const employees = allEmployees.filter((e) => e.isActive);

  /* Initial load */
  const loadSettings = useCallback(async () => {
    if (!isAuthenticated) return;
    setSettingsLoading(true);
    try {
      const [settings, nozzleList, empList] = await Promise.all([
        getSettings(),
        getNozzles(),
        getEmployees(),
      ]);
      setStationNameState(settings?.stationName ?? 'Memnagar CNG');
      setAllNozzles(nozzleList ?? []);
      setAllEmployees(empList ?? []);
    } catch (err) {
      console.error('Failed to load settings:', err);
      toast.error('Failed to load settings');
    } finally {
      setSettingsLoading(false);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    loadSettings();
  }, [loadSettings]);

  /* Station name */
  const setStationName = async (name) => {
    try {
      await updateStationNameService(name);
      setStationNameState(name);
    } catch (err) {
      console.error('Failed to save station name:', err);
      toast.error('Failed to update station name');
      throw err;
    }
  };

  /* Refresh helpers */
  const refreshNozzles = async () => {
    const list = await getNozzles();
    setAllNozzles(list);
  };

  const refreshEmployees = async () => {
    const list = await getEmployees();
    setAllEmployees(list);
  };

  /* Nozzle CRUD */
  const handleAddNozzle = async (name) => {
    try {
      await addNozzleService(name);
      await refreshNozzles();
      toast.success(`Nozzle "${name}" added`);
    } catch (err) {
      toast.error(err.message || 'Failed to add nozzle');
      throw err;
    }
  };

  const handleRemoveNozzle = async (nozzleId) => {
    try {
      await removeNozzleService(nozzleId);
      await refreshNozzles();
      toast.success('Nozzle removed');
    } catch (err) {
      toast.error('Failed to remove nozzle');
      throw err;
    }
  };

  /* Employee CRUD */
  const handleAddEmployee = async (name) => {
    try {
      await addEmployeeService(name);
      await refreshEmployees();
      toast.success(`Employee "${name}" added`);
    } catch (err) {
      toast.error(err.message || 'Failed to add employee');
      throw err;
    }
  };

  const handleRemoveEmployee = async (empId) => {
    try {
      await removeEmployeeService(empId);
      await refreshEmployees();
      toast.success('Employee removed');
    } catch (err) {
      toast.error('Failed to remove employee');
      throw err;
    }
  };

  const value = {
    stationName,
    setStationName,
    nozzles,
    allNozzles,
    addNozzle: handleAddNozzle,
    removeNozzle: handleRemoveNozzle,
    refreshNozzles,
    employees,
    allEmployees,
    addEmployee: handleAddEmployee,
    removeEmployee: handleRemoveEmployee,
    refreshEmployees,
    settingsLoading,
    reloadSettings: loadSettings,
  };

  return (
    <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>
  );
};
