mod queue;
mod scheduler;
mod utils;

use wasm_bindgen::prelude::*;

use scheduler::scheduler::StScheduler;

#[wasm_bindgen]
extern "C" {
    fn alert(s: &str);
}

#[wasm_bindgen]
pub fn greet() {
    alert("Hello, scheduler!");
}

#[wasm_bindgen]
pub fn get_scheduler() -> StScheduler {
    let scheduler = StScheduler::new();

    scheduler
}
