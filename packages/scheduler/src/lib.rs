mod utils;

mod queue;
mod scheduler;

use wasm_bindgen::prelude::*;

use scheduler::scheduler::StScheduler;

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
        let time = crate::scheduler::time::utc_timestamp().to_datetime().format("%Y-%m-%dT%H:%M:%S%.3f%z");
        $crate::log(&format!("[Scheduler] - {}  INFO  {}", time, &format!($($t)*)));
    };
}

#[macro_export]
macro_rules! console_error {
    ($($t:tt)*) => {
        let time = crate::scheduler::time::utc_timestamp().to_datetime().format("%Y-%m-%dT%H:%M:%S%.3f%z");
        $crate::error(&format!("[Scheduler] - {}  ERROR  {}", time, &format!($($t)*)));
    };
}

#[wasm_bindgen]
pub fn get_scheduler() -> StScheduler {
    let scheduler = StScheduler::new();

    scheduler
}
