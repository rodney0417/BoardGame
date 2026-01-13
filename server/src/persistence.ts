import fs from 'fs';
import path from 'path';
import { Room } from './types';

const DATA_DIR = path.join(__dirname, '../data');
const DATA_FILE = path.join(DATA_DIR, 'rooms.json');

if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

export const saveRooms = (rooms: Record<string, Room>) => {
  try {
    // Filter out non-serializable data if any, or transform specifically
    // Room contains simple data mostly, but gameState might contain class instances.
    // JSON.stringify will treat class instances as plain objects (properties only).
    // This is fine for saving, but we need rehydration logic on load.
    const data = JSON.stringify(rooms, null, 2);
    fs.writeFileSync(DATA_FILE, data, 'utf-8');
  } catch (error) {
    console.error('[Persistence] Error saving rooms:', error);
  }
};

export const loadRooms = (): Record<string, Room> => {
  try {
    if (!fs.existsSync(DATA_FILE)) return {};
    const data = fs.readFileSync(DATA_FILE, 'utf-8');
    return JSON.parse(data);
  } catch (error) {
    console.error('[Persistence] Error loading rooms:', error);
    return {};
  }
};
