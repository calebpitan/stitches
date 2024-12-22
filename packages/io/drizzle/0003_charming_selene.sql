CREATE TABLE `completions` (
	`id` text PRIMARY KEY NOT NULL,
	`task_id` text NOT NULL,
	`time_series_id` text NOT NULL,
	`completed_at` integer NOT NULL,
	`created_at` integer DEFAULT (strftime('%s', 'now') || substr(strftime('%f', 'now'), -3)) NOT NULL,
	`updated_at` integer DEFAULT (strftime('%s', 'now') || substr(strftime('%f', 'now'), -3)) NOT NULL,
	`deleted_at` integer,
	FOREIGN KEY (`task_id`) REFERENCES `tasks`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`time_series_id`) REFERENCES `time_series`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `completions_timeSeriesId_unique` ON `completions` (`time_series_id`);--> statement-breakpoint
CREATE TABLE `time_series` (
	`id` text PRIMARY KEY NOT NULL,
	`task_id` text NOT NULL,
	`due_at` integer NOT NULL,
	`created_at` integer DEFAULT (strftime('%s', 'now') || substr(strftime('%f', 'now'), -3)) NOT NULL,
	`updated_at` integer DEFAULT (strftime('%s', 'now') || substr(strftime('%f', 'now'), -3)) NOT NULL,
	`deleted_at` integer,
	FOREIGN KEY (`task_id`) REFERENCES `tasks`(`id`) ON UPDATE no action ON DELETE cascade
);
