PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_tags` (
	`id` text PRIMARY KEY NOT NULL,
	`label` text NOT NULL,
	`created_at` integer DEFAULT ((strftime('%s', 'now') * 1000) + (strftime('%f', 'now') % 1 * 1000)) NOT NULL,
	`updated_at` integer DEFAULT ((strftime('%s', 'now') * 1000) + (strftime('%f', 'now') % 1 * 1000)) NOT NULL,
	`deleted_at` integer
);
--> statement-breakpoint
INSERT INTO `__new_tags`("id", "label", "created_at", "updated_at", "deleted_at") SELECT "id", "label", "created_at", "updated_at", "deleted_at" FROM `tags`;--> statement-breakpoint
DROP TABLE `tags`;--> statement-breakpoint
ALTER TABLE `__new_tags` RENAME TO `tags`;--> statement-breakpoint
PRAGMA foreign_keys=ON;--> statement-breakpoint
CREATE TABLE `__new_tasks` (
	`id` text PRIMARY KEY NOT NULL,
	`title` text NOT NULL,
	`summary` text DEFAULT '' NOT NULL,
	`created_at` integer DEFAULT ((strftime('%s', 'now') * 1000) + (strftime('%f', 'now') % 1 * 1000)) NOT NULL,
	`updated_at` integer DEFAULT ((strftime('%s', 'now') * 1000) + (strftime('%f', 'now') % 1 * 1000)) NOT NULL,
	`deleted_at` integer
);
--> statement-breakpoint
INSERT INTO `__new_tasks`("id", "title", "summary", "created_at", "updated_at", "deleted_at") SELECT "id", "title", "summary", "created_at", "updated_at", "deleted_at" FROM `tasks`;--> statement-breakpoint
DROP TABLE `tasks`;--> statement-breakpoint
ALTER TABLE `__new_tasks` RENAME TO `tasks`;--> statement-breakpoint
CREATE INDEX `tasks_title_idx` ON `tasks` (`title`);--> statement-breakpoint
CREATE INDEX `tasks_summary_idx` ON `tasks` (`summary`);