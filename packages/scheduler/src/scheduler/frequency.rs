use wasm_bindgen::prelude::*;

use super::cron::StCronSchedule;

#[derive(Debug, Clone, PartialEq, Eq)]
pub enum StFrequency {
    Regular(StRegularFrequency),
    Custom(StCustomFrequency),
}

#[wasm_bindgen]
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum StFrequencyType {
    Hour,
    Day,
    Week,
    Month,
    Year,
    Custom,
}

#[wasm_bindgen]
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub struct StRegularFrequency {
    r#type: StFrequencyType,
    until: u64,
}

#[wasm_bindgen]
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct StCustomFrequency {
    r#type: StFrequencyType,
    until: u64,
    crons: [StCronSchedule; 3],
}
