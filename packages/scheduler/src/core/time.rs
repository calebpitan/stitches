use core::cmp::Ordering;
use core::ops::{Add, AddAssign, Div, DivAssign, Mul, MulAssign, Rem, RemAssign, Sub, SubAssign};

use chrono::prelude::*;

pub const INDEXED_MONTH_DAYS: &[u32; 12] = &[31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
pub const HOUR_MILLIS: u64 = 3_600_000;
pub const DAY_MILLIS: u64 = HOUR_MILLIS * 24;
pub const WEEK_MILLIS: u64 = DAY_MILLIS * 7;

pub trait Ts
where
    Self: Datelike,
{
    fn to_timestamp(&self) -> Timestamp;
}

impl<T> Ts for DateTime<T>
where
    T: TimeZone,
{
    fn to_timestamp(&self) -> Timestamp {
        Timestamp::Millis(self.timestamp_millis())
    }
}

#[derive(Debug, Clone, Copy)]
pub enum Timestamp {
    Millis(i64),
    Second(i64),
}

impl Timestamp {
    /// Convert the timestamp to number of milliseconds if it is in seconds
    pub fn as_ms(&self) -> i64 {
        match &self {
            Timestamp::Second(seconds) => seconds * 1_000,
            Timestamp::Millis(milliseconds) => *milliseconds,
        }
    }

    pub fn as_ms_f64(&self) -> f64 {
        self.as_ms() as f64
    }

    /// Convert the timestamp to number of seconds if it is in milliseconds
    pub fn as_sec(&self) -> i64 {
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
            Timestamp::Millis(milliseconds) => *milliseconds as f64 / 1_000.0,
        }
    }

    /// Converts `Timestamp` to a `core::time::Duration` in milliseconds
    pub fn to_core_duration(&self) -> core::time::Duration {
        core::time::Duration::from_millis(self.as_ms().abs() as u64)
    }

    /// Converts `Timestamp` to a `chrono::DateTime<UTC>` with millisecond precision
    ///
    /// # Panics
    ///
    /// Panics if the given timestamp has an out-of-range number of milliseconds
    pub fn to_datetime(&self) -> DateTime<Utc> {
        DateTime::from_timestamp_millis(self.as_ms()).expect("Invalid timestamp")
    }

    /// Generates a `Timestamp` from a `chrono::DateTime<Utc>`
    pub fn from_datetime(dt: DateTime<Utc>) -> Timestamp {
        Timestamp::Millis(dt.timestamp_millis())
    }

    /// Converts `x.y` hours to a timestamp in milliseconds
    pub fn from_hours(hours: f64) -> Self {
        Timestamp::Millis((HOUR_MILLIS as f64 * hours) as i64)
    }

    /// Converts `x.y` days to a timestamp in milliseconds
    pub fn from_days(days: f64) -> Self {
        Timestamp::Millis((DAY_MILLIS as f64 * days) as i64)
    }

    /// Converts `x.y` weeks to a timestamp in milliseconds
    pub fn from_weeks(weeks: f64) -> Self {
        Timestamp::Millis((WEEK_MILLIS as f64 * weeks) as i64)
    }
}

impl Timestamp {
    pub fn round_div(&self, rhs: Self) -> Timestamp {
        Timestamp::Millis((self.as_ms_f64() / rhs.as_ms_f64()).round() as i64)
    }

    pub fn ceil_div(&self, rhs: Self) -> Timestamp {
        Timestamp::Millis((self.as_ms_f64() / rhs.as_ms_f64()).ceil() as i64)
    }

    pub fn floor_div(&self, rhs: Self) -> Timestamp {
        Timestamp::Millis((self.as_ms_f64() / rhs.as_ms_f64()).floor() as i64)
    }
}

impl core::fmt::Display for Timestamp {
    fn fmt(&self, f: &mut core::fmt::Formatter) -> core::fmt::Result {
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
        Timestamp::Millis(self.as_ms().sub(rhs.as_ms()))
    }
}

impl Mul for Timestamp {
    type Output = Timestamp;

    fn mul(self, rhs: Self) -> Self::Output {
        Timestamp::Millis(self.as_ms().mul(rhs.as_ms()))
    }
}

