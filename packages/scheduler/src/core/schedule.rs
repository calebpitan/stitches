use core::fmt;
use std::cmp::{max, Ordering};

use chrono::prelude::*;
use wasm_bindgen::prelude::*;

use crate::core::frequency::StConstWeekday;
use crate::core::frequency::StCustomFrequency;
use crate::core::frequency::StFrequencyExpression;
use crate::core::frequency::{StFrequency, StRegularFrequency};
use crate::core::priority::StPriority;
use crate::core::time::{parse_cron_expr, utc_timestamp, Timestamp};
use crate::core::time::{DAY_MILLIS, HOUR_MILLIS, WEEK_MILLIS};
use crate::traits::{Repeating, ID};

#[wasm_bindgen]
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct StSchedule {
    id: String,
    timestamp: Timestamp,
    priority: Option<StPriority>,
    frequency: Option<StFrequency>,
}

impl ID for StSchedule {
    fn get_id(&self) -> String {
        self.get_id()
    }
}

#[wasm_bindgen]
impl StSchedule {
    #[wasm_bindgen(constructor)]
    /// Initializes a structure for schedule representations
    ///
    /// The defualt initializer: useful for schedules without
    /// any repeating frequency
    ///
    /// # Arguments
    ///
    /// * `id` - The identifier for this schedule
    /// * `timestamp` - The timestamp in milliseconds
    /// * `priority` - The priority of schedule used to measure importance
    pub fn new(id: &str, timestamp: i64, priority: Option<StPriority>) -> StSchedule {
        StSchedule {
            id: String::from(id),
            frequency: None,
            priority,
            timestamp: Timestamp::Millis(timestamp),
        }
    }

    /// Initializes a structure for schedule representations
    ///
    /// The regular initializer: useful for schedules with a regular
    /// repeating frequency
    ///
    /// # Arguments
    ///
    /// * `id` - The identifier for this schedule
    /// * `timestamp` - The timestamp in milliseconds
    /// * `freq` - The repeat frequency of schedule
    /// * `priority` - The priority of schedule used to measure importance
    pub fn with_regular(
        id: &str,
        timestamp: i64,
        freq: StRegularFrequency,
        priority: Option<StPriority>,
    ) -> StSchedule {
        StSchedule {
            id: String::from(id),
            frequency: Some(StFrequency::Regular(freq)),
            priority,
            timestamp: Timestamp::Millis(timestamp),
        }
    }

    /// Initializes a structure for schedule representations
    ///
    /// The custom initializer: useful for schedules with a custom (CRON)
    /// repeating frequency
    ///
    /// # Arguments
    ///
    /// * `id` - The identifier for this schedule
    /// * `timestamp` - The timestamp in milliseconds
    /// * `freq` - The repeat frequency of schedule
    /// * `priority` - The priority of schedule used to measure importance
    pub fn with_custom(
        id: &str,
        timestamp: i64,
        freq: StCustomFrequency,
        priority: Option<StPriority>,
    ) -> StSchedule {
        StSchedule {
            id: String::from(id),
            frequency: Some(StFrequency::Custom(freq)),
            priority,
            timestamp: Timestamp::Millis(timestamp),
        }
    }

    fn next_hourly_timestamp(timestamp: Timestamp, hours: u64) -> Timestamp {
        let hour_ms = (HOUR_MILLIS * hours as u64) as f64;
        let current_timestamp = utc_timestamp();

        if timestamp >= current_timestamp {
            return timestamp;
        }

        let elapsed = current_timestamp - timestamp;
        let elapsed_hours_factor = elapsed.as_ms_f64() / hour_ms;
        let next_hour_factor = elapsed_hours_factor.ceil();
        let next_hour_millis = hour_ms * next_hour_factor;

        timestamp + Timestamp::Millis(next_hour_millis as i64)
    }

    fn next_daily_timestamp(timestamp: Timestamp, days: u64) -> Timestamp {
        let day_ms = (DAY_MILLIS * days) as f64;
        let current_timestamp = utc_timestamp();

        if timestamp >= current_timestamp {
            return timestamp;
        }

        let elapsed = current_timestamp - timestamp;
        let elapsed_days_factor = elapsed.as_ms_f64() / day_ms;
        let next_day_factor = elapsed_days_factor.ceil();
        let next_day_millis = day_ms * next_day_factor;

        timestamp + Timestamp::Millis(next_day_millis as i64)
    }

