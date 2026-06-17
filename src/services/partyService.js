import { db } from '../db/localDB.js';
import { queueSync } from './syncService.js';
import { v4 as uuidv4 } from 'uuid';

export const getParties = async () => {
  const list = await db.parties.toArray();
  return list.filter(p => p.isActive !== false).sort((a, b) => (a.order || 0) - (b.order || 0));
};

export const getAllParties = async () => {
  const list = await db.parties.toArray();
  return list.sort((a, b) => (a.order || 0) - (b.order || 0));
};

export const addParty = async (name) => {
  if (!name || !name.trim()) throw new Error('Party name is required');
  const parties = await db.parties.toArray();
  
  if (parties.some(p => p.name.toLowerCase() === name.toLowerCase().trim() && p.isActive !== false)) {
    throw new Error('A party with this name already exists');
  }

  const now = new Date().toISOString();
  const id = uuidv4();
  const newParty = {
    id,
    name: name.trim(),
    isActive: true,
    order: parties.length,
    addedAt: now,
  };

  await db.parties.put(newParty);
  await queueSync('parties', id, {
    id,
    name: newParty.name,
    is_active: true,
    display_order: newParty.order,
    added_at: now,
    updated_at: now,
  });

  return newParty;
};

export const removeParty = async (id) => {
  const party = await db.parties.get(id);
  if (!party) return;

  const now = new Date().toISOString();
  await db.parties.update(id, { isActive: false });
  await queueSync('parties', id, {
    id: party.id,
    name: party.name,
    is_active: false,
    display_order: party.order,
    added_at: party.addedAt,
    updated_at: now,
  });
};
