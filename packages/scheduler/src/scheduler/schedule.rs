use std::cmp::{max, Ordering};

use wasm_bindgen::prelude::*;

use crate::scheduler::frequency::{HasEvery, StCustomFrequency};
use crate::scheduler::frequency::{StFrequency, StFrequencyType, StRegularFrequency};
use crate::scheduler::priority::StPriority;
use crate::scheduler::time::{parse_cron_expr, utc_timestamp, Timestamp};
use crate::scheduler::time::{DAY_MILLIS, HOUR_MILLIS, WEEK_MILLIS};

#[wasm_bindgen]
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct StSchedule {
    id: String,
    timestamp: u64,
    priority: Option<StPriority>,
    frequency: Option<StFrequency>,
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
    pub fn new(id: &str, timestamp: u64, priority: Option<StPriority>) -> StSchedule {
        StSchedule {
            id: String::from(id),
            frequency: None,
            priority,
            timestamp,
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
        timestamp: u64,
        freq: StRegularFrequency,
        priority: Option<StPriority>,
    ) -> StSchedule {
        StSchedule {
            id: String::from(id),
            frequency: Some(StFrequency::Regular(freq)),
            priority,
            timestamp,
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
        timestamp: u64,
        freq: StCustomFrequency,
        priority: Option<StPriority>,
    ) -> StSchedule {
        StSchedule {
            id: String::from(id),
            frequency: Some(StFrequency::Custom(freq)),
            priority,
            timestamp,
        }
    }

    fn next_hourly_timestamp(timestamp: Timestamp, hours: u32) -> Timestamp {
        let hour_ms = (HOUR_MILLIS * hours) as f64;
        let current_timestamp = utc_timestamp();

        if timestamp >= current_timestamp {
            return timestamp;
        }

        let elapsed = current_timestamp - timestamp;
        let elapsed_hours_factor = elapsed.as_ms_f64() / hour_ms;
        let next_hour_factor = elapsed_hours_factor.ceil();
        let next_hour_millis = hour_ms * next_hour_factor;

        timestamp + Timestamp::Millis(next_hour_millis as u64)
    }

    fn next_daily_timestamp(timestamp: Timestamp, days: u32) -> Timestamp {
        let day_ms = (DAY_MILLIS * days) as f64;
        let current_timestamp = utc_timestamp();

        if timestamp >= current_timestamp {
            return timestamp;
        }

        let elapsed = current_timestamp - timestamp;
        let elapsed_days_factor = elapsed.as_ms_f64() / day_ms;
        let next_day_factor = elapsed_days_factor.ceil();
        let next_day_millis = day_ms * next_day_factor;

        timestamp + Timestamp::Millis(next_day_millis as u64)
    }

    fn next_weekly_timestamp(timestamp: Timestamp, weeks: u32) -> Timestamp {
        let week_ms = (WEEK_MILLIS * weeks) as f64;
        let current_timestamp = utc_timestamp();

        if timestamp >= current_timestamp {
            return timestamp;
        }

        let elapsed = current_timestamp - timestamp;
        let elapsed_weeks_factor = elapsed.as_ms_f64() / week_ms;
        let next_week_factor = elapsed_weeks_factor.ceil();
        let next_week_millis = week_ms * next_week_factor;

        timestamp + Timestamp::Millis(next_week_millis as u64)
    }

    // pub(crate) fn get_id_as_str(&self) -> &str {
    //     self.id.as_str()
    // }

    pub fn get_id(&self) -> String {
        self.id.clone()
    }

    pub fn get_timestamp(&self) -> u64 {
        self.timestamp
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
        Timestamp::Millis(self.timestamp) < utc_timestamp()
    }

    /// Calculate the upcoming schedule for the given schedule
    pub fn get_upcoming_schedule(&self) -> Option<StSchedule> {
        // Check if the current schedule has passed and generate the next
        // schedule relative to now from the StSchedule struct
        if !self.is_passed() {
            return None;
        }

        match &self.frequency {
            Some(freq) => match freq {
                StFrequency::Custom(cstm_freq) => {
                    let crons = cstm_freq.get_cron_expressions();
                    let timestamp = crons
                        .iter()
                        .take(3)
                        .map(|c| {
                            let ref_timestamp = Timestamp::Millis(self.timestamp);
                            let cur_timestamp = utc_timestamp();
                            let result = parse_cron_expr(
                                c.as_str(),
                                cstm_freq.tz_offset,
                                Some(max(ref_timestamp, cur_timestamp)),
                            );

                            result
                                .map(|v| Timestamp::Millis(v.timestamp_millis() as u64))
                                .unwrap()
                        })
                        .min();

                    timestamp.map(move |t| {
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
                StFrequency::Regular(reg_freq) => match reg_freq.ftype {
                    StFrequencyType::Hour => {
                        let next_timestamp = Self::next_hourly_timestamp(
                            Timestamp::Millis(self.timestamp),
                            reg_freq.get_expr().every(),
                        );

                        Some(StSchedule::with_regular(
                            &self.id,
                            next_timestamp.as_ms(),
                            reg_freq.to_owned(),
                            self.priority,
                        ))
                    }

                    StFrequencyType::Day => {
                        let next_timestamp = Self::next_daily_timestamp(
                            Timestamp::Millis(self.timestamp),
                            reg_freq.get_expr().every(),
                        );

                        Some(StSchedule::with_regular(
                            &self.id,
                            next_timestamp.as_ms(),
                            reg_freq.to_owned(),
                            self.priority,
                        ))
                    }

                    StFrequencyType::Week => {
                        let next_timestamp = Self::next_weekly_timestamp(
                            Timestamp::Millis(self.timestamp),
                            reg_freq.get_expr().every(),
                        );

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
                        self.timestamp,
                        reg_freq.to_owned(),
                        self.priority,
                    )),
                },
            },
            None => None,
        }
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
