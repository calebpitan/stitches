use wasm_bindgen::prelude::*;

use crate::scheduler::frequency::StFrequencyType;

#[wasm_bindgen]
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct StCronSchedule {
    expression: String,
    frequency: StFrequencyType,
}

#[wasm_bindgen]
impl StCronSchedule {
    #[wasm_bindgen(constructor)]
    pub fn new(expression: String, frequency: StFrequencyType) -> Self {
        StCronSchedule {
            expression,
            frequency,
        }
    }

    pub fn get_expression(&self) -> String {
        self.expression.clone()
    }

    pub fn get_frequency(&self) -> StFrequencyType {
        self.frequency
    }
}
