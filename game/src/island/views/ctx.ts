import type { Container } from 'pixi.js';
import type { IslandCamera } from '../camera';
import type { TweenBag } from '../../ui/hud/tweenBag';

/** Layers + callbacks the island views share with the scene. */
export interface IslandCtx {
  ground: Container;
  objects: Container;
  bubbles: Container;
  wfx: Container;
  cam: IslandCamera;
  bag: TweenBag;
  tapOk(): boolean;
}
