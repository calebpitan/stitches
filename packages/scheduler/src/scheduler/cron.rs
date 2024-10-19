use wasm_bindgen::prelude::*;

use super::frequency::StFrequencyType;

#[wasm_bindgen]
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct StCronSchedule {
    expression: String,
    frequency: StFrequencyType,
}
