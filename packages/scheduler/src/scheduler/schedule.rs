use std::cmp::Ordering;

use wasm_bindgen::prelude::*;

use super::{
    frequency::{StCustomFrequency, StFrequency, StRegularFrequency},
    priority::StPriority,
};

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

    pub fn get_next_schedule(&self) -> StSchedule {
        // Check if the current schedule has passed and generate the next
        // schedule relative to now from the StSchedule struct
        let next_schedule = self
            .frequency
            .as_ref()
            .map(|f| {
                if let StFrequency::Custom(cstm_freq) = f {
                    StSchedule::with_custom(
                        &self.id,
                        self.timestamp,
                        cstm_freq.clone(),
                        self.priority,
                    )
                } else if let StFrequency::Regular(reg_freq) = f {
                    StSchedule::with_regular(&self.id, self.timestamp, *reg_freq, self.priority)
                } else {
                    panic!("Unreachable code")
                }
            })
            .unwrap_or(StSchedule::new(&self.id, self.timestamp, self.priority));

        next_schedule
    }
}

impl Ord for StSchedule {
    fn cmp(&self, other: &Self) -> std::cmp::Ordering {
        let order = self.timestamp.cmp(&other.timestamp);

        if let Ordering::Equal = order {
            return self.priority.cmp(&other.priority);
        }

        order
    }
}

impl PartialOrd for StSchedule {
    fn partial_cmp(&self, other: &Self) -> Option<Ordering> {
        Some(self.cmp(other))
    }
}