    fn next_weekly_timestamp(timestamp: Timestamp, weeks: u64) -> Timestamp {
        let week_ms = (WEEK_MILLIS * weeks) as f64;
        let current_timestamp = utc_timestamp();

        if timestamp >= current_timestamp {
            return timestamp;
        }

        let elapsed = current_timestamp - timestamp;
        let elapsed_weeks_factor = elapsed.as_ms_f64() / week_ms;
        let next_week_factor = elapsed_weeks_factor.ceil();
        let next_week_millis = week_ms * next_week_factor;

        timestamp + Timestamp::Millis(next_week_millis as i64)
    }

    /// Compute the correction factor that places a weekly `timestamp` at exactly the weekday,
    /// in the same week as the `timestamp`, specified in its schedule frequency.
    ///
    /// It calculates the time in milliseconds that takes the `timestamp` either ahead or behind to
    /// exactly the weekday, from `weekdays`, that outputs the least time in milliseconds.
    ///
    /// This method should be used after [`StSchedule::next_weekly_timestamp`](#method.next_weekly_timestamp)
    /// when `weekdays` is provided.
    ///
    /// Returns a tuple of `(neg: bool, correction: Timestamp)`
    fn next_weekly_correction_factor(
        timestamp: &Timestamp,
        weekdays: &Vec<StConstWeekday>,
    ) -> Timestamp {
        let minimum = weekdays
            .iter()
            .map(|weekday| {
                let datetime = timestamp.to_datetime();
                let ts_weekday = StConstWeekday::from_chrono_weekday(&datetime.weekday());

                // This computes how many days behind or ahead, in the same week, is the
                // timestamp from the day of the specified weekday
                let weekday_offset = StConstWeekday::to_value(&ts_weekday) as i64
                    - StConstWeekday::to_value(weekday) as i64;

                (DAY_MILLIS as i64) * weekday_offset * -1
            })
            .min()
            .unwrap_or(0);

        // if minimum.signum() == -1 {
        // return Timestamp::Millis(minimum);
        // }

        Timestamp::Millis(minimum)
    }

    pub(crate) fn get_id_as_str(&self) -> &str {
        self.id.as_str()
    }

    pub fn get_id(&self) -> String {
        self.id.clone()
    }

    pub fn get_timestamp(&self) -> i64 {
        self.timestamp.as_ms()
    }

    pub fn get_priority(&self) -> Option<StPriority> {
        if let Some(priority) = &self.priority {
            return Some(*priority);
        }

        None
    }

    pub fn get_custom_frequency(&self) -> Option<StCustomFrequency> {
        if let Some(freq) = &self.frequency {
            if let StFrequency::Custom(cstm_freq) = &freq {
                return Some(cstm_freq.to_owned());
            }
        }

        None
    }

    pub fn get_regular_frequency(&self) -> Option<StRegularFrequency> {
        if let Some(freq) = &self.frequency {
            if let StFrequency::Regular(reg_freq) = &freq {
                return Some(reg_freq.to_owned());
            }
        }

        None
    }

    pub fn is_passed(&self) -> bool {
        self.timestamp < utc_timestamp()
    }

