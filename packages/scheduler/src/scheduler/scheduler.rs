use std::marker::PhantomData;

use async_std::task;
use wasm_bindgen::prelude::*;

use crate::console_log;
use crate::queue::priority_queue::{Comparator, PriorityQueue};
use crate::scheduler::schedule::StSchedule;
use crate::scheduler::time::utc_timestamp;
use crate::scheduler::time::Timestamp;

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
    /// A JavaScript function subscribing to the scheduler for updates
    receiver: Option<js_sys::Function>,
    _aborted: bool,
}

#[wasm_bindgen]
pub struct StSchedulerRunner {
    scheduler: StScheduler,
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
            receiver: None,
            _aborted: false,
        }
    }

    async fn idle(&self, till: Option<Timestamp>) {
        let sleep_ts = till.unwrap_or_else(|| Timestamp::Millis(1000));

        console_log!("scheduler idling for {} milliseconds", sleep_ts);

        task::sleep(sleep_ts.to_std_duration()).await
    }

    pub fn add_schedule(&mut self, schedule: StSchedule) {
        if schedule.is_passed() {
            console_log!("Evaluating upcoming schedules");
            let upcoming_schedules = schedule.get_upcoming_schedule();

            match upcoming_schedules {
                Some(s) => {
                    self.pq.enqueue(s);
                    console_log!(
                        "Added an upcoming schedule to queue since original schedule has passed"
                    );
                }
                None => (),
            }
        } else {
            console_log!("Adding schedule to queue");
            self.pq.enqueue(schedule)
        }
    }

    pub fn subscribe(&mut self, receiver: js_sys::Function) {
        console_log!("subscription received");
        self.receiver = Some(receiver)
    }

    pub fn abort(&mut self) {
        if self._aborted == false {
            console_log!("scheduler aborted!");
            self._aborted = true;
        }
    }

    fn unabort(&mut self) {
        if self._aborted == true {
            console_log!("scheduler resumed!");
            self._aborted = false;
        }
    }

    fn isaborted(&self) -> bool {
        return self._aborted == true;
    }

    pub async fn run(&mut self) {
        self.unabort();
        let sleep_ts = Timestamp::Millis(1000);

        console_log!("scheduler running");

        loop {
            if self.isaborted() {
                break;
            }

            if self.pq.is_empty() {
                self.idle(None).await;
                continue;
            }

            let peeked = self.pq.peek().expect("Expected a non-empty queue");
            let peeked_id = peeked.get_id();
            let timestamp = Timestamp::Millis(peeked.get_timestamp());
            let now = utc_timestamp();
            let difference = timestamp - now;

            if timestamp > now {
                console_log!("there are no due schedules yet");
                console_log!("timestamp: {}; current time: {}", timestamp, now);

                if difference > sleep_ts {
                    self.idle(Some(sleep_ts)).await;
                    continue;
                }
                continue;
            } else if timestamp >= now {
                console_log!("dispatching one schedule found to be due");

                let item = self.pq.dequeue().unwrap();
                let item_id = item.get_id();
                assert_eq!(item_id, peeked_id);
                self.receiver
                    .as_ref()
                    .map(|r| r.call1(&JsValue::NULL, &JsValue::from_str(item.get_id().as_str())));
            }
        }
    }
}

#[wasm_bindgen]
impl StSchedulerRunner {
    #[wasm_bindgen(constructor)]
    pub fn new(scheduler: StScheduler) -> Self {
        StSchedulerRunner { scheduler }
    }

    pub fn stop(&mut self) {
        self.scheduler.abort();
    }

    pub fn run(&mut self) {
        self.scheduler.unabort();
    }
}
