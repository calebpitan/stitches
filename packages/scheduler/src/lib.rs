mod utils;

pub mod core;
pub mod queue;
pub mod traits;

use wasm_bindgen::prelude::*;

use core::{
    frequency::{StConstWeekday, StOrdinals},
    scheduler::{StScheduler, StSchedulerRunner},
};
use std::convert::TryInto;

#[wasm_bindgen]
extern "C" {
    #[wasm_bindgen(js_namespace = console)]
    fn log(s: &str);

    #[wasm_bindgen(js_namespace = console)]
    fn error(s: &str);
}

#[macro_export]
macro_rules! console_log {
    ($($t:tt)*) => {
        let time = crate::core::time::timestamp().to_datetime().format("%Y-%m-%dT%H:%M:%S%.3f%z");
        $crate::log(&format!("[Scheduler] - {}  INFO  {}", time, &format!($($t)*)));
    };
}

#[macro_export]
macro_rules! console_error {
    ($($t:tt)*) => {
        let time = crate::core::time::timestamp().to_datetime().format("%Y-%m-%dT%H:%M:%S%.3f%z");
        $crate::error(&format!("[Scheduler] - {}  ERROR  {}", time, &format!($($t)*)));
    };
}

#[wasm_bindgen]
pub fn get_scheduler() -> StScheduler {
    let scheduler = StScheduler::new();
    scheduler
}

#[wasm_bindgen]
pub fn get_scheduler_runner() -> StSchedulerRunner {
    let scheduler = StSchedulerRunner::new();
    scheduler
}

/// Gets the enum variant from a value between 0-6
///
/// # Panics
///
/// When the supplied value is out of bounds, that is, greater than 6
#[wasm_bindgen]
pub fn st_const_weekday_from_value(value: u32) -> StConstWeekday {
    value.try_into().unwrap()
}

/// Gets the enum variant from a value between 0-4 and 255
///
/// 0-4 are First to Fifth, respectively, consecutively, and 255 is Last
///
/// # Panics
///
/// When the supplied value is out of bounds, that is, greater than 4 and less than 255
#[wasm_bindgen]
pub fn st_ordinals_from_value(value: u32) -> StOrdinals {
    StOrdinals::from_value(&value)
}
