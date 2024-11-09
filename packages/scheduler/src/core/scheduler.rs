use async_std::sync::{Arc, Mutex};
use async_std::{channel, task};

use wasm_bindgen::prelude::*;
use wasm_bindgen_futures::spawn_local;

use crate::core::schedule::StSchedule;
use crate::core::time::utc_timestamp;
use crate::core::time::Timestamp;
use crate::queue::priority_queue::PQComparator;
use crate::queue::priority_queue::PriorityQueue;
use crate::{console_error, console_log};

enum Poll<P, R> {
    Empty,
    Pending(P),
    Ready(R),
}

#[derive(Debug, Clone)]
enum XMessage {
    Abort,
    Remove(String),
    Update(StSchedule),
}

#[wasm_bindgen]
pub struct StScheduler {
    pq: PriorityQueue<StSchedule>,
    /// A JavaScript function subscribing to the scheduler for updates
    subscriber: Option<js_sys::Function>,
    suspended: bool,
}

#[wasm_bindgen]
pub struct StSchedulerRunner {
    sender: channel::Sender<XMessage>,
    receiver: channel::Receiver<XMessage>,
}

// unsafe impl Send for StScheduler {}

#[wasm_bindgen]
impl StScheduler {
    pub fn new() -> StScheduler {
        let comparator = PQComparator::new(|a: &StSchedule, b: &StSchedule| a < b);

        StScheduler {
            pq: PriorityQueue::new(Box::new(comparator)),
            subscriber: None,
            suspended: true,
        }
    }

    pub fn subscribe(&mut self, receiver: js_sys::Function) {
        console_log!("Subscription received!");
        self.subscriber = Some(receiver)
    }

    pub fn add_schedule(&mut self, schedule: StSchedule) {
        let queued_msg = format!("Schedule with ID '{}' queued!", schedule.get_id_as_str());

        if schedule.is_passed() {
            console_log!("Added schedule already passed");
            console_log!("Evaluating upcoming schedules");
            let id = schedule.get_id_as_str();
            let upcoming_schedule = schedule.get_upcoming_schedule();

            match upcoming_schedule {
                Some(s) => {
                    self.pq.enqueue(s);
                    console_log!("{}", queued_msg);
                }
                None => {
                    console_log!("No upcoming schedules for Schedule with ID '{id}'");
                }
            }
        } else {
            self.pq.enqueue(schedule);
            console_log!("{}", queued_msg);
        }
    }

    #[inline]
    fn remove_schedule(&mut self, id: String) -> Option<StSchedule> {
        self.pq.remove(id)
    }

    fn update_schedule(&mut self, schedule: StSchedule) -> bool {
        if let Some(_) = self.remove_schedule(schedule.get_id()) {
            self.add_schedule(schedule);
            true
        } else {
            false
        }
    }

    fn suspend(&mut self) {
        if self.suspended == false {
            console_log!("Scheduler suspended!");
            self.suspended = true;
        }
    }

    fn start(&mut self) {
        if self.suspended == true {
            console_log!("Scheduler running ✅");
            self.suspended = false;
        }
    }

    fn is_suspended(&self) -> bool {
        return self.suspended == true;
    }

    fn poll(&mut self) -> Poll<Timestamp, StSchedule> {
        if self.pq.is_empty() {
            console_log!("Nothing to poll");
            return Poll::Empty;
        }

        let peeked = self.pq.peek().unwrap();
        let peeked_id = peeked.get_id();
        let timestamp = Timestamp::Millis(peeked.get_timestamp());
        let current_timestamp = utc_timestamp();
        let difference = timestamp - current_timestamp;

        if difference > Timestamp::Millis(0) {
            console_log!("Next schedule in {:.3}s", difference.as_sec_f64());
            return Poll::Pending(difference);
        }

        let item = self.pq.dequeue().unwrap();
        let item_id = item.get_id();
        assert_eq!(item_id, peeked_id);

        return Poll::Ready(item);
    }
}

#[wasm_bindgen]
impl StSchedulerRunner {
    #[wasm_bindgen(constructor)]
    pub fn new() -> Self {
        let (tx, rx) = channel::unbounded::<XMessage>();

        StSchedulerRunner {
            sender: tx,
            receiver: rx,
        }
    }

