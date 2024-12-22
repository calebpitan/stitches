ALTER TABLE `custom_frequencies` RENAME COLUMN "type" TO "unit";--> statement-breakpoint
ALTER TABLE `regular_frequencies` RENAME COLUMN "type" TO "unit";--> statement-breakpoint
ALTER TABLE `schedules` DROP COLUMN `due_at`;--> statement-breakpoint
ALTER TABLE `schedules` DROP COLUMN `past_due`;--> statement-breakpoint
ALTER TABLE `time_series` DROP COLUMN `past_due`;