ALTER TABLE `schedules` RENAME COLUMN "anchor_timestamp" TO "anchored_at";--> statement-breakpoint
ALTER TABLE `schedules` RENAME COLUMN "timestamp" TO "due_at";--> statement-breakpoint
ALTER TABLE `schedules` ADD `past_due` integer DEFAULT false NOT NULL;