    async fn idle(until: Option<Timestamp>) {
        let sleep_ts = until.unwrap_or_else(|| Timestamp::Millis(1000));
        console_log!("Idling for {}", sleep_ts);
        task::sleep(sleep_ts.to_std_duration()).await
    }

    #[inline]
    fn get_receiver(&self) -> channel::Receiver<XMessage> {
        self.receiver.clone()
    }

    #[inline]
    fn get_sender(&self) -> channel::Sender<XMessage> {
        self.sender.clone()
    }

    pub async fn update_scheduler_with(&self, schedule: StSchedule) -> bool {
        console_log!("Updating schedule with ID '{}':", schedule.get_id_as_str());
        let tx = self.get_sender();
        match tx.send(XMessage::Update(schedule)).await {
            Ok(_) => true,
            Err(error) => {
                console_error!("Failed to update scheduler with new schedule: {}", error);
                false
            }
        }
    }

    pub async fn remove_from_scheduler(&self, schedule_id: String) -> bool {
        console_log!("Removing schedule with ID '{schedule_id}' from scheduler:");
        let tx = self.get_sender();
        match tx.send(XMessage::Remove(schedule_id)).await {
            Ok(_) => true,
            Err(error) => {
                console_error!("Failed to remove schedule from scheduler: {}", error);
                false
            }
        }
    }

    async fn stop(&self) -> bool {
        console_log!("Suspending scheduler:");
        let tx = self.get_sender();
        match tx.send(XMessage::Abort).await {
            Ok(_) => true,
            Err(error) => {
                console_error!("Failed to suspend scheduler: {}", error);
                false
            }
        }
    }

    pub async fn quit(self) {
        console_log!("Quitting the runner:");
        let stopped = self.stop().await;
        drop(self.sender);
        if stopped == false {
            panic!("Graceful suspension of scheduler failed")
        }
        console_log!("Runner quit successfully");
    }

    /// The
    pub async fn run(&self, mut scheduler: StScheduler) {
        if scheduler.is_suspended() == false {
            panic!("Cannot run a scheduler more than once");
        } else {
            scheduler.start();
        }

        let tx = self.get_sender();
        let rx = self.get_receiver();
        let scheduler = Arc::new(Mutex::new(scheduler));
        let scheduler_clone = scheduler.clone();

        spawn_local(async move {
            while let Ok(msg) = rx.recv().await {
                console_log!("Received {:#?} message", msg);
                match msg {
                    XMessage::Abort => {
                        let mut scheduler_lock = scheduler_clone.lock().await;
                        console_log!("Lock acquired on scheduler");
                        scheduler_lock.suspend();
                    }

                    XMessage::Remove(id) => {
                        let mut scheduler_lock = scheduler_clone.lock().await;
                        console_log!("Lock acquired on scheduler");
                        scheduler_lock.remove_schedule(id);
                    }

                    XMessage::Update(schedule) => {
                        let mut scheduler_lock = scheduler_clone.lock().await;
                        console_log!("Lock acquired on scheduler");
                        scheduler_lock.update_schedule(schedule);
                    }
                }
            }
        });

        spawn_local(async move {
            console_log!("Poll started:");
            loop {
                // ***********************************************************************************************
                // We SHOULD NOT hold the lock on scheduler for too long (as long as the loop runs, and sleeps),
                // potentially leading to deadlocks in other places such as the preceeding `spawn_local` block.
                //
                // Since the lock is released when the guard (`MutexGuard`) is dropped (out of scope), we
                // define a short-lived scope for it by wrapping it in a "small" block, and using and dumping it
                // as quickly as possible.
                // ***********************************************************************************************
                let result = {
                    let mut scheduler = scheduler.lock().await;
                    if scheduler.is_suspended() {
                        drop(tx);
                        console_log!("Poll ended!");
                        break;
                    }
                    scheduler.poll()
                };

                match result {
                    Poll::Empty => Self::idle(Some(Timestamp::Millis(1000))).await,
                    Poll::Pending(until) => Self::idle(Some(until)).await,
                    Poll::Ready(result) => {
                        let mut scheduler = scheduler.lock().await;
                        scheduler.subscriber.as_ref().map(|r| {
                            r.call1(&JsValue::NULL, &JsValue::from_str(result.get_id_as_str()))
                        });

                        // Push back
                        scheduler.add_schedule(result);
                    }
                };
            }
        });
    }
}
