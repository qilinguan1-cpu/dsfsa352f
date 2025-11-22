export interface Block {
  id: string;
  type: 'text' | 'image';
  content: string;
  fontSize?: number; // Multiplier, e.g., 1.0, 1.25, 1.5
}

export interface Character {
  id: string;
  name: string;
  role: string;
  race: string;
  description: string;
  avatar?: string;
}

export interface Concept {
  id: string;
  title: string;
  category: string;
  content: string; // Legacy support
  blocks: Block[];
}

export interface LoreItem {
  id: string;
  title: string;
  category: string;
  content: string; // Legacy support
  blocks: Block[];
}

export interface TimelineEvent {
  id: string;
  trackId?: string;
  year: string;
  endYear?: string;
  title: string;
  description: string;
  image?: string;
}

export interface TimelineTrack {
  id: string;
  name: string;
  color: string;
}

export interface MapMarker {
  id: string;
  x: number;
  y: number;
  label: string;
  description: string;
  type: string;
  customColor?: string;
}

export interface WorldMap {
  id: string;
  name: string;
  width: number;
  height: number;
  color?: string;
  backgroundImage?: string;
  markers: MapMarker[];
}

export interface Relation {
  id: string;
  sourceId: string;
  targetId: string;
  type: string;
}

export interface CustomNode {
  id: string;
  x: number;
  y: number;
  label: string;
  type: 'person' | 'item' | 'event' | 'concept';
  color?: string;
}

export interface CustomEdge {
  id: string;
  sourceId: string;
  targetId: string;
  label: string;
}

export interface CustomGraph {
  id: string;
  name: string;
  nodes: CustomNode[];
  edges: CustomEdge[];
}

export interface CustomTheme {
  backgroundColor?: string;
  textColor?: string;
  panelColor?: string;
  panelOpacity?: number;
  borderColor?: string;
}

export interface World {
  id: string;
  name: string;
  description: string;
  descriptionBlocks: Block[];
  genre: string;
  theme: string;
  customTheme?: CustomTheme;
  timeUnit: string;
  coverImage?: string;
  concepts: Concept[];
  characters: Character[];
  timeline: TimelineEvent[];
  timelineTracks: TimelineTrack[];
  lore: LoreItem[];
  maps: WorldMap[];
  relations: Relation[]; // Character relations
  customGraphs: CustomGraph[]; // New custom relation graphs
  lastModified: number;
}

export interface ThemeConfig {
  bg: string;
  text: string;
  border: string;
  hover: string;
  ring: string;
  gradient: string;
  hex: string;
}