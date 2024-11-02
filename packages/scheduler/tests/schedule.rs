//! Test suite for the Web and headless browsers.

use std::{cmp::max, vec};

use chrono::{DateTime, Timelike, Utc};
// extern crate wasm_bindgen_test;
use wasm_bindgen_test::*;

extern crate scheduler;
use scheduler::core::{
    frequency::{StCustomFrequency, StFrequencyType, StHourlyExpression, StRegularFrequency},
    priority::StPriority,
    schedule::*,
};

wasm_bindgen_test_configure!(run_in_browser);

// static ISO_DATE_STRING: &str = "2024-10-28T21:05:55.025Z";
static TIMESTAMP_MILLIS: u64 = 1730149555025;

/// Should sucessfilly create a bare minimum schedule with the given data
#[wasm_bindgen_test]
pub fn pass_create_bare_minimum_schedule() {
    let schedule = StSchedule::new("id", TIMESTAMP_MILLIS, None);

    assert_eq!(schedule.get_id(), "id");
    assert_eq!(schedule.get_priority(), None);
    assert_eq!(schedule.get_timestamp(), TIMESTAMP_MILLIS);
    assert_eq!(schedule.get_custom_frequency(), None);
    assert_eq!(schedule.get_regular_frequency(), None);
}

/// Should successfully create a more robust schedule
#[wasm_bindgen_test]
pub fn pass_create_robust_schedule() {
    {
        let cstm_freq = StCustomFrequency::new(-3_600_000, vec!["*/10 * * * *".to_string()], None);
        let schedule = StSchedule::with_custom(
            "id",
            TIMESTAMP_MILLIS,
            cstm_freq.clone(),
            Some(StPriority::High),
        );

        assert_eq!(schedule.get_id(), "id");
        assert_eq!(schedule.get_priority(), Some(StPriority::High));
        assert_eq!(schedule.get_timestamp(), TIMESTAMP_MILLIS);
        assert_eq!(schedule.get_custom_frequency(), Some(cstm_freq));
        assert_eq!(schedule.get_regular_frequency(), None);
    }

    {
        let reg_freq =
            StRegularFrequency::new(StFrequencyType::Hour, StHourlyExpression::new(1), None);
        let schedule = StSchedule::with_regular(
            "id",
            TIMESTAMP_MILLIS,
            reg_freq.clone(),
            Some(StPriority::High),
        );

        assert_eq!(schedule.get_id(), "id");
        assert_eq!(schedule.get_priority(), Some(StPriority::High));
        assert_eq!(schedule.get_timestamp(), TIMESTAMP_MILLIS);
        assert_eq!(schedule.get_regular_frequency(), Some(reg_freq));
        assert_eq!(schedule.get_custom_frequency(), None);
    }
}

#[wasm_bindgen_test]
pub fn pass_get_upcoming_cron_schedule() {
    let cstm_freq = StCustomFrequency::new(-3_600_000, vec!["*/10 * * * *".to_string()], None);

    let schedule = StSchedule::with_custom(
        "id",
        TIMESTAMP_MILLIS,
        cstm_freq.clone(),
        Some(StPriority::High),
    );

    let time_t = DateTime::from_timestamp_millis(schedule.get_timestamp() as i64).unwrap();

    let upcoming_schedule = schedule.get_upcoming_schedule().unwrap();

    assert_ne!(schedule, upcoming_schedule);

    // Ensure the greatest of `time_t` and `now` is used
    let after_time_t = max(Utc::now(), time_t);
    let upcoming_time_t =
        DateTime::from_timestamp_millis(upcoming_schedule.get_timestamp() as i64).unwrap();

    if after_time_t.minute() <= 50 {
        assert_eq!(after_time_t.hour(), upcoming_time_t.hour());
        assert_eq!(upcoming_time_t.minute() % 10, 0);
    } else {
        assert_eq!(upcoming_time_t.hour(), (after_time_t.hour() + 1) % 24);
        assert_eq!(upcoming_time_t.minute(), 0);
    }
}
