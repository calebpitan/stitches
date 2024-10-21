use std::cmp::{max, Ordering};

use wasm_bindgen::prelude::*;

use crate::scheduler::frequency::{StCustomFrequency, StFrequency, StRegularFrequency};
use crate::scheduler::priority::StPriority;
use crate::scheduler::time::{parse_cron_expr, utc_now, Timestamp};

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
                return Some(cstm_freq.clone());
            }
        }

        None
    }

    pub fn get_regular_frequency(&self) -> Option<StRegularFrequency> {
        if let Some(freq) = &self.frequency {
            if let StFrequency::Regular(reg_freq) = &freq {
                return Some(*reg_freq);
            }
        }

        None
    }

    pub fn is_passed(&self) -> bool {
        Timestamp::Millis(self.timestamp) < utc_now()
    }

    pub fn get_upcoming_schedule(&self) -> Option<StSchedule> {
        // Check if the current schedule has passed and generate the next
        // schedule relative to now from the StSchedule struct
        if !self.is_passed() {
            return None;
        }

        match &self.frequency {
            Some(freq) => match freq {
                StFrequency::Custom(cstm_freq) => {
                    let crons = cstm_freq.get_crons_expressions();
                    let timestamp = crons
                        .iter()
                        .take(3)
                        .map(|c| {
                            let ref_time = Timestamp::Millis(self.timestamp);
                            let cur_time = utc_now();
                            let time = parse_cron_expr(
                                c.as_str(),
                                Some(max(ref_time, cur_time)),
                            );

                            Timestamp::Millis(time.timestamp_millis() as u64)
                        })
                        .max();

                    timestamp.map(|t| {
                        StSchedule::with_custom(
                            &self.id,
                            t.to_ms(),
                            cstm_freq.clone(),
                            self.priority,
                        )
                    })
                }

                StFrequency::Regular(reg_freq) => Some(StSchedule::with_regular(
                    &self.id,
                    self.timestamp,
                    *reg_freq,
                    self.priority,
                )),
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
