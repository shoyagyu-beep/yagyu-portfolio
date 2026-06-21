// src/lib/microcms.ts
import { createClient } from 'microcms-js-sdk';
import type { Project } from '../types';

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
