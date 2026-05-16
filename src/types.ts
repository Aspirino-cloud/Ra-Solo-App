export type Sun = number;

export type TileType =
  | 'RA'
  | 'GOD'
  | 'PHARAOH'
  | 'BURIAL'
  | 'NILE'
  | 'FLOOD'
  | 'DROUGHT'
  | 'CIVILIZATION'
  | 'UNREST'
  | 'GOLD'
  | 'MONUMENT'
  | 'EARTHQUAKE';

export type CivSubtype = 'Künste' | 'Landwirtschaft' | 'Religion' | 'Astronomie' | 'Schrift';
export type MonSubtype = 'Festung' | 'Obelisk' | 'Palast' | 'Pyramide' | 'Sphinx' | 'Statuen' | 'Stufenpyramide' | 'Tempel';

export type Difficulty = 'very_easy' | 'easy' | 'medium' | 'hard' | 'expert';

export interface Tile {
  id: string; // unique
  type: TileType;
  subtype?: CivSubtype | MonSubtype;
}

export interface Player {
  id: string;
  name: string;
  isAI: boolean;
  difficulty?: Difficulty;
  activeSuns: Sun[];
  inactiveSuns: Sun[];
  score: number;
  tableau: Tile[];
}

export type GamePhase = 
  | 'action_select' 
  | 'waiting_for_drawn_tile' 
  | 'bidding' 
  | 'auction_result'
  | 'disaster_resolution' 
  | 'epoch_end' 
  | 'game_over';

export interface AuctionResult {
  winnerIndex?: number;
  spentSun?: number;
  wonSun?: number;
  winningTiles: Tile[];
  allPassed: boolean;
  tilesCleared: boolean;
}

export interface ReplayStep {
  message: string;
  explanation?: string;
  stateSnapshot: any; // GameState without replay array
}

export interface GameState {
  epoch: number;
  players: Player[];
  auctionTrack: Tile[];
  raTrack: number;
  centerSun: Sun;
  currentPlayerIndex: number;
  phase: GamePhase;
  
  biddingReason?: 'drawn_ra' | 'called_ra_voluntary' | 'called_ra_forced';
  raCallerIndex?: number;
  biddingOrder: number[];
  currentBidderPos: number;
  highestBid?: Sun;
  highestBidderIndex?: number;
  
  disasterQueue: { playerIndex: number; disasterType: TileType; count: number }[];
  
  logs: string[];
  replay: ReplayStep[];
  auctionResult?: AuctionResult;
}
