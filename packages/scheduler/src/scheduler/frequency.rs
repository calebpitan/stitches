use wasm_bindgen::prelude::*;

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
    pub ftype: StFrequencyType,
    pub until: Option<u64>,
}

#[wasm_bindgen]
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct StCustomFrequency {
    pub ftype: StFrequencyType,
    pub until: Option<u64>,
    cron_expressions: Vec<String>,
}

#[wasm_bindgen]
impl StRegularFrequency {
    #[wasm_bindgen(constructor)]
    pub fn new(ftype: StFrequencyType, until: Option<u64>) -> Self {
        StRegularFrequency { ftype, until }
    }
}

#[wasm_bindgen]
impl StCustomFrequency {
    #[wasm_bindgen(constructor)]
    pub fn new(until: Option<u64>, cron_expressions: Vec<String>) -> Self {
        StCustomFrequency {
            ftype: StFrequencyType::Custom,
            until,
            cron_expressions,
        }
    }

    pub fn get_crons_expressions(&self) -> Vec<String> {
        self.cron_expressions.clone()
    }
}
