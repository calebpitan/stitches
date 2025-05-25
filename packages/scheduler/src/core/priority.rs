use core::cmp::Ordering;

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
        let value_of = |v: &Self| match v {
            Self::High => -1,
            Self::Medium => 0,
            Self::Low => 1,
        };

        let self_priority = value_of(&self);
        let other_priority = value_of(&other);

        // place other before self for an inverse ordering
        other_priority.cmp(&self_priority)
    }
}

impl PartialOrd for StPriority {
    fn partial_cmp(&self, other: &Self) -> Option<Ordering> {
        Some(self.cmp(other))
    }
}
