// preload.js
const { contextBridge, ipcRenderer } = require('electron'); // Use require instead of import

contextBridge.exposeInMainWorld('electronAPI', {
  addGame: (gameName,userId,password,theme,logoUrl,tags,isPinned,modifiedAt) => ipcRenderer.invoke('add-game',gameName,userId,password,theme,logoUrl,tags,isPinned,modifiedAt),
  getGames: () => ipcRenderer.invoke('get-games'),
  updatePinnedStatusById: (gameId, isPinned,date) => ipcRenderer.invoke('update-pinned-status-by-id',gameId, isPinned,date),
  getGameById: (gameId) => ipcRenderer.invoke('get-game-by-id',gameId),
  updateGameInfoById: (gameId, gameName, userId, password, theme, logoUrl, tags, isPinned, modifiedAt) => ipcRenderer.invoke('update-game-info-by-id',gameId, gameName, userId, password, theme, logoUrl, tags, isPinned, modifiedAt),
  deleteGame: (gameId) => ipcRenderer.invoke('delete-game',gameId),
  minimize: () => ipcRenderer.invoke('window-minimize'),
  maximize: () => ipcRenderer.invoke('window-maximize'),
  close: () => ipcRenderer.invoke('window-close'),
  backupDb: () => ipcRenderer.invoke('backup-db'),
  restoreDb: () => ipcRenderer.invoke('restore-db'),
  selectLogoUrl: () => ipcRenderer.invoke('select-logo-url')
});
