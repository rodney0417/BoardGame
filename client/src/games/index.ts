import { lazy } from 'react';

const Pictomania = lazy(() => import('./pictomania/Pictomania'));
const Uno = lazy(() => import('./uno/Uno'));

const GAME_COMPONENTS: Record<string, React.LazyExoticComponent<React.ComponentType<{ socket: any, room: any, me: any }>>> = {
  pictomania: Pictomania,
  uno: Uno
};

export default GAME_COMPONENTS;
