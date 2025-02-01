import { db } from './db.js';
import Game from '../schema/game.js';
import { v4 as uuidv4 } from 'uuid';
import { app } from 'electron';
import { join } from 'path';
import axios from 'axios';
import path from 'path';
import fs from 'fs';
import fsPromise from 'fs/promises';


const appDataPath = app.getPath('userData'); // App's data directory
const imageDataPath = join(appDataPath, 'images');

function sortByModifiedAt(games) {
  games.sort((game1, game2) => {
    if (game1.isPinned !== game2.isPinned) {
      return game2.isPinned - game1.isPinned;
    }
    const date1 = new Date(game1.modifiedAt);
    const date2 = new Date(game2.modifiedAt);
    return date2 - date1;
  })
}
async function downloadImage(url, imageFilePath) {
  try {
    const response = await axios({
      url,
      method: 'GET',
      responseType: 'stream',
    });

    // Save the image to the  imageFilePath
    return new Promise((resolve, reject) => {
      const writer = fs.createWriteStream(imageFilePath);
      response.data.pipe(writer);

      writer.on('finish', () => resolve(imageFilePath));
      writer.on('error', (err) => reject(err));
    });
  } catch (error) {
    throw new Error(error);
  }
}

async function addGame(gameName, userId, password, theme, logoUrl, tags, isPinned, modifiedAt) {
  const _id = uuidv4();
  try {
    let localLogoUrl;
    if (logoUrl) {
      if (logoUrl.startsWith('http') || logoUrl.startsWith('https' || logoUrl.startsWith('ftp'))) {
        const fileName = `image_${Date.now()}.png`; // Generate a unique file name
        const imageFilePath = join(imageDataPath, fileName);
        localLogoUrl = await downloadImage(logoUrl, imageFilePath);
      } else {
        try {
          const fileName = path.basename(logoUrl);
          await fsPromise.copyFile(logoUrl, join(imageDataPath, fileName));
          localLogoUrl = join(imageDataPath, fileName);
        } catch (e) {
          console.error(e);
        }
      }
    }
    const game = new Game({ _id, gameName, userId, password, theme, logoUrl, tags, isPinned, modifiedAt, localLogoUrl });
    // This will throw an error if validation fails
    await game.validate();

    db.data.games.push(game.toObject());  // Use .toObject() here

    sortByModifiedAt(db.data.games);
    await db.write(); // Save to db.json
  } catch (error) {
    throw new Error(error);
   
  }
}

async function updatePinnedStatusById(gameId, isPinned, date) {
  const game = db.data.games.find((game) => game._id === gameId);
  if (game) {
    game.isPinned = isPinned;
    game.modifiedAt = date;
    sortByModifiedAt(db.data.games);
    await db.write();
  }else{
    throw new Error('Game not found');
  }
}

async function getGames() {

  return db.data.games;
}

async function getGameById(gameId) {
  return db.data.games.find((game) => game._id === gameId);
}

async function updateGameInfoById(gameId, gameName, userId, password, theme, logoUrl, tags, isPinned, modifiedAt) {

  const game = db.data.games.find((game) => game._id === gameId);
  let failedImage = false;
  if (game) {
    let localLogoUrl;
    if (game.logoUrl !== logoUrl) {
      fs.existsSync(game.localLogoUrl) && fs.unlinkSync(game.localLogoUrl);
      const fileName = `image_${Date.now()}.png`; // Generate a unique file name
      const imageFilePath = join(imageDataPath, fileName);


      if (logoUrl.startsWith('http') || logoUrl.startsWith('https' || logoUrl.startsWith('ftp'))) {
        try{
        localLogoUrl = await downloadImage(logoUrl, imageFilePath);
        game.localLogoUrl = localLogoUrl;
        }catch(e){
          failedImage = true;
        }
   

      } else {
        try {

          await fsPromise.copyFile(logoUrl, imageFilePath);
        

          localLogoUrl = imageFilePath;

        } catch (e) {
          failedImage = true;
        }
      }
    } else {
      game.localLogoUrl = game.localLogoUrl;
    }

    game.gameName = gameName;
    game.userId = userId;
    game.password = password;
    game.theme = theme;
    game.logoUrl = logoUrl;
    game.tags = tags;
    game.isPinned = isPinned;
    game.modifiedAt = modifiedAt;
    if(localLogoUrl){
    game.localLogoUrl = localLogoUrl;
    }else{
      game.localLogoUrl = '';
    }

    sortByModifiedAt(db.data.games);
    await db.write();

    return { success: true, message: 'Game updated successfully!', failedImage };

  }else{
    throw new Error('Game not found');
  }
}

async function deleteGameById(gameId) {
  const game = db.data.games.find((game) => game._id === gameId);

  if (game) {
    // Extract the local image path from the game data
    const imagePath = game.localLogoUrl;

    // Check if the image exists and delete it
    if (imagePath && fs.existsSync(imagePath)) {
      try {
        await fs.promises.unlink(imagePath);  // Delete the file

      } catch (error) {
        console.error('Error deleting image:', error);
      }
    }
    const index = db.data.games.findIndex((game) => game._id === gameId);
    if (index !== -1) {
      db.data.games.splice(index, 1);

      await db.write();

    }
  }else{
    throw new Error('Game not found');
  }
}


export { addGame, getGames, updatePinnedStatusById, getGameById, updateGameInfoById, deleteGameById ,downloadImage };
