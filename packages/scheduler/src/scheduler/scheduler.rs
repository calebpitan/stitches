use std::marker::PhantomData;
use std::thread::sleep;
use std::time::Duration;

use wasm_bindgen::prelude::*;

use super::schedule::StSchedule;
use super::time::utc_now;
use crate::queue::priority_queue::{Comparator, PriorityQueue};

pub struct ClosureComparator<F, T>
where
    F: Fn(&T, &T) -> bool,
{
    func: F,
    _marker: PhantomData<T>,
}

impl<F, T> Comparator<T> for ClosureComparator<F, T>
where
    F: Fn(&T, &T) -> bool,
{
    fn compare(&self, a: &T, b: &T) -> bool {
        (self.func)(a, b)
    }
}

#[wasm_bindgen]
pub struct StScheduler {
    pq: PriorityQueue<StSchedule>,
    _aborted: bool,
}

#[wasm_bindgen]
impl StScheduler {
    pub fn new() -> StScheduler {
        let comparator = ClosureComparator {
            func: |a: &StSchedule, b: &StSchedule| a < b,
            _marker: PhantomData,
        };

        StScheduler {
            pq: PriorityQueue::new(Box::new(comparator)),
            _aborted: false,
        }
    }

    pub fn schedule(&mut self, config: StSchedule) {
        let next_schedule = config.get_next_schedule();

        self.pq.enqueue(next_schedule);
    }

    pub fn run(&mut self) {
        let sleep_duration_ms = 1000;

        self._aborted = false;

        loop {
            if self._aborted {
                break;
            }

            if self.pq.is_empty() {
                sleep(Duration::from_millis(sleep_duration_ms));
                continue;
            }

            let peaked = self.pq.peek().expect("Expected a non-empty queue");
            let timestamp = peaked.get_timestamp();
            let now = utc_now() as u64;
            let difference = timestamp - now;

            if timestamp > now && difference > sleep_duration_ms {
                sleep(Duration::from_millis(sleep_duration_ms));
            } else {
                // trigger an event
            }
        }
    }

    pub fn abort(&mut self) {
        self._aborted = true;
    }
}
