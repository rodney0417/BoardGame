import { lazy } from 'react';

const Pictomania = lazy(() => import('./pictomania/Pictomania'));
const Uno = lazy(() => import('./uno/Uno'));
const Take6 = lazy(() => import('./take6/Take6'));

const GAME_COMPONENTS: Record<
  string,
  React.LazyExoticComponent<React.ComponentType<{ socket: any; room: any; me: any; onLeaveRoom: () => void }>>
> = {
  pictomania: Pictomania,
  uno: Uno,
  take6: Take6,
};

export default GAME_COMPONENTS;
