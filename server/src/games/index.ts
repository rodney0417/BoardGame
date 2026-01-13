import { GameModule } from '../types';
import Pictomania from './pictomania/index';
import Uno from './uno/index';

const games: Record<string, GameModule> = {
  [Pictomania.id]: Pictomania,
  [Uno.id]: Uno,
};

export default games;
