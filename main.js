import { app, BrowserWindow, dialog, ipcMain } from 'electron';
import { join } from 'path';
import { addGame, getGames, updatePinnedStatusById, getGameById, updateGameInfoById, deleteGameById ,downloadImage} from './src/db/dbInteract.js';
import fs from 'fs';
import { db, dbDataPath } from './src/db/db.js';
import fsPromise from 'fs/promises';

let mainWindow;

const imageDataPath = join(app.getPath('userData'), 'images');
fs.mkdirSync(imageDataPath, { recursive: true });

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 900,
    height: 640,
    frame: false,
    webPreferences: {
      preload: join(import.meta.dirname, 'preload.js'), // Add a preload script
      contextIsolation: true, // Enable context isolation for security
    },
    autoHideMenuBar: true, // Hide the default menu bar
  });

  mainWindow.loadFile('./src/main/index.html');

}

app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

ipcMain.handle('window-minimize', async (event) => {
  mainWindow.minimize();
});

ipcMain.handle('window-maximize', async (event) => {
  if (mainWindow.isMaximized()) {
    mainWindow.unmaximize();
  } else {
    mainWindow.maximize();
  }
});

ipcMain.handle('window-close', async (event) => {
  mainWindow.close();
});


// IPC Handlers
ipcMain.handle('add-game', async (event, gameName, userId, password, theme, logoUrl, tags, isPinned, modifiedAt, remote_logoUrl) => {
  try {

    await addGame(gameName, userId, password, theme, logoUrl, tags, isPinned, modifiedAt, remote_logoUrl);
    return { success: true };
  } catch (e) {
    return { success: false, message: "Failed to add game" };
  }

});

ipcMain.handle('get-games', async () => {

  const games = await getGames();
  return games;

});

ipcMain.handle('update-pinned-status-by-id', async (event, gameId, isPinned, date) => {
  try {
    await updatePinnedStatusById(gameId, isPinned, date);
    return { success: true, message: 'Pinned status updated successfully!' };
  } catch (e) {
    return { success: false, message: 'Game not found!' };
  }

});

ipcMain.handle('get-game-by-id', async (event, gameId) => {

  const game = await getGameById(gameId);
  return game;
})

ipcMain.handle('update-game-info-by-id', async (event, gameId, gameName, userId, password, theme, logoUrl, tags, isPinned, modifiedAt) => {
  try{
  const response = await updateGameInfoById(gameId, gameName, userId, password, theme, logoUrl, tags, isPinned, modifiedAt);
  if(response.failedImage){
    return {success:true,message:'Image download failed! Recheck URL or Retry',failedImage:true};
  }
  return {success:true,message:'Game updated successfully!'};

  
  }catch(e){
    return {success:false,message:'Game not Found!'};
  }
  
})

ipcMain.handle('delete-game', async (event, gameId) => {
  try {
    await deleteGameById(gameId);

    return { success: true, message: 'Game deleted successfully!' };
  } catch (e) {
    return { success: true, message: 'Game not found!' };
  }
})


// Backup handler
ipcMain.handle('backup-db', async (event) => {
  try {
    const { filePath } = await dialog.showSaveDialog({
      title: 'Save Database Backup',
      defaultPath: `db-backup-${Date.now()}.json`,
      filters: [{ name: 'JSON Files', extensions: ['json'] }]
    });

    if (filePath) {
      await fsPromise.copyFile(dbDataPath, filePath);
      return { success: true, message: 'Backup created successfully' };
    }
    return { success: false, message: 'Backup canceled' };
  } catch (error) {
    return { success: false, message: `Backup failed: ${error.message}` };
  }
});

async function deleteAllGameImages() {
  fs.readdir(imageDataPath, (err, files) => {
    if (err) {
      return console.error(`Unable to scan directory: ${err}`);
    }

    files.forEach((file) => {
      const filePath = join(imageDataPath, file);

      fs.stat(filePath, (err, stat) => {
        if (err) {
          return console.error(`Unable to stat file: ${err}`);
        }

        if (stat.isFile()) {
          fs.unlink(filePath, (err) => {
            if (err) {
              return console.error(`Unable to delete file: ${err}`);
            }

          });
        }
      });
    });
  });
}

// Restore handler
ipcMain.handle('restore-db', async (event) => {
  try {
    const { filePaths } = await dialog.showOpenDialog({
      title: 'Select Database Backup',
      filters: [{ name: 'JSON Files', extensions: ['json'] }],
      properties: ['openFile']
    });

    if (filePaths && filePaths.length > 0) {
      await fsPromise.copyFile(filePaths[0], dbDataPath);

      // Reload the database
      await db.read();
      await deleteAllGameImages()
      for (const game of db.data.games) {

        await downloadImage(game.logoUrl, game.localLogoUrl)
      }

      return { success: true, message: 'Database restored successfully' };
    }
    return { success: false, message: 'Restore canceled' };
  } catch (error) {
    return { success: false, message: `Restore failed: ${error.message}` };
  }
});

ipcMain.handle('select-logo-url', async () => {
  const { filePaths } = await dialog.showOpenDialog({
    title: 'Select Image File',
    filters: [{ name: 'Images', extensions: ['png', 'jpeg', 'jpg', 'webp'] }],
    properties: ['openFile']
  });


  if (filePaths.length > 0) {



    return { success: true, message: 'Image Selected successfully', filePaths: filePaths[0] };

  } else {
    return { success: false, message: 'Image upload canceled' };
  }


})