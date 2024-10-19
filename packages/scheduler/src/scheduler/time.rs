use std::time::{SystemTime, UNIX_EPOCH};

pub fn utc_now() -> u128 {
    let start = SystemTime::now();
    let epoch = start
        .duration_since(UNIX_EPOCH)
        .expect("Time went backwards");

    epoch.as_millis()
}
