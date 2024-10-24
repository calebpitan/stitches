use chrono::prelude::*;
use cron_parser::{parse, ParseError};
use std::cmp::Ordering;
use std::ops::{Add, Div, Sub};
use std::time::{SystemTime, UNIX_EPOCH};

pub const HOUR_MILLIS: u32 = 3_600_000;
pub const DAY_MILLIS: u32 = HOUR_MILLIS * 24;
pub const WEEK_MILLIS: u32 = DAY_MILLIS * 7;

#[derive(Debug, Clone, Copy)]
pub enum Timestamp {
    Millis(u64),
    #[allow(dead_code)]
    Second(u64),
}

impl Timestamp {
    /// Convert the timestamp to number of milliseconds if it is in seconds
    pub fn as_ms(&self) -> u64 {
        match &self {
            Timestamp::Second(seconds) => seconds * 1_000,
            Timestamp::Millis(milliseconds) => *milliseconds,
        }
    }

    pub fn as_ms_f64(&self) -> f64 {
        self.as_ms() as f64
    }

    /// Convert the timestamp to number of seconds if it is in milliseconds
    pub fn as_sec(&self) -> u64 {
        match &self {
            Timestamp::Second(seconds) => *seconds,
            Timestamp::Millis(milliseconds) => milliseconds / 1_000,
        }
    }

    /// Convert the timestamp to a f64 floating point number of seconds
    /// if it's in milliseconds.
    pub fn as_sec_f64(&self) -> f64 {
        match &self {
            Timestamp::Second(seconds) => *seconds as f64,
            Timestamp::Millis(milliseconds) => (*milliseconds as f64).div(1_000_f64),
        }
    }

    /// Converts `Timestamp` to a `std::time::Duration` in milliseconds
    pub fn to_std_duration(&self) -> std::time::Duration {
        std::time::Duration::from_millis(self.as_ms())
    }

    /// Converts `Timestamp` to a `chrono::DateTime<UTC>` with millisecond precision
    ///
    /// # Panics
    ///
    /// Panics if the given timestamp has an out-of-range number of milliseconds
    pub fn to_datetime(&self) -> DateTime<Utc> {
        DateTime::from_timestamp_millis(self.as_ms() as i64).expect("Invalid timestamp")
    }

    /// Generates a `Timestamp` from a `chrono::DateTime<Utc>`
    pub fn from_datetime(&self, dt: DateTime<Utc>) -> Timestamp {
        Timestamp::Millis(dt.timestamp_millis() as u64)
    }
}

impl std::fmt::Display for Timestamp {
    fn fmt(&self, f: &mut std::fmt::Formatter) -> std::fmt::Result {
        match self {
            Timestamp::Millis(ms) => write!(f, "{}ms", ms.to_string().as_str()),
            Timestamp::Second(sec) => write!(f, "{}s", sec.to_string().as_str()),
        }
    }
}

impl Add for Timestamp {
    type Output = Timestamp;

    fn add(self, rhs: Self) -> Self::Output {
        Timestamp::Millis(self.as_ms() + rhs.as_ms())
    }
}

impl Sub for Timestamp {
    type Output = Timestamp;

    fn sub(self, rhs: Self) -> Self::Output {
        Timestamp::Millis(self.as_ms().saturating_sub(rhs.as_ms()))
    }
}

impl PartialEq for Timestamp {
    fn eq(&self, other: &Self) -> bool {
        self.as_ms() == other.as_ms()
    }
}

impl Eq for Timestamp {} // Necessary to implement `Ord`.

impl PartialOrd for Timestamp {
    fn partial_cmp(&self, other: &Self) -> Option<Ordering> {
        self.as_ms().partial_cmp(&other.as_ms())
    }
}

impl Ord for Timestamp {
    fn cmp(&self, other: &Self) -> Ordering {
        self.as_ms().cmp(&other.as_ms())
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

/// Parse a cron expression into a UTC DateTime
///
/// # Arguments
///
/// * `expression` - The cron expression to parse into a UTC DateTime.
/// * `tz_offset` - The timezone offset in milliseconds to use to interpret the cron expression.
/// * `start_timestamp` - A timestamp used to specify the minimum datetime the datetime generated from the cron
///     expression must start from.
///
/// # Note
///
/// The `tz_offset` which is a signed integer is needed because:
///
/// 1. A cron expression like `0 18 * * *` is interpreted in the timezone of `start_time`, which is assumed to be UTC
///     (milliseconds).
/// 2. That means `18` is taken as UTC `1800` hours, ignoring the timezone of the client that
///     scheduled it, which, ordinarily, they would believe is in their own timezone.
/// 3. The timezone offset (`tz_offset`) of the client is now being factored in to ensure consistency.
/// 4. Say, the client's timezone is `+0100`, then `tz_offset` will be `3_600_000` which is one hour in
///     milliseconds.
/// 5. Without `tz_offset`, `18` would be `1800` hours UTC, and the generated time would be `1800 + 0100`,
///     making `1900` hours for the client rather than `1800` hours.
pub fn parse_cron_expr(
    expression: &str,
    tz_offset: i32,
    start_timestamp: Option<Timestamp>,
) -> Result<DateTime<Utc>, ParseError> {
    let offset = FixedOffset::east_opt(tz_offset.div(1_000))
        .unwrap_or_else(|| FixedOffset::east_opt(0).unwrap());

    let start_time_utc = start_timestamp
        .as_ref()
        .map(|a| a.to_datetime())
        .unwrap_or_else(|| Utc::now());

    let start_time = offset.from_utc_datetime(&start_time_utc.naive_utc());

    let result = parse(expression, &start_time);

    match result {
        Ok(value) => Result::Ok(value.to_utc()),
        Err(error) => Result::Err(error),
    }
}
