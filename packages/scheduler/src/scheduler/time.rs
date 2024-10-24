use chrono::prelude::*;
use cron_parser::parse;
use std::cmp::Ordering;
use std::ops::{Add, Sub};
use std::time::{SystemTime, UNIX_EPOCH};

#[derive(Debug, Clone, Copy)]
pub enum Timestamp {
    Millis(u64),
    #[allow(dead_code)]
    Second(u64),
}

impl Timestamp {
    /// Convert the timestamp to number of milliseconds if it is in seconds
    pub fn to_ms(&self) -> u64 {
        match &self {
            Timestamp::Second(seconds) => seconds * 1_000,
            Timestamp::Millis(milliseconds) => *milliseconds,
        }
    }

    pub fn to_ms_f64(&self) -> f64 {
        self.to_ms() as f64
    }

    /// Convert the timestamp to number of seconds if it is in milliseconds
    pub fn to_sec(&self) -> u64 {
        match &self {
            Timestamp::Second(seconds) => *seconds,
            Timestamp::Millis(milliseconds) => milliseconds / 1_000,
        }
    }

    /// Convert the timestamp to a f64 floating point number of seconds
    /// if it's in milliseconds.
    pub fn to_sec_f64(&self) -> f64 {
        match &self {
            Timestamp::Second(seconds) => *seconds as f64,
            Timestamp::Millis(milliseconds) => (*milliseconds as f64).div(1_000_f64),
        }
    }

    /// Converts `Timestamp` to a `std::time::Duration` in milliseconds
    pub fn to_std_duration(&self) -> std::time::Duration {
        std::time::Duration::from_millis(self.to_ms())
    }

    /// Converts `Timestamp` to a `chrono::DateTime<UTC>` with millisecond precision
    ///
    /// # Panics
    ///
    /// Panics if the given timestamp has an out-of-range number of milliseconds
    pub fn to_datetime(&self) -> DateTime<Utc> {
        DateTime::from_timestamp_millis(self.to_ms() as i64).expect("Invalid timestamp")
    }

    /// Generates a `Timestamp` from a `chrono::DateTime<Utc>`
    pub fn from_datetime(&self, dt: DateTime<Utc>) -> Timestamp {
        Timestamp::Millis(dt.timestamp_millis() as u64)
    }
}

impl Add for Timestamp {
    type Output = Timestamp;

    fn add(self, rhs: Self) -> Self::Output {
        Timestamp::Millis(self.to_ms() + rhs.to_ms())
    }
}

impl Sub for Timestamp {
    type Output = Timestamp;

    fn sub(self, rhs: Self) -> Self::Output {
        Timestamp::Millis(self.to_ms().saturating_sub(rhs.to_ms()))
    }
}

impl PartialEq for Timestamp {
    fn eq(&self, other: &Self) -> bool {
        self.to_ms() == other.to_ms()
    }
}

impl Eq for Timestamp {} // Necessary to implement `Ord`.

impl PartialOrd for Timestamp {
    fn partial_cmp(&self, other: &Self) -> Option<Ordering> {
        self.to_ms().partial_cmp(&other.to_ms())
    }
}

impl Ord for Timestamp {
    fn cmp(&self, other: &Self) -> Ordering {
        self.to_ms().cmp(&other.to_ms())
    }
}

pub fn _utc_now() -> u128 {
    let start = SystemTime::now();
    let epoch = start
        .duration_since(UNIX_EPOCH)
        .expect("Time went backwards");

    epoch.as_millis()
}

pub fn utc_timestamp() -> Timestamp {
    Timestamp::Millis(Utc::now().timestamp_millis() as u64)
}

pub fn parse_cron_expr(expression: &str, after: Option<Timestamp>) -> DateTime<Utc> {
    let after_dt = after
        .as_ref()
        .map(|a| a.to_datetime())
        .unwrap_or_else(|| Utc::now());

    let value = parse(expression, &after_dt);

    match value {
        Ok(result) => result,
        Err(error) => {
            panic!("{}", error)
        }
    }
}
