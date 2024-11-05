CREATE TABLE `tags_to_tasks` (
	`tag_id` text NOT NULL,
	`task_id` text NOT NULL,
	PRIMARY KEY(`tag_id`, `task_id`),
	FOREIGN KEY (`tag_id`) REFERENCES `tags`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`task_id`) REFERENCES `tasks`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `tags` (
	`id` text PRIMARY KEY NOT NULL,
	`label` text NOT NULL,
	`created_at` integer DEFAULT (strftime('%s', 'now') * 1000) + substr(strftime('%f', 'now'), -3) NOT NULL,
	`updated_at` integer DEFAULT (strftime('%s', 'now') * 1000) + substr(strftime('%f', 'now'), -3) NOT NULL,
	`deleted_at` integer
);
--> statement-breakpoint
CREATE TABLE `tasks` (
	`id` text PRIMARY KEY NOT NULL,
	`title` text NOT NULL,
	`summary` text DEFAULT '' NOT NULL,
	`created_at` integer DEFAULT (strftime('%s', 'now') * 1000) + substr(strftime('%f', 'now'), -3) NOT NULL,
	`updated_at` integer DEFAULT (strftime('%s', 'now') * 1000) + substr(strftime('%f', 'now'), -3) NOT NULL,
	`deleted_at` integer
);
--> statement-breakpoint
CREATE INDEX `tasks_title_idx` ON `tasks` (`title`);--> statement-breakpoint
CREATE INDEX `tasks_summary_idx` ON `tasks` (`summary`);