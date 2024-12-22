ALTER TABLE `time_series` ADD `past_due` integer DEFAULT false NOT NULL;--> statement-breakpoint
CREATE UNIQUE INDEX `time_series_taskId_dueAt_unique` ON `time_series` (`task_id`,`due_at`);