use std::cmp::Ordering;

use wasm_bindgen::prelude::*;

#[wasm_bindgen]
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum StPriority {
    Low,
    Medium,
    High,
}

impl Ord for StPriority {
    fn cmp(&self, other: &Self) -> Ordering {
        let self_priority = match self {
            StPriority::High => -1,
            StPriority::Medium => 0,
            StPriority::Low => 1,
        };

        let other_priority = match other {
            StPriority::High => -1,
            StPriority::Medium => 0,
            StPriority::Low => 1,
        };

        if self_priority < other_priority {
            Ordering::Greater
        } else if self_priority > other_priority {
            Ordering::Less
        } else {
            Ordering::Equal
        }
    }
}

impl PartialOrd for StPriority {
    fn partial_cmp(&self, other: &Self) -> Option<Ordering> {
        Some(self.cmp(other))
    }
}
