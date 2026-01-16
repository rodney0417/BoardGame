import { GameModule } from '../types';
import Pictomania from './pictomania/index';
import Uno from './uno/index';
import Take6 from './take6/index';

const games: Record<string, GameModule> = {
  [Pictomania.id]: Pictomania,
  [Uno.id]: Uno,
  [Take6.id]: Take6,
};

export default games;
