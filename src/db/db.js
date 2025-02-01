import { JSONFilePreset } from 'lowdb/node'
import { join } from 'path'
import { app } from 'electron'
import fs from 'fs';
// Read or create db.json
const defaultData = { games: [] };
fs.mkdirSync(join(app.getPath('userData'),'database'), { recursive: true });
const dbDataPath = join(app.getPath('userData'),'database', 'db.json');

const db = await JSONFilePreset(dbDataPath, defaultData)

export { db , dbDataPath };