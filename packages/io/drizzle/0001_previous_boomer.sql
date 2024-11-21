CREATE TABLE `custom_frequencies` (
	`id` text PRIMARY KEY NOT NULL,
	`schedule_id` text NOT NULL,
	`type` text,
	`expression` text NOT NULL,
	`created_at` integer DEFAULT (strftime('%s', 'now') || substr(strftime('%f', 'now'), -3)) NOT NULL,
	`updated_at` integer DEFAULT (strftime('%s', 'now') || substr(strftime('%f', 'now'), -3)) NOT NULL,
	`deleted_at` integer,
	FOREIGN KEY (`schedule_id`) REFERENCES `schedules`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `custom_frequencies_scheduleId_expression_unique` ON `custom_frequencies` (`schedule_id`,`expression`);--> statement-breakpoint
CREATE TABLE `regular_frequencies` (
	`id` text PRIMARY KEY NOT NULL,
	`schedule_id` text NOT NULL,
	`type` text NOT NULL,
	`every` integer NOT NULL,
	`created_at` integer DEFAULT (strftime('%s', 'now') || substr(strftime('%f', 'now'), -3)) NOT NULL,
	`updated_at` integer DEFAULT (strftime('%s', 'now') || substr(strftime('%f', 'now'), -3)) NOT NULL,
	`deleted_at` integer,
	FOREIGN KEY (`schedule_id`) REFERENCES `schedules`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `regular_frequencies_scheduleId_unique` ON `regular_frequencies` (`schedule_id`);--> statement-breakpoint
CREATE TABLE `regular_frequency_monthly_days_subexprs` (
	`id` text PRIMARY KEY NOT NULL,
	`regular_frequency_monthly_expr_id` text NOT NULL,
	`days` integer NOT NULL,
	`created_at` integer DEFAULT (strftime('%s', 'now') || substr(strftime('%f', 'now'), -3)) NOT NULL,
	`updated_at` integer DEFAULT (strftime('%s', 'now') || substr(strftime('%f', 'now'), -3)) NOT NULL,
	`deleted_at` integer,
	FOREIGN KEY (`regular_frequency_monthly_expr_id`) REFERENCES `regular_frequency_monthly_exprs`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `regular_frequency_monthly_days_subexprs_regularFrequencyMonthlyExprId_unique` ON `regular_frequency_monthly_days_subexprs` (`regular_frequency_monthly_expr_id`);--> statement-breakpoint
CREATE TABLE `regular_frequency_monthly_exprs` (
	`id` text PRIMARY KEY NOT NULL,
	`regular_frequency_id` text NOT NULL,
	`type` text NOT NULL,
	`created_at` integer DEFAULT (strftime('%s', 'now') || substr(strftime('%f', 'now'), -3)) NOT NULL,
	`updated_at` integer DEFAULT (strftime('%s', 'now') || substr(strftime('%f', 'now'), -3)) NOT NULL,
	`deleted_at` integer,
	FOREIGN KEY (`regular_frequency_id`) REFERENCES `regular_frequencies`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `regular_frequency_monthly_exprs_regularFrequencyId_unique` ON `regular_frequency_monthly_exprs` (`regular_frequency_id`);--> statement-breakpoint
CREATE TABLE `regular_frequency_monthly_ordinal_subexprs` (
	`id` text PRIMARY KEY NOT NULL,
	`regular_frequency_monthly_expr_id` text NOT NULL,
	`ordinal` text NOT NULL,
	`weekday` integer NOT NULL,
	`created_at` integer DEFAULT (strftime('%s', 'now') || substr(strftime('%f', 'now'), -3)) NOT NULL,
	`updated_at` integer DEFAULT (strftime('%s', 'now') || substr(strftime('%f', 'now'), -3)) NOT NULL,
	`deleted_at` integer,
	FOREIGN KEY (`regular_frequency_monthly_expr_id`) REFERENCES `regular_frequency_monthly_exprs`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `regular_frequency_monthly_ordinal_subexprs_regularFrequencyMonthlyExprId_unique` ON `regular_frequency_monthly_ordinal_subexprs` (`regular_frequency_monthly_expr_id`);--> statement-breakpoint
CREATE TABLE `regular_frequency_weekly_exprs` (
	`id` text PRIMARY KEY NOT NULL,
	`regular_frequency_id` text NOT NULL,
	`weekdays` integer NOT NULL,
	`created_at` integer DEFAULT (strftime('%s', 'now') || substr(strftime('%f', 'now'), -3)) NOT NULL,
	`updated_at` integer DEFAULT (strftime('%s', 'now') || substr(strftime('%f', 'now'), -3)) NOT NULL,
	`deleted_at` integer,
	FOREIGN KEY (`regular_frequency_id`) REFERENCES `regular_frequencies`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `regular_frequency_weekly_exprs_regularFrequencyId_unique` ON `regular_frequency_weekly_exprs` (`regular_frequency_id`);--> statement-breakpoint
CREATE TABLE `regular_frequency_yearly_exprs` (
	`id` text PRIMARY KEY NOT NULL,
	`regular_frequency_id` text NOT NULL,
	`months` integer NOT NULL,
	`ordinal` text,
	`variable_weekday` text,
	`constant_weekday` integer,
	`created_at` integer DEFAULT (strftime('%s', 'now') || substr(strftime('%f', 'now'), -3)) NOT NULL,
	`updated_at` integer DEFAULT (strftime('%s', 'now') || substr(strftime('%f', 'now'), -3)) NOT NULL,
	`deleted_at` integer,
	FOREIGN KEY (`regular_frequency_id`) REFERENCES `regular_frequencies`(`id`) ON UPDATE no action ON DELETE cascade,
	CONSTRAINT "mutually_exclusive_inclusive" CHECK(
          (
            ("regular_frequency_yearly_exprs"."ordinal" IS NULL)
              AND 
            ("regular_frequency_yearly_exprs"."constant_weekday" IS NULL)
              AND 
            ("regular_frequency_yearly_exprs"."variable_weekday" IS NULL)
          ) OR (
            (("regular_frequency_yearly_exprs"."ordinal" IS NOT NULL) AND ("regular_frequency_yearly_exprs"."constant_weekday" IS NOT NULL))
              OR 
            (("regular_frequency_yearly_exprs"."ordinal" IS NOT NULL) AND ("regular_frequency_yearly_exprs"."variable_weekday" IS NOT NULL))
          )
        )
);
--> statement-breakpoint
CREATE UNIQUE INDEX `regular_frequency_yearly_exprs_regularFrequencyId_unique` ON `regular_frequency_yearly_exprs` (`regular_frequency_id`);--> statement-breakpoint
CREATE TABLE `schedules` (
	`id` text PRIMARY KEY NOT NULL,
	`task_id` text NOT NULL,
	`anchor_timestamp` integer NOT NULL,
	`timestamp` integer NOT NULL,
	`frequency_type` text,
	`until` integer,
	`created_at` integer DEFAULT (strftime('%s', 'now') || substr(strftime('%f', 'now'), -3)) NOT NULL,
	`updated_at` integer DEFAULT (strftime('%s', 'now') || substr(strftime('%f', 'now'), -3)) NOT NULL,
	`deleted_at` integer,
	FOREIGN KEY (`task_id`) REFERENCES `tasks`(`id`) ON UPDATE no action ON DELETE cascade,
	CONSTRAINT "no_until_without_frequency_type" CHECK(
          (("schedules"."frequency_type" IS NULL) AND ("schedules"."until" IS NULL)) OR ("schedules"."frequency_type" IS NOT NULL)
        )
);
--> statement-breakpoint
CREATE UNIQUE INDEX `schedules_taskId_unique` ON `schedules` (`task_id`);