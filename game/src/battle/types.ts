/** Combat data types (pure, serializable). Content defines these; the sim interprets them. */
export type ElementId =
  | 'fire'
  | 'water'
  | 'nature'
  | 'earth'
  | 'electric'
  | 'ice'
  | 'wind'
  | 'magic'
  | 'spirit'
  | 'cosmic'
  | 'void'
  // Parte 2 (battle/multiverso.ts)
  | 'light'
  | 'shadow'
  | 'sound'
  | 'time'
  // Parte II · Oleada 1 (battle/cristal.ts)
  | 'crystal'
  | 'neutral';

export type StatusId = 'wet' | 'burning' | 'frozen' | 'charged' | 'rooted' | 'cursed' | 'voided' | 'steam' | 'prism';

export type Trajectory =
  | 'ballistic' // normal arc
  | 'bounce' // bounces once then explodes
  | 'torpedo' // enters water and runs straight under the waterline
  | 'beam' // almost straight, fast (gravity ×0.2)
  | 'spread' // N shards in a fan
  | 'heavy' // gravity ×1.6, pierces layers
  | 'gust' // straight, low damage, leaves a wind current
  | 'seed' // plants roots that tick each turn
  | 'orb' // slow, light gravity, pulls toward nearest mass
  | 'homing' // soft homing toward the aimed cell
  | 'phase' // void: passes through, erasing cells along the line
  | 'meteor' // ultimate: falls from the sky on the aimed x
  | 'cluster' // splits into N bomblets at apex
  | 'ray' // light: dead straight, ignores wind, pierces a line of cells
  | 'wave'; // sound: slow arc that passes through walls (many cells, low damage each)

export interface StatusApply {
  id: StatusId;
  turns: number;
}

export interface ShotDef {
  id: string;
  name: string;
  element: ElementId;
  trajectory: Trajectory;
  /** damage multiplier relative to cat attack */
  power: number;
  /** explosion radius in px */
  radius: number;
  projectiles?: number;
  spreadDeg?: number;
  gravityScale?: number;
  windScale?: number;
  speedMul?: number;
  /** cells pierced before exploding (heavy/phase) */
  pierce?: number;
  /** damage multiplier of each pierced cell (default: heavy 0.9, phase 2.2, ray 0.6, wave 0.3) */
  pierceMul?: number;
  statuses?: StatusApply[];
  /** fraction of trajectory shown in the aim preview (0..1) */
  preview?: number;
  /** extra damage to cats (vs structure) */
  catMul?: number;
  /** structural multiplier */
  structMul?: number;
  limits?: { usesPerBattle?: number; chargeTurns?: number; cooldown?: number };
  /** shouted on ultimate */
  shout?: string;
}

export type Limitation = 'oneShot' | 'charge' | 'berserk' | 'secondLife' | 'shields' | 'glass' | 'unstable' | 'none';

export interface BattleCatDef {
  uid: string;
  catId: string;
  slug: string;
  name: string;
  elements: ElementId[];
  tint?: number;
  level: number;
  stars: number;
  hp: number;
  atk: number;
  shot: ShotDef;
  ultimate?: ShotDef;
  limitation?: Limitation;
  /** initial shields for 'shields' limitation */
  shields?: number;
  /** free-text passive id interpreted by the sim */
  passive?: string;
  /** turns of reload after firing (0 = fires every turn) */
  reload?: number;
  /** initial ultimate meter for this cat (traits: Dormilón) */
  ultStart?: number;
  /** sim effect of its ultimate (battle/ults.ts ULTS) when it isn't the species' own: a FORM's (data/rupturas/formas.ts) */
  ultKey?: string;
}

export interface CatState {
  def: BattleCatDef;
  side: 0 | 1;
  hp: number;
  maxHp: number;
  /** catroom module id on its ship */
  room: number;
  ko: boolean;
  exposed: boolean;
  stunned: number;
  cooldown: number;
  ultCharge: number; // 0..1 meter
  ultUsed: number;
  charging: number; // turns charged for 'charge' limitation
  shields: number;
  lives: number;
  rage: number;
  /** visible status effects on the cat itself (turns left) */
  fx: CatFx;
  /** fell into the sea (room sank) */
  overboard?: boolean;
}

export interface CatFx {
  burning: number;
  shocked: number;
  wet: number;
  frozen: number;
}
