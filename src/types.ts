// src/types.ts

export type ProjectStatus = 'ongoing' | 'completed' | 'archive';
export type ProjectPattern = 'A' | 'B' | 'C';

export interface Photo {
  url: string;
  caption?: string;
  order: number;
}

export interface ProcessEntry {
  date?: string;
  text: string;
  photos?: Photo[];
}

export interface ExhibitionOrPublication {
  title: string;
  type: 'Exhibition' | 'Book' | 'Zine' | 'Collaboration';
  date: string;
  venueOrPublisher?: string;
  summary?: string;
  externalLink?: string;
  relatedProjectIds?: string[];
}

export interface Person {
  name: string;
  role: string;
}

export interface Project {
  id: string;
  name: string;
  nameEn?: string;
  period?: string;
  status?: ProjectStatus;
  showStatus: boolean;
  pattern: ProjectPattern;
  coverImage?: Photo;
  summary: string;
  summaryEn?: string;
  statement: string;
  statementEn?: string;
  startingQuestion?: string;
  photos: Photo[];
  includeProcess: boolean;
  process?: ProcessEntry[];
  exhibitions?: ExhibitionOrPublication[];
  collaborators?: Person[];
  credits?: Person[];
}

export interface Note {
  id: string;
  title?: string;
  body: string;
  date: string;
  type: string;
  photo?: Photo;
  relatedProjectIds?: string[];
}

export interface AboutPage {
  name: string;
  bioShort: string;
  bioShortEn?: string;
  bioLong: string;
  bioLongEn?: string;
  artistStatement: string;
  artistStatementEn?: string;
  focusAreas: string[];
  exhibitionHistory: ExhibitionOrPublication[];
  contactEmail: string;
  snsLinks?: { label: string; url: string }[];
  commercialNote?: { text: string; link?: string };
}
