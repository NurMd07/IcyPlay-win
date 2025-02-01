import mongoose from 'mongoose';

const gameSchema = new mongoose.Schema({
  _id:{ type: String, required: true },
  gameName: { type: String, required: true },
  userId: { type: String, required: true },
  password : { type: String, required: true },
  theme : { type: String },
 logoUrl : { type: String },
  tags : [{ type: String }],
 isPinned : { type: Boolean },
 modifiedAt : { type: String, required: true },
 localLogoUrl : { type: String, default: null, },
});

const Game = mongoose.model('Game', gameSchema);
export default Game;