impl Div for Timestamp {
    type Output = Timestamp;

    fn div(self, rhs: Self) -> Self::Output {
        Timestamp::Millis(self.as_ms().div(rhs.as_ms()))
    }
}

impl Rem for Timestamp {
    type Output = Timestamp;

    fn rem(self, rhs: Self) -> Self::Output {
        Timestamp::Millis(self.as_ms().rem(rhs.as_ms()))
    }
}

impl AddAssign for Timestamp {
    fn add_assign(&mut self, rhs: Self) {
        *self = self.add(rhs);
    }
}

impl SubAssign for Timestamp {
    fn sub_assign(&mut self, rhs: Self) {
        *self = self.sub(rhs);
    }
}

impl MulAssign for Timestamp {
    fn mul_assign(&mut self, rhs: Self) {
        *self = self.mul(rhs);
    }
}

impl DivAssign for Timestamp {
    fn div_assign(&mut self, rhs: Self) {
        *self = self.div(rhs);
    }
}

impl RemAssign for Timestamp {
    fn rem_assign(&mut self, rhs: Self) {
        *self = self.rem(rhs)
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

#[inline(always)]
pub fn timestamp() -> Timestamp {
    Utc::now().to_timestamp()
}

// pub fn parse_cron_expr2(
//     expression: &str,
//     tz_offset: i32,
//     start_timestamp: Option<&Timestamp>,
// ) -> Result<
//     Map<
//         cron::OwnedScheduleIterator<FixedOffset>,
//         impl FnMut(DateTime<FixedOffset>) -> DateTime<Utc>,
//     >,
//     cron::error::Error,
// > {
//     let start_time = {
//         let offset = FixedOffset::east_opt(tz_offset.div(1_000))
//             .unwrap_or_else(|| FixedOffset::east_opt(0).unwrap());

//         let start_time_utc = start_timestamp
//             .map(|a| a.to_datetime())
//             .unwrap_or_else(|| Utc::now());

//         offset.from_utc_datetime(&start_time_utc.naive_utc())
//     };

//     let result = cron::Schedule::from_str(format!("0 {}", expression).as_str())
//         .map(|s| s.after_owned(start_time))
//         .map(|o| o.map(|v| v.to_utc()));

//     result
// }

#[cfg(test)]
mod test {
    use chrono::{prelude::*, Months};
    use chrono_tz::Tz;
    use wasm_bindgen_test::*;

    use super::*;

    wasm_bindgen_test_configure!(run_in_browser);

    #[test]
    pub fn test_tz() {
        let now = Local::now();
        let ts = now.to_timestamp();
        let ts2 = now.to_utc().to_timestamp();
        println!("TS -> {} | TS2 -> {} | DT -> {}", ts, ts2, ts.to_datetime())
    }

    #[test]
    pub fn test_validate_dt() {
        let anchor_dt =
            DateTime::parse_from_str("2024-12-21T10:45:39.057+0100", "%Y-%m-%dT%H:%M:%S%.3f%z")
                .unwrap()
                .to_utc();
        let ndt = NaiveDate::from_ymd_opt(2025, 1, 31)
            .unwrap()
            .and_time(anchor_dt.time());
        let dt = DateTime::<Utc>::from_naive_utc_and_offset(ndt, anchor_dt.offset().clone());

        println!("{}", anchor_dt);
        println!("{}", ndt);
        println!("{}", dt);
        println!("{}", dt.checked_add_months(Months::new(1)).unwrap());

        // let v1: Option<Vec<u32>> = Some(vec![]);
        let v2: Option<Vec<u32>> = Some(vec![1, 2, 3]);
        // let v3: Option<Vec<u32>> = None;

        let r: Option<&Vec<u32>> = v2.as_ref().map(|w| (!w.is_empty()).then_some(w)).flatten();

        println!("{:?}", r.unwrap().into_iter().max());

        let tz: Tz = "America/New_York".parse().unwrap();
        let dt = Local::now().with_timezone(&tz);

        println!("TZ -> {}", tz);
        println!("DT -> {}", dt);
    }
}
