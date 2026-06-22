// src/lib/microcms.ts
import { createClient } from 'microcms-js-sdk';
import type { Note, Project, ProjectStatus, ProjectPattern, ExhibitionOrPublication } from '../types';

const client = createClient({
  serviceDomain: import.meta.env.MICROCMS_SERVICE_DOMAIN,
  apiKey: import.meta.env.MICROCMS_API_KEY,
});

// ---------- Project ----------

type CmsProject = {
  id: string;
  createdAt: string;
  name?: string;
  nameEn?: string;
  pattern?: string[];
  period?: string;
  status?: string[];
  showStatus?: boolean;
  coverImage?: { url: string };
  photos?: Array<{ fieldId: string; image: { url: string }; caption?: string }>;
  summary?: string;
  summaryEn?: string;
  statement?: string;
  statementEn?: string;
  startingQuestion?: string;
  includeProcess?: boolean;
  process?: Array<{ fieldId: string; date?: string; text?: string; photo?: { url: string } }>;
  exhibitions?: Array<{ fieldId: string; title?: string; type?: string[]; date?: string; venueOrPublisher?: string; summary?: string; externalLink?: string }>;
  collaborators?: Array<{ fieldId: string; name?: string; role?: string }>;
  credits?: Array<{ fieldId: string; name?: string; role?: string }>;
};

function toProject(item: CmsProject): Project {
  return {
    id: item.id,
    name: item.name ?? '',
    nameEn: item.nameEn,
    period: item.period,
    status: item.status?.[0]?.trim() as ProjectStatus | undefined,
    showStatus: item.showStatus ?? false,
    pattern: (item.pattern?.[0] as ProjectPattern) ?? 'A',
    coverImage: item.coverImage ? { url: item.coverImage.url, order: 0 } : undefined,
    photos: item.photos?.map((p, i) => ({
      url: p.image.url,
      caption: p.caption,
      order: i,
    })) ?? [],
    summary: item.summary ?? '',
    summaryEn: item.summaryEn,
    statement: item.statement ?? '',
    statementEn: item.statementEn,
    startingQuestion: item.startingQuestion,
    includeProcess: item.includeProcess ?? false,
    process: item.process?.map(p => ({
      date: p.date,
      text: p.text ?? '',
      photos: p.photo ? [{ url: p.photo.url, order: 0 }] : undefined,
    })),
    exhibitions: item.exhibitions?.map(e => ({
      title: e.title ?? '',
      type: (e.type?.[0] as ExhibitionOrPublication['type']) ?? 'Exhibition',
      date: e.date ?? '',
      venueOrPublisher: e.venueOrPublisher,
      summary: e.summary,
      externalLink: e.externalLink,
    })),
    collaborators: item.collaborators?.map(c => ({ name: c.name ?? '', role: c.role ?? '' })),
    credits: item.credits?.map(c => ({ name: c.name ?? '', role: c.role ?? '' })),
  };
}

export async function getProjects(): Promise<Project[]> {
  const res = await client.getList<CmsProject>({
    endpoint: 'projects',
    queries: { limit: 100, orders: '-publishedAt' },
  });
  return (res.contents as CmsProject[]).map(toProject);
}

export async function getProject(id: string): Promise<Project | undefined> {
  try {
    const item = await client.getListDetail<CmsProject>({
      endpoint: 'projects',
      contentId: id,
    });
    return toProject(item as CmsProject);
  } catch {
    return undefined;
  }
}

// ---------- Note ----------

type CmsNote = {
  title?: string;
  body?: string;
  date?: string;
  type?: string;
  photo?: { url: string };
  relatedProjectIds?: string;
};

function toNote(item: CmsNote & { id: string; createdAt: string }): Note {
  return {
    id: item.id,
    title: item.title,
    body: item.body ?? '',
    date: item.date ? item.date.slice(0, 10) : item.createdAt.slice(0, 10),
    type: item.type ?? 'Daily',
    photo: item.photo ? { url: item.photo.url, order: 0 } : undefined,
    relatedProjectIds: item.relatedProjectIds
      ?.split(',')
      .map((s: string) => s.trim())
      .filter(Boolean) ?? [],
  };
}

export async function getNotes(): Promise<Note[]> {
  const res = await client.getList<CmsNote>({
    endpoint: 'notes',
    queries: { limit: 100, orders: '-publishedAt' },
  });
  return (res.contents as Array<CmsNote & { id: string; createdAt: string }>).map(toNote);
}

export async function getNote(id: string): Promise<Note | undefined> {
  try {
    const item = await client.getListDetail<CmsNote>({
      endpoint: 'notes',
      contentId: id,
    });
    return toNote(item as CmsNote & { id: string; createdAt: string });
  } catch {
    return undefined;
  }
}
