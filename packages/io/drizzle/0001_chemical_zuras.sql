CREATE TABLE `custom_frequencies` (
	`id` text PRIMARY KEY NOT NULL,
	`schedule_id` text NOT NULL,
	`type` text GENERATED ALWAYS AS (custom) VIRTUAL NOT NULL,
	`crons` text NOT NULL,
	`created_at` integer DEFAULT (strftime('%s', 'now') || substr(strftime('%f', 'now'), -3)) NOT NULL,
	`updated_at` integer DEFAULT (strftime('%s', 'now') || substr(strftime('%f', 'now'), -3)) NOT NULL,
	`deleted_at` integer,
	FOREIGN KEY (`schedule_id`) REFERENCES `schedules`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `custom_frequencies_scheduleId_unique` ON `custom_frequencies` (`schedule_id`);--> statement-breakpoint
CREATE TABLE `regular_frequencies` (
	`id` text PRIMARY KEY NOT NULL,
	`schedule_id` text NOT NULL,
	`type` text NOT NULL,
	`created_at` integer DEFAULT (strftime('%s', 'now') || substr(strftime('%f', 'now'), -3)) NOT NULL,
	`updated_at` integer DEFAULT (strftime('%s', 'now') || substr(strftime('%f', 'now'), -3)) NOT NULL,
	`deleted_at` integer,
	FOREIGN KEY (`schedule_id`) REFERENCES `schedules`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `regular_frequencies_scheduleId_unique` ON `regular_frequencies` (`schedule_id`);--> statement-breakpoint
CREATE TABLE `regular_frequency_exprs` (
	`id` text PRIMARY KEY NOT NULL,
	`regular_frequency_id` text NOT NULL,
	`every` integer NOT NULL,
	`created_at` integer DEFAULT (strftime('%s', 'now') || substr(strftime('%f', 'now'), -3)) NOT NULL,
	`updated_at` integer DEFAULT (strftime('%s', 'now') || substr(strftime('%f', 'now'), -3)) NOT NULL,
	`deleted_at` integer,
	FOREIGN KEY (`regular_frequency_id`) REFERENCES `regular_frequencies`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `regular_frequency_exprs_regularFrequencyId_unique` ON `regular_frequency_exprs` (`regular_frequency_id`);--> statement-breakpoint
CREATE TABLE `regular_frequency_monthly_days_subexprs` (
	`id` text PRIMARY KEY NOT NULL,
	`regular_frequency_monthly_subexpr_id` text NOT NULL,
	`days` integer NOT NULL,
	`created_at` integer DEFAULT (strftime('%s', 'now') || substr(strftime('%f', 'now'), -3)) NOT NULL,
	`updated_at` integer DEFAULT (strftime('%s', 'now') || substr(strftime('%f', 'now'), -3)) NOT NULL,
	`deleted_at` integer,
	FOREIGN KEY (`regular_frequency_monthly_subexpr_id`) REFERENCES `regular_frequency_monthly_subexprs`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `regular_frequency_monthly_days_subexprs_regularFrequencyMonthlySubexprId_unique` ON `regular_frequency_monthly_days_subexprs` (`regular_frequency_monthly_subexpr_id`);--> statement-breakpoint
CREATE TABLE `regular_frequency_monthly_ordinal_subexprs` (
	`id` text PRIMARY KEY NOT NULL,
	`regular_frequency_monthly_subexpr_id` text NOT NULL,
	`weekday` integer NOT NULL,
	`ordinal` text NOT NULL,
	`created_at` integer DEFAULT (strftime('%s', 'now') || substr(strftime('%f', 'now'), -3)) NOT NULL,
	`updated_at` integer DEFAULT (strftime('%s', 'now') || substr(strftime('%f', 'now'), -3)) NOT NULL,
	`deleted_at` integer,
	FOREIGN KEY (`regular_frequency_monthly_subexpr_id`) REFERENCES `regular_frequency_monthly_subexprs`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `regular_frequency_monthly_ordinal_subexprs_regularFrequencyMonthlySubexprId_unique` ON `regular_frequency_monthly_ordinal_subexprs` (`regular_frequency_monthly_subexpr_id`);--> statement-breakpoint
CREATE TABLE `regular_frequency_monthly_subexprs` (
	`id` text PRIMARY KEY NOT NULL,
	`regular_frequency_subexpr_id` text NOT NULL,
	`type` text NOT NULL,
	`created_at` integer DEFAULT (strftime('%s', 'now') || substr(strftime('%f', 'now'), -3)) NOT NULL,
	`updated_at` integer DEFAULT (strftime('%s', 'now') || substr(strftime('%f', 'now'), -3)) NOT NULL,
	`deleted_at` integer,
	FOREIGN KEY (`regular_frequency_subexpr_id`) REFERENCES `regular_frequency_subexprs`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `regular_frequency_monthly_subexprs_regularFrequencySubexprId_unique` ON `regular_frequency_monthly_subexprs` (`regular_frequency_subexpr_id`);--> statement-breakpoint
CREATE TABLE `regular_frequency_subexprs` (
	`id` text PRIMARY KEY NOT NULL,
	`regular_frequency_expr_id` text NOT NULL,
	`created_at` integer DEFAULT (strftime('%s', 'now') || substr(strftime('%f', 'now'), -3)) NOT NULL,
	`updated_at` integer DEFAULT (strftime('%s', 'now') || substr(strftime('%f', 'now'), -3)) NOT NULL,
	`deleted_at` integer,
	FOREIGN KEY (`regular_frequency_expr_id`) REFERENCES `regular_frequencies`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `regular_frequency_subexprs_regularFrequencyExprId_unique` ON `regular_frequency_subexprs` (`regular_frequency_expr_id`);--> statement-breakpoint
CREATE TABLE `regular_frequency_weekly_subexprs` (
	`id` text PRIMARY KEY NOT NULL,
	`regular_frequency_subexpr_id` text NOT NULL,
	`weekdays` integer NOT NULL,
	`created_at` integer DEFAULT (strftime('%s', 'now') || substr(strftime('%f', 'now'), -3)) NOT NULL,
	`updated_at` integer DEFAULT (strftime('%s', 'now') || substr(strftime('%f', 'now'), -3)) NOT NULL,
	`deleted_at` integer,
	FOREIGN KEY (`regular_frequency_subexpr_id`) REFERENCES `regular_frequency_subexprs`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `regular_frequency_weekly_subexprs_regularFrequencySubexprId_unique` ON `regular_frequency_weekly_subexprs` (`regular_frequency_subexpr_id`);--> statement-breakpoint
CREATE TABLE `regular_frequency_yearly_in_subexprs` (
	`id` text PRIMARY KEY NOT NULL,
	`regular_frequency_subexpr_id` text NOT NULL,
	`months` integer NOT NULL,
	`created_at` integer DEFAULT (strftime('%s', 'now') || substr(strftime('%f', 'now'), -3)) NOT NULL,
	`updated_at` integer DEFAULT (strftime('%s', 'now') || substr(strftime('%f', 'now'), -3)) NOT NULL,
	`deleted_at` integer,
	FOREIGN KEY (`regular_frequency_subexpr_id`) REFERENCES `regular_frequency_subexprs`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `regular_frequency_yearly_in_subexprs_regularFrequencySubexprId_unique` ON `regular_frequency_yearly_in_subexprs` (`regular_frequency_subexpr_id`);--> statement-breakpoint
CREATE TABLE `regular_frequency_yearly_on_subexprs` (
	`id` text PRIMARY KEY NOT NULL,
	`regular_frequency_subexpr_id` text NOT NULL,
	`variable_weekday` text,
	`constant_weekday` integer,
	`ordinal` text NOT NULL,
	`created_at` integer DEFAULT (strftime('%s', 'now') || substr(strftime('%f', 'now'), -3)) NOT NULL,
	`updated_at` integer DEFAULT (strftime('%s', 'now') || substr(strftime('%f', 'now'), -3)) NOT NULL,
	`deleted_at` integer,
	FOREIGN KEY (`regular_frequency_subexpr_id`) REFERENCES `regular_frequency_subexprs`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `regular_frequency_yearly_on_subexprs_regularFrequencySubexprId_unique` ON `regular_frequency_yearly_on_subexprs` (`regular_frequency_subexpr_id`);--> statement-breakpoint
CREATE TABLE `schedules` (
	`id` text PRIMARY KEY NOT NULL,
	`task_id` text NOT NULL,
	`anchor_timestamp` integer NOT NULL,
	`timestamp` integer NOT NULL,
	`frequency_type` text,
	`created_at` integer DEFAULT (strftime('%s', 'now') || substr(strftime('%f', 'now'), -3)) NOT NULL,
	`updated_at` integer DEFAULT (strftime('%s', 'now') || substr(strftime('%f', 'now'), -3)) NOT NULL,
	`deleted_at` integer,
	FOREIGN KEY (`task_id`) REFERENCES `tasks`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `schedules_taskId_unique` ON `schedules` (`task_id`);