    /// Calculate the upcoming schedule for the given schedule
    pub fn get_upcoming_schedule(&self) -> Option<StSchedule> {
        // Check if the current schedule has passed and generate the next
        // schedule relative to now from the StSchedule struct
        if !self.is_passed() {
            return None;
        }

        // TODO!: do not overwrite original timestamp, it should always serve as ref point
        // for generating every subsequent schedule instead keep track of a `next_schedule`
        // field on `StSchedule` that is originally the same as `timestamp`.

        match &self.frequency {
            Some(freq) => match freq {
                StFrequency::Custom(cstm_freq) => {
                    let crons = cstm_freq.get_cron_expressions();
                    let timestamp = crons
                        .iter()
                        .take(3)
                        .map(|cron| {
                            let result = parse_cron_expr(
                                cron.as_str(),
                                cstm_freq.tz_offset,
                                Some(max(&self.timestamp, &utc_timestamp())),
                            );

                            result
                                .map(|v| Timestamp::Millis(v.timestamp_millis()))
                                .unwrap()
                        })
                        .min();

                    timestamp.map(|t| {
                        StSchedule::with_custom(
                            &self.id,
                            t.as_ms(),
                            cstm_freq.to_owned(),
                            self.priority,
                        )
                    })
                }

                // For regular frequencies, match the repetition frequency type and calculate
                // the timestamp in milliseconds for the upcoming schedule
                StFrequency::Regular(reg_freq) => match reg_freq.get_expr() {
                    StFrequencyExpression::Hourly(_expr) => {
                        let next_timestamp = Self::next_hourly_timestamp(
                            self.timestamp,
                            reg_freq.get_expr().every(),
                        );

                        Some(StSchedule::with_regular(
                            &self.id,
                            next_timestamp.as_ms(),
                            reg_freq.to_owned(),
                            self.priority,
                        ))
                    }

                    StFrequencyExpression::Daily(_expr) => {
                        let next_timestamp =
                            Self::next_daily_timestamp(self.timestamp, reg_freq.get_expr().every());

                        Some(StSchedule::with_regular(
                            &self.id,
                            next_timestamp.as_ms(),
                            reg_freq.to_owned(),
                            self.priority,
                        ))
                    }

                    StFrequencyExpression::Weekly(expr) => {
                        let mut next_timestamp = Self::next_weekly_timestamp(
                            self.timestamp,
                            reg_freq.get_expr().every(),
                        );

                        let subexpr = expr.get_subexpr();

                        let correction = Self::next_weekly_correction_factor(
                            &next_timestamp,
                            subexpr.get_weekdays(),
                        );

                        next_timestamp += correction;

                        // TODO: Check for specific days of the week and apply correction to either move
                        // the timestamp forward or backward depending on if the specifies weekday(s) is
                        // after or before the weekday of the timestamp.

                        Some(StSchedule::with_regular(
                            &self.id,
                            next_timestamp.as_ms(),
                            reg_freq.to_owned(),
                            self.priority,
                        ))
                    }

                    _ => Some(StSchedule::with_regular(
                        &self.id,
                        self.timestamp.as_ms(),
                        reg_freq.to_owned(),
                        self.priority,
                    )),
                },
            },
            None => None,
        }
    }
}

impl fmt::Display for StSchedule {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        write!(f, "{:#?}", &self)
    }
}

impl Ord for StSchedule {
    fn cmp(&self, other: &Self) -> std::cmp::Ordering {
        let order = self.timestamp.cmp(&other.timestamp);

        match order {
            Ordering::Equal => self.priority.cmp(&other.priority),
            _ => order,
        }
    }
}

impl PartialOrd for StSchedule {
    fn partial_cmp(&self, other: &Self) -> Option<Ordering> {
        Some(self.cmp(other))
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use wasm_bindgen_test::*;

    wasm_bindgen_test_configure!(run_in_browser);

    static TIMESTAMP: Timestamp = Timestamp::Millis(1729520340000);

    #[test]
    #[wasm_bindgen_test]
    pub fn test_next_hourly_schedule() {
        {
            let hours = 1;
            let next_timestamp = StSchedule::next_hourly_timestamp(TIMESTAMP, hours);

            assert_eq!(
                ((next_timestamp.as_ms() - TIMESTAMP.as_ms()) / HOUR_MILLIS as i64) % hours as i64,
                0,
            )
        }

        {
            let hours = 4;
            let next_timestamp = StSchedule::next_hourly_timestamp(TIMESTAMP, hours);

            assert_eq!(
                ((next_timestamp.as_ms() - TIMESTAMP.as_ms()) / HOUR_MILLIS as i64) % hours as i64,
                0,
            )
        }
    }

    #[test]
    #[wasm_bindgen_test]
    pub fn test_next_weekly_schedule() {
        {
            let weeks = 1;
            let next_timestamp = StSchedule::next_weekly_timestamp(TIMESTAMP, weeks);

            assert_eq!(
                ((next_timestamp.as_ms() - TIMESTAMP.as_ms()) / WEEK_MILLIS as i64) % weeks as i64,
                0,
            )
        }

        {
            let weeks = 3;
            let next_timestamp = StSchedule::next_weekly_timestamp(TIMESTAMP, weeks);

            assert_eq!(
                ((next_timestamp.as_ms() - TIMESTAMP.as_ms()) / WEEK_MILLIS as i64) % weeks as i64,
                0,
            )
        }
    }
}
