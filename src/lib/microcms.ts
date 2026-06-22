// src/lib/microcms.ts
import { createClient } from 'microcms-js-sdk';
import type { Note, Project } from '../types';

const client = createClient({
  serviceDomain: import.meta.env.MICROCMS_SERVICE_DOMAIN,
  apiKey: import.meta.env.MICROCMS_API_KEY,
});

export async function getProjects(): Promise<Project[]> {
  const res = await client.getList<Project>({
    endpoint: 'projects',
    queries: { limit: 100, orders: '-publishedAt' },
  });
  return res.contents;
}

export async function getProject(id: string): Promise<Project> {
  return client.getListDetail<Project>({
    endpoint: 'projects',
    contentId: id,
  });
}

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
