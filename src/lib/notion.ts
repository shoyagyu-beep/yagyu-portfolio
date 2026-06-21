// src/lib/notion.ts
import { Client } from '@notionhq/client';
import { NotionToMarkdown } from 'notion-to-md';
import type { Note } from '../types';

const notion = new Client({ auth: import.meta.env.NOTION_TOKEN });
const n2m = new NotionToMarkdown({ notionClient: notion });

const DB_ID = import.meta.env.NOTION_NOTES_DATABASE_ID;

export async function getNotes(): Promise<Note[]> {
  const res = await notion.databases.query({
    database_id: DB_ID,
    filter: {
      property: '公開フラグ',
      checkbox: { equals: true },
    },
    sorts: [{ property: '日付', direction: 'descending' }],
  });

  const notes = await Promise.all(
    res.results.map(async (page: any) => {
      const props = page.properties;
      const mdBlocks = await n2m.pageToMarkdown(page.id);
      const body = n2m.toMarkdownString(mdBlocks).parent;

      const photo = props['写真']?.files?.[0];

      return {
        id: page.id,
        title: props['Title']?.title?.[0]?.plain_text ?? undefined,
        body,
        date: props['日付']?.date?.start ?? page.created_time.slice(0, 10),
        type: props['種別']?.select?.name ?? 'Daily',
        photo: photo
          ? { url: photo.file?.url ?? photo.external?.url ?? '', order: 0 }
          : undefined,
        relatedProjectIds: props['関連Project']?.rich_text?.[0]?.plain_text
          ?.split(',')
          .map((s: string) => s.trim())
          .filter(Boolean) ?? [],
      } satisfies Note;
    })
  );

  return notes;
}

export async function getNote(id: string): Promise<Note | undefined> {
  const notes = await getNotes();
  return notes.find((n) => n.id === id);
}
