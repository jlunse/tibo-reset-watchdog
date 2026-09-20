import { sqliteTable, text } from 'drizzle-orm/sqlite-core';
export const snapshots = sqliteTable('snapshots', { id: text('id').primaryKey(), body: text('body').notNull(), checkedAt: text('checked_at').notNull() });
