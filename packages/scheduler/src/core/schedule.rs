use core::cmp::Ordering;
use core::fmt;

use chrono::offset::LocalResult;
use chrono::prelude::*;
use chrono::Months;
use chrono_tz::Tz;
use cron_parser::parse;
use wasm_bindgen::prelude::*;

use crate::core::errors::ParseError;
use crate::core::errors::TimingError;
use crate::core::frequency::StCustomFrequency;
use crate::core::frequency::StFrequencyExpression;
use crate::core::frequency::StMonthlySubExpression;
use crate::core::frequency::StOrdinals;
use crate::core::frequency::{StConstWeekday, StMonth, StWeekday};
use crate::core::frequency::{StFrequency, StRegularFrequency};
use crate::core::priority::StPriority;
use crate::core::time::{timestamp, Timestamp};
use crate::traits::{Ts, ID};

#[wasm_bindgen]
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct StSchedule {
    /// The identifier for this schedule
    id: String,
    /// The timing information for this schedule
    timing: Timing,
    /// The priority for this schedule
    ///
    /// Note that two shcedules with the same timing are considered equivalent as regards their importance,
    /// a higher priority can further add a level of importance provided they both do not share the same
    /// priority also, otherwise they are equally important.
    priority: Option<StPriority>,
    /// The frequency of repetition for this schedule, one-off schedules can be assigned a `None` frequency
    frequency: Option<StFrequency>,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub struct Timing {
    /// The timezone information for the naive anchor which altogether makes the anchor
    timezone: Tz,
    /// The original time of the event
    anchor: Timestamp,
    /// The expected deadline or due time of the event
    deadline: Timestamp,
    /// The naive anchor, that is the anchor time without timezone information
    naive_anchor: NaiveDateTime,
}

impl ID for StSchedule {
    fn get_id(&self) -> String {
        self.id.clone()
    }
}

impl Timing {
    /// Checks if a [`Timing`] has passed by comparing the [`Timing`]'s anchor timestamp
    /// with a current timestamp.
    pub fn is_passed(&self) -> bool {
        self.anchor < timestamp()
    }

    /// Checks if a [`Timing`] has passed it's deadline or due time by comparing the [`Timing`]'s deadline
    /// timestamp with a current timestamp.
    ///
    /// When a [`Timing`] is attached to a repeatable event (that is, an event with a frequency), this can be
    /// useful to tell when to re-evaluate the timing for the event using the frequency expressions.
    ///
    /// Initially, the timing deadline is set to the same value as anchor, then this function can be used to
    /// check whether the deadline (initially the anchor) has passed and can be used to re-evaluate the exact
    /// deadline for repeating events.
    pub fn is_passed_due(&self) -> bool {
        self.deadline < timestamp()
    }

    /// Create a [`Timing`] from a naive anchor, seemingly ISO-8601 or RFC-3339, datetime string and a valid
    /// IANA timezone string.
    ///
    /// # Note
    ///
    /// The `naive_anchor` expects a datetime string in the format `"%Y-%m-%dT%H:%M:%S%.f"`. and the timezone
    /// could be any valid IANA timezone string, e.g, "Africa/Lagos", "America/New_York".
    ///
    /// # Error
    ///
    /// Returns a [`ParseError`] wrapped in an [`Err`] result if any of the naive anchor datetime or timezone
    /// string could not be parsed into a valid output, due to formatting issues or an invalid entry.
    ///
    /// # Example
    ///
    /// ```
    /// extern crate scheduler;
    /// use scheduler::core::schedule::Timing;
    ///
    /// let timing = Timing::with_naive_anchor_tz("2025-01-05T09:05:38.392", "Africa/Lagos");
    ///
    /// match &timing {
    ///     Ok(timing) => println!("Result: {:?}", timing),
    ///     Err(err) => println!("Error: {}", err)
    /// };
    ///
    /// assert!(timing.is_ok());
    ///
    /// let invalid_timing = Timing::with_naive_anchor_tz("2025-01-05T09:05:38.392", "Africa/Los_Angeles");
    ///
    /// match &invalid_timing {
    ///     Ok(timing) => println!("Result: {:?}", timing),
    ///     Err(err) => println!("Error: {}", err)
    /// };
    ///
    /// assert!(invalid_timing.is_err());
    /// ```
    pub fn with_naive_anchor_tz(naive_anchor: &str, timezone: &str) -> Result<Self, ParseError> {
        let tz: Tz = timezone.parse()?;
        let ndt = NaiveDateTime::parse_from_str(naive_anchor, "%Y-%m-%dT%H:%M:%S%.f")?;
        let anchor = {
            let result = tz
                .with_ymd_and_hms(
                    ndt.year(),
                    ndt.month(),
                    ndt.day(),
                    ndt.hour(),
                    ndt.minute(),
                    ndt.second(),
                )
                .map(|d| d.with_nanosecond(ndt.nanosecond()).unwrap());
            match result {
                LocalResult::Single(dt) => Ok(dt),
                LocalResult::Ambiguous(_, dt2) => Ok(dt2),
                LocalResult::None => Err(ParseError::ResolutionFailed),
            }
        }?;

        Ok(Timing {
            timezone: tz,
            naive_anchor: ndt,
            anchor: anchor.to_utc().to_timestamp(),
            deadline: anchor.to_utc().to_timestamp(),
        })
    }

    /// Refresh a [`Timing`] with the provided frequency.
    ///
    /// # Custom Frequency Expressions
    ///
    /// For custom frequency expressions (cron), this method computes the timestamp for each of the cron expressions
    /// in the timezone of the original anchor timestamp (declared as `naive_anchor` and `timezone`), and only a
    /// maximum of three cron expressions are evaluated, the rest are redundant.
    ///
    /// If an error is encountered when parsing any of the cron expressions, this method returns a [`TimingError`]
    /// wrapped in an [`Err`] result for the first error encountered.
    ///
    /// ## Custom Frequency Expressions and Timezone
    ///
    /// The significance of the timezone here is that the generated timestamps starts from no less than the local
    /// time in that timezone. So in the case that an event was scheduled in America/New_York, with a cron expression
    /// of 10am daily "0 10 * * *", and that event finds itself in a different timezone like Africa/Lagos then the
    /// timing still would be in America/New_York time rather than Africa/Lagos time, meaning when it's 10am in
    /// Africa/Lagos nothing happens for that event until it is 10am in America/New_York or 3pm-5pm in
    /// Africa/Lagos depending on DST.
    /// 
    /// # Frequency Expression Validity.
    /// 
    /// Some frequency expressions have a date until when they are no longer valid. When the `until` of a frequency
    /// is not `None`, the evaluated timestamp is comapred with the declared validity timestamp, and while the 
    /// evaluated timestamp is less than the validity timestamp a [`Result::Ok`] is returned with the refreshed timing,
    /// otherwise a [`Result::Err`] is returned with a [`TimingError::FrequencyExpired`]
    ///
    /// Timing generated from regular frequency expressions are relative to the anchor timestmap, meanwhile timing
    /// generated from custom frequency expressions are relative to the current timestamp.
    pub fn refresh(self, frequency: &StFrequency) -> Result<Self, TimingError> {
        let timing_opts = &timing::TimingOptions::default();
        let timing_factory: &dyn Fn(_) -> _ = &|deadline| Timing { deadline, ..self };
        let checked_validity: &dyn Fn(&Option<_>, _) -> Result<_, _> = &|u, n| {
            u.map(|u| (u <= n).then_some(Err(TimingError::FrequencyExpired)))
                .flatten()
                .unwrap_or(Ok(timing_factory(n)))
        };

        if !self.is_passed_due() {
            return Ok(self);
        }

        match frequency {
            StFrequency::Custom(cstm) => {
                let itr = (&cstm.cron_expressions).iter().take(3).map(|cron| {
                    // TODO: Test to see that it reps time from the perspective of tz ✅
                    let start = Local::now().with_timezone(&self.timezone);
                    let result = parse(cron.as_str(), &start);
                    result.map(|v| v.to_utc().to_timestamp())
                });

                let (values, errors): (Vec<_>, Vec<_>) = itr.partition(|v| v.is_ok());
                let values = values.into_iter().filter_map(|v| v.ok());
                let errors = errors.into_iter().filter_map(|v| v.err());
                let first_error = errors.take(1).last();
                let first_value = values.min();

                if first_error.is_some() {
                    return Err(first_error.unwrap().into());
                }

                match first_value {
                    Some(value) => cstm.until.map_or_else(
                        || Ok(timing_factory(value)),
                        |until| {
                            if value.min(until) == value {
                                Ok(timing_factory(value))
                            } else {
                                Err(TimingError::FrequencyExpired)
                            }
                        },
                    ),
                    None => Err(TimingError::MissingExpression),
                }
            }
            StFrequency::Regular(reg) => match reg.get_expr() {
                StFrequencyExpression::Hourly(expr) => {
                    let next = Self::next_hourly_timestamp(self.anchor, expr.every, timing_opts);
                    checked_validity(&reg.until, next)
                }
                StFrequencyExpression::Daily(expr) => {
                    let next = Self::next_daily_timestamp(self.anchor, expr.every, timing_opts);
                    checked_validity(&reg.until, next)
                }
                StFrequencyExpression::Weekly(expr) => {
                    let next = Self::next_weekly_timestamp(
                        self.anchor,
                        expr.every,
                        Some(&expr.subexpr.weekdays),
                        timing_opts,
                    );
                    checked_validity(&reg.until, next)
                }
                StFrequencyExpression::Monthly(expr) => match &expr.subexpr {
                    StMonthlySubExpression::OnDays(subexpr) => {
                        let next = Self::next_monthly_schedule(
                            self.anchor,
                            expr.every,
                            Some(&subexpr.days),
                            None,
                            timing_opts,
                        )?;
                        checked_validity(&reg.until, next)
                    }
                    StMonthlySubExpression::OnThe(subexpr) => {
                        let next = Self::next_monthly_schedule(
                            self.anchor,
                            expr.every,
                            None,
                            Some((subexpr.ordinal, subexpr.weekday)),
                            timing_opts,
                        )?;
                        checked_validity(&reg.until, next)
                    }
                },
                StFrequencyExpression::Yearly(expr) => {
                    let next = Self::next_yearly_timestamp(
                        self.anchor,
                        expr.every,
                        &expr.subexpr.months,
                        expr.subexpr.on.map(|o| (o.ordinal, o.weekday)),
                        timing_opts,
                    )?;
                    checked_validity(&reg.until, next)
                }
            },
        }
    }
}

impl Timing {
    fn next_hourly_timestamp(
        anchor: Timestamp,
        every: u32,
        options: &timing::TimingOptions,
    ) -> Timestamp {
        timing::get_next_hourly_timestamp(anchor, every, options)
    }

    fn next_daily_timestamp(
        anchor: Timestamp,
        every: u32,
        options: &timing::TimingOptions,
    ) -> Timestamp {
        timing::get_next_daily_timestamp(anchor, every, options)
    }

    fn next_weekly_timestamp(
        anchor: Timestamp,
        every: u32,
        weekdays: Option<&Vec<StConstWeekday>>,
        options: &timing::TimingOptions,
    ) -> Timestamp {
        let postprocess: &dyn Fn(Vec<Timestamp>, &_) -> Option<_> =
            &|v, c| v.into_iter().filter(|t| t > c).min();

        let mut current_ts = options.curtime;
        let mut result = postprocess(
            timing::get_next_weekly_timestamp(anchor, every, weekdays, &options),
            &current_ts,
        );

        while result.is_none() {
            current_ts += Timestamp::from_weeks(1.0);
            result = postprocess(
                timing::get_next_weekly_timestamp(
                    anchor,
                    every,
                    // only pass `Some(Vec<_> v)` if v is not empty otherwise `None`
                    weekdays.map(|v| (!v.is_empty()).then_some(v)).flatten(),
                    &timing::TimingOptions {
                        curtime: current_ts,
                        ..*options
                    },
                ),
                &current_ts,
            )
        }

        result.unwrap()
    }

    fn next_monthly_schedule(
        anchor: Timestamp,
        every: u32,
        days: Option<&Vec<u32>>,
        ordinals: Option<(StOrdinals, StConstWeekday)>,
        options: &timing::TimingOptions,
    ) -> Result<Timestamp, TimingError> {
        let postprocess: &dyn Fn(Vec<Timestamp>, &_) -> Option<_> =
            &|v, c| v.into_iter().filter(|t| t > c).min();

        if let Some(ordinals) = ordinals {
            return timing::get_next_monthly_ordinal_timestamp(anchor, every, ordinals, options);
        };

        if let Some(days) = days {
            let mut current_ts = options.curtime;
            let mut result = postprocess(
                timing::get_next_monthly_days_timestamp(anchor, every, days, options),
                &current_ts,
            );

            while result.is_none() {
                current_ts = current_ts
                    .to_datetime()
                    .checked_add_months(Months::new(1))
                    .as_ref()
                    .map(DateTime::<Utc>::to_timestamp)
                    .ok_or(ParseError::ResolutionFailed)?;
                result = postprocess(
                    timing::get_next_monthly_days_timestamp(
                        anchor,
                        every,
                        days.as_ref(),
                        &timing::TimingOptions {
                            curtime: current_ts,
                            ..*options
                        },
                    ),
                    &current_ts,
                )
            }

            return Ok(result.unwrap());
        }

        // days.xor(ordinals).is_none();
        Err(TimingError::MissingExpression)
    }

    fn next_yearly_timestamp(
        anchor: Timestamp,
        every: u32,
        months: &Vec<StMonth>,
        ordinals: Option<(StOrdinals, StWeekday)>,
        options: &timing::TimingOptions,
    ) -> Result<Timestamp, TimingError> {
        // consider returning an error, MissingExpression, if months is empty
        if months.is_empty() {
            return Err(TimingError::MissingExpression);
        }

        let postprocess: &dyn Fn(Vec<_>, &_) -> (_, _) = &|v, c| {
            let (values, errors): (Vec<_>, Vec<_>) = v
                .into_iter()
                .partition(|p: &Result<Timestamp, TimingError>| p.is_ok());
            let values = values.into_iter().filter_map(|v| v.ok());
            let errors = errors.into_iter().filter_map(|v| v.err());
            (errors.take(1).last(), values.filter(|t| t > c).min())
        };

        let mut current_ts = options.curtime;
        let mut results = postprocess(
            timing::get_next_yearly_timestamp(anchor, every, months, ordinals, options),
            &current_ts,
        );

        {
            let month = months
                .iter()
                .min()
                .map(|f| (*f).into())
                // we can unwrap so long as we guarantee that months is not empty as done above, up! up!
                .unwrap(); // _or_else(|| anchor.to_datetime().month0());
                           // This most likely would happen when the months supplied to this fn are behind the current datetime month
                           // so we want to shift the current datetime one year forward starting from the minimum of the months
            while results.1.is_none() && results.0.is_none() {
                current_ts = {
                    let dt = current_ts.to_datetime();
                    let (year, month) = (dt.year() + 1, month);
                    let day = dt.day().min(timing::get_days_in_year_month(year, month));
                    let ndt = NaiveDate::from_ymd_opt(year, month, day)
                        .unwrap()
                        .and_time(dt.time());
                    DateTime::<Utc>::from_naive_utc_and_offset(ndt, dt.offset().clone())
                        .to_timestamp()
                };
                results = postprocess(
                    timing::get_next_yearly_timestamp(
                        anchor,
                        every,
                        months,
                        ordinals,
                        &timing::TimingOptions {
                            curtime: current_ts,
                            ..*options
                        },
                    ),
                    &current_ts,
                );
            }
        }

        if results.1.is_none() && results.0.is_some() {
            Err(results.0.unwrap())
        } else {
            Ok(results.1.unwrap())
        }
    }
}

#[wasm_bindgen]
impl StSchedule {
    #[wasm_bindgen(constructor)]
    /// Initializes a structure for schedule representations
    ///
    /// The defualt initializer: useful for schedules without
    /// any repeating frequency
    ///
    /// # Arguments
    ///
    /// * `id` - The identifier for this schedule
    /// * `naive_anchor` - The naive anchor datetime in string
    /// * `timezone` - The timezone string for `naive_anchor` in the format of `Continent/City`
    /// * `priority` - The priority of schedule used to measure importance
    ///
    /// # Panics
    ///
    /// Panics when the `naive_anchor` date string could not be successfully parsed from string
    /// or the `timezone` could not be successfully parsed from string.
    pub fn new(
        id: &str,
        naive_anchor: &str,
        timezone: &str,
        priority: Option<StPriority>,
    ) -> StSchedule {
        StSchedule {
            id: String::from(id),
            frequency: None,
            priority,
            timing: Timing::with_naive_anchor_tz(naive_anchor, timezone).unwrap(),
        }
    }

    /// Initializes a structure for schedule representations
    ///
    /// The regular initializer: useful for schedules with a regular
    /// repeating frequency
    ///
    /// # Arguments
    ///
    /// * `id` - The identifier for this schedule
    /// * `naive_anchor` - The naive anchor datetime in string
    /// * `timezone` - The timezone string for `naive_anchor` in the format of `Continent/City`
    /// * `freq` - The repeat frequency of schedule
    /// * `priority` - The priority of schedule used to measure importance
    ///
    /// # Panics
    ///
    /// Panics when the `naive_anchor` date string could not be successfully parsed from string
    /// or the `timezone` could not be successfully parsed from string.
    pub fn with_regular(
        id: &str,
        naive_anchor: &str,
        timezone: &str,
        freq: StRegularFrequency,
        priority: Option<StPriority>,
    ) -> StSchedule {
        let frequency = StFrequency::Regular(freq);
        let timing = Timing::with_naive_anchor_tz(naive_anchor, timezone)
            .unwrap()
            .refresh(&frequency)
            .unwrap();

        StSchedule {
            id: String::from(id),
            frequency: Some(frequency),
            priority,
            timing,
        }
    }

    /// Initializes a structure for schedule representations
    ///
    /// The custom initializer: useful for schedules with a custom (CRON)
    /// repeating frequency
    ///
    /// # Arguments
    ///
    /// * `id` - The identifier for this schedule
    /// * `naive_anchor` - The naive anchor datetime in string
    /// * `timezone` - The timezone string for `naive_anchor` in the format of `Continent/City`
    /// * `freq` - The repeat frequency of schedule
    /// * `priority` - The priority of schedule used to measure importance
    ///
    /// # Panics
    ///
    /// Panics when the `naive_anchor` date string could not be successfully parsed from string
    /// or the `timezone` could not be successfully parsed from string.
    pub fn with_custom(
        id: &str,
        naive_anchor: &str,
        timezone: &str,
        freq: StCustomFrequency,
        priority: Option<StPriority>,
    ) -> StSchedule {
        let frequency = StFrequency::Custom(freq);
        let timing = Timing::with_naive_anchor_tz(naive_anchor, timezone)
            .unwrap()
            .refresh(&frequency)
            .unwrap();

        StSchedule {
            id: String::from(id),
            frequency: Some(frequency),
            priority,
            timing,
        }
    }

    pub(crate) fn with_frequency_and_timing(
        id: &str,
        timing: Timing,
        frequency: StFrequency,
        priority: Option<StPriority>,
    ) -> StSchedule {
        StSchedule {
            id: String::from(id),
            frequency: Some(frequency),
            timing,
            priority,
        }
    }

    pub(crate) fn get_id_as_str(&self) -> &str {
        &self.id
    }

    pub fn get_anchor_millis(&self) -> i64 {
        self.timing.anchor.as_ms()
    }

    pub fn get_priority(&self) -> Option<StPriority> {
        self.priority
    }

    pub fn get_custom_frequency(&self) -> Option<StCustomFrequency> {
        if let Some(freq) = &self.frequency {
            if let StFrequency::Custom(cstm_freq) = freq {
                return Some(cstm_freq.to_owned());
            }
        }

        None
    }

    pub fn get_regular_frequency(&self) -> Option<StRegularFrequency> {
        if let Some(freq) = &self.frequency {
            if let StFrequency::Regular(reg_freq) = freq {
                return Some(reg_freq.to_owned());
            }
        }

        None
    }

    pub fn is_passed(&self) -> bool {
        self.timing.deadline < timestamp()
    }
}

impl StSchedule {
    /// Calculate the upcoming schedule for the given schedule
    pub fn get_upcoming_schedule(&self) -> Result<StSchedule, TimingError> {
        // Check if the current schedule has passed and generate the next
        // schedule relative to now from the StSchedule struct
        if !self.is_passed() {
            return Err(TimingError::Conflict);
        }

        if let Some(frequency) = &self.frequency {
            let timing = self.timing.refresh(frequency)?;

            Ok(StSchedule::with_frequency_and_timing(
                &self.id,
                timing,
                frequency.clone(),
                self.priority,
            ))
        } else {
            Err(TimingError::MissingExpression)
        }
    }
}

impl fmt::Display for StSchedule {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        write!(f, "{:#?}", &self)
    }
}

impl Ord for StSchedule {
    fn cmp(&self, other: &Self) -> core::cmp::Ordering {
        let order = self.timing.deadline.cmp(&other.timing.deadline);

        match order {
            Ordering::Equal => self.priority.cmp(&other.priority),
            _ => order,
        }
    }
}

impl PartialOrd for StSchedule {
    fn partial_cmp(&self, other: &Self) -> Option<Ordering> {
        Some(self.cmp(other))
    }
}

mod timing {
    use core::convert::TryInto;

    use chrono::prelude::*;

    use crate::core::errors::TimingError;
    use crate::core::frequency::{StConstWeekday, StMonth, StOrdinals, StVarWeekday, StWeekday};
    use crate::core::time::{timestamp, Timestamp, Ts};
    use crate::core::time::{DAY_MILLIS, HOUR_MILLIS, INDEXED_MONTH_DAYS, WEEK_MILLIS};
    use crate::utils::{filter_unique, map_unique};

    const DOW: u32 = 7;
    const MOY: u32 = 12;
    const DOY: u32 = 365;

    #[derive(Debug, Clone, Copy)]
    pub struct TimingOptions {
        pub curtime: Timestamp,
    }

    impl Default for TimingOptions {
        fn default() -> Self {
            TimingOptions {
                curtime: timestamp(),
            }
        }
    }

    // since we are asuming to be in a safe `float64` range, `2 ^ 53 - 1`, then it's guaranted that we
    // can also safely convert down from a `uint64` to an `int64`.

    // The largest supported value that `every` can be is `2_501_999_792` any value higher than this
    // will go beyond the floating point range of `2 ^ 53 - 1` and cause an overflow which leads to
    // a panic in the execution of the following code.
    // We may set up a validation that ensures supplied values are in the constrained ranges.
    pub fn get_next_hourly_timestamp(
        anchor_ts: Timestamp,
        every: u32,
        options: &TimingOptions,
    ) -> Timestamp {
        let current_ts = options.curtime;
        let hours_ms = HOUR_MILLIS * every as u64;
        let hours_ms_f64: f64 = num::cast(hours_ms).unwrap();

        if anchor_ts >= current_ts {
            return anchor_ts + Timestamp::Millis(hours_ms.try_into().unwrap());
        }

        let elapsed_ts = current_ts - anchor_ts;
        let elapsed_factor = elapsed_ts.as_ms_f64() / hours_ms_f64;
        let next_hour_ms = hours_ms_f64 * elapsed_factor.ceil();

        return anchor_ts + Timestamp::Millis(num::cast(next_hour_ms).unwrap());
    }

    // The largest supported value that `every` can be is `104_249_991` any value higher than this
    // will go beyond the floating point range of `2 ^ 53 - 1` and cause an overflow which leads to
    // a panic in the execution of the following code.
    // We may set up a validation that ensures supplied values are in the constrained ranges.
    pub fn get_next_daily_timestamp(
        anchor_ts: Timestamp,
        every: u32,
        options: &TimingOptions,
    ) -> Timestamp {
        let current_ts = options.curtime;
        let days_ms = DAY_MILLIS * every as u64;
        let days_ms_f64: f64 = num::cast(days_ms).unwrap();

        if anchor_ts >= current_ts {
            return anchor_ts + Timestamp::Millis(days_ms.try_into().unwrap());
        }

        let elapsed_ts = current_ts - anchor_ts;
        let elapsed_factor = elapsed_ts.as_ms_f64() / days_ms_f64;
        let next_day_ms = days_ms_f64 * elapsed_factor.ceil();

        return anchor_ts + Timestamp::Millis(num::cast(next_day_ms).unwrap());
    }

    // The largest supported value that `every` can be is `14_892_855` any value higher than this
    // will go beyond the floating point range of `2 ^ 53 - 1` and cause an overflow which leads to
    // a panic in the execution of the following code.
    // We may set up a validation that ensures supplied values are in the constrained ranges.
    pub fn get_next_weekly_timestamp(
        anchor_ts: Timestamp,
        every: u32,
        weekdays: Option<&Vec<StConstWeekday>>,
        options: &TimingOptions,
    ) -> Vec<Timestamp> {
        let current_ts = options.curtime;
        if let Some(weekdays) = weekdays {
            if weekdays.is_empty() {
                vec![bring_wk_anchor_forward(current_ts, anchor_ts, every)]
            } else {
                map_unique(&weekdays, |w| u32::from(*w) % DOW)
                    .into_iter()
                    .map(|w| {
                        bring_wk_anchor_forward(current_ts, set_day_of_week(&anchor_ts, &w), every)
                    })
                    .collect::<Vec<_>>()
            }
        } else {
            vec![bring_wk_anchor_forward(current_ts, anchor_ts, every)]
        }
    }

    pub fn bring_wk_anchor_forward(
        current_ts: Timestamp,
        anchor_ts: Timestamp,
        every: u32,
    ) -> Timestamp {
        let week_ms = WEEK_MILLIS * every as u64;
        let weeks_ms_f64: f64 = num::cast(week_ms).unwrap();

        if anchor_ts >= current_ts {
            return anchor_ts + Timestamp::Millis(week_ms.try_into().unwrap());
        }

        let elapsed_ts = current_ts - anchor_ts;
        let elapsed_factor = elapsed_ts.as_ms_f64() / weeks_ms_f64;
        let next_week_ms = weeks_ms_f64 * elapsed_factor.ceil();

        return anchor_ts + Timestamp::Millis(num::cast(next_week_ms).unwrap());
    }

    pub fn get_next_monthly_days_timestamp(
        anchor_ts: Timestamp,
        every: u32,
        days: &Vec<u32>,
        options: &TimingOptions,
    ) -> Vec<Timestamp> {
        let current_ts = options.curtime;
        let forwarded_ts = bring_mo_anchor_forward(current_ts, anchor_ts, every);
        let forwarded_dt = forwarded_ts.to_datetime();
        let (month, year) = (forwarded_dt.month0(), forwarded_dt.year());
        let max_day_of_month = get_days_in_year_month(year, month);

        // if days is not supplied or is empty, then assume the same day of month as anchor
        if days.is_empty() {
            // its quite likely the anchor dom does not exist for forwarded month
            return forwarded_dt
                .with_day(anchor_ts.to_datetime().day())
                .map_or_else(|| vec![], |dt| vec![dt.to_timestamp()]);
        }

        filter_unique(days, |d| d > &0 && d <= &max_day_of_month)
            .into_iter()
            .map(|d| {
                let dom_offset = forwarded_dt.day() - d;
                forwarded_ts - Timestamp::from_days(dom_offset as f64)
            })
            .collect::<Vec<Timestamp>>()
    }

    pub fn get_next_monthly_ordinal_timestamp(
        anchor_ts: Timestamp,
        every: u32,
        ordinals: (StOrdinals, StConstWeekday),
        options: &TimingOptions,
    ) -> Result<Timestamp, TimingError> {
        let current_ts = options.curtime;
        let forwarded_dt = bring_mo_anchor_forward(current_ts, anchor_ts, every).to_datetime();
        let (month, year) = (forwarded_dt.month0(), forwarded_dt.year());
        let last_day_of_month = get_days_in_year_month(year, month);

        let (ordinal, weekday) = ordinals;

        match ordinal {
            StOrdinals::Last => {
                let forwarded_dt = forwarded_dt.with_day(last_day_of_month).unwrap();
                let dow_offset_rev = get_rev_dow_offset(
                    forwarded_dt.weekday().num_days_from_sunday(),
                    weekday.into(),
                );
                let result =
                    forwarded_dt.to_timestamp() - Timestamp::from_days(dow_offset_rev as f64);
                Ok(result)
            }
            _ => {
                let days_offset = DOW * ordinal.to_value();
                let mut retries = 100;
                let mut last_dom = last_day_of_month;
                let mut fwd = forwarded_dt.with_day(1).unwrap();
                let mut dow_offset =
                    get_dow_offset(fwd.weekday().num_days_from_sunday(), weekday.into());
                let mut day_of_month = fwd.day() + days_offset + dow_offset;

                while day_of_month > last_dom && retries > 0 {
                    let anchor_ts = fwd.with_day(last_dom).unwrap().to_timestamp();
                    fwd = bring_mo_anchor_forward(current_ts, anchor_ts, every)
                        .to_datetime()
                        .with_day(1)
                        .unwrap();
                    last_dom = get_days_in_year_month(fwd.year(), fwd.month0());
                    dow_offset =
                        get_dow_offset(fwd.weekday().num_days_from_sunday(), weekday.into());
                    day_of_month = fwd.day() + days_offset + dow_offset;
                    retries -= 1;
                }

                if day_of_month > last_dom {
                    return Err(TimingError::NonDeterministic);
                }

                let result =
                    fwd.to_timestamp() + Timestamp::from_days((days_offset + dow_offset) as f64);

                Ok(result)
            }
        }
    }

    fn bring_mo_anchor_forward(
        current_ts: Timestamp,
        anchor_ts: Timestamp,
        every: u32,
    ) -> Timestamp {
        let current_dt = current_ts.to_datetime();
        let anchor_dt = anchor_ts.to_datetime();
        let (current_month, current_year) = (current_dt.month0(), current_dt.year());
        let (anchor_month, anchor_year) = (anchor_dt.month0(), anchor_dt.year());
        let months_remaining = get_months_remaining(
            every,
            (anchor_year, anchor_month),
            (current_year, current_month),
        );

        if months_remaining.is_none() || anchor_dt > current_dt {
            let t = anchor_month + every;
            // This is normally a floored division but since we are working with integers not floats, flooring is implicitly guaranteed
            let y = anchor_year + (t / MOY) as i32;
            let m = t % MOY;
            let d = get_days_in_year_month(y, m);
            let ndt = NaiveDate::from_ymd_opt(y, m, d)
                .unwrap()
                .and_time(anchor_dt.time());

            // TODO: validate correctness ✅
            return DateTime::<Utc>::from_naive_utc_and_offset(ndt, anchor_dt.offset().clone())
                .to_timestamp();
        }

        debug_assert!(
            anchor_ts <= current_ts,
            "anchor timestamp is expected to be less than or equal to current timestamp at this point"
        );

        let months_remaining = months_remaining.unwrap();
        let rem_days_in_current_month =
            get_days_in_year_month(current_year, current_month) - current_dt.day();

        let days_to_rem_months = {
            let years_to_rem_months = months_remaining / MOY;
            let rem_months = months_remaining % MOY;
            let a = if anchor_month >= 1 { 1 } else { 0 };

            let leap_years_between = get_leap_years_between(
                current_year + 1,
                current_year + a + num::cast::<u32, i32>(years_to_rem_months).unwrap(),
                Some(true),
            );

            let num_of_leap_years = leap_years_between.len();
            let days_in_year_to_rem_months = DOY * years_to_rem_months + num_of_leap_years as u32;
            let mut days_in_rem_months = 0;

            {
                let start_month = (current_month + 1) % MOY;
                let end_month = start_month + rem_months;
                let mut n = if start_month == 0 { 1 } else { 0 };
                for m in start_month..end_month {
                    if m >= MOY && m % MOY == 0 {
                        n += 1;
                    };
                    days_in_rem_months += get_days_in_year_month(current_year + n, m % MOY);
                }
            }

            days_in_year_to_rem_months + days_in_rem_months
        };

        let days_to_next_schedule = days_to_rem_months + rem_days_in_current_month;
        let days_to_next_schedule_ms = DAY_MILLIS * days_to_next_schedule as u64;

        Timestamp::Millis(num::cast(days_to_next_schedule_ms).unwrap())
    }

    pub fn get_next_yearly_timestamp(
        anchor_ts: Timestamp,
        every: u32,
        months: &Vec<StMonth>,
        ordinals: Option<(StOrdinals, StWeekday)>,
        options: &TimingOptions,
    ) -> Vec<Result<Timestamp, TimingError>> {
        let current_ts = options.curtime;
        let forwarded_ts = bring_yr_anchor_forward(current_ts, anchor_ts, every);
        let forwarded_dt = forwarded_ts.to_datetime();
        let forwarded_year = forwarded_dt.year();
        let schedules: Vec<DateTime<Utc>> = map_unique(months, |m| u32::from(*m))
            .into_iter()
            .map(|m| {
                let ndt = NaiveDate::from_ymd_opt(
                    forwarded_year,
                    m.into(),
                    get_days_in_year_month(forwarded_year, m.into()),
                )
                .unwrap()
                .and_time(forwarded_dt.time());

                DateTime::<Utc>::from_naive_utc_and_offset(ndt, forwarded_dt.offset().clone())
            })
            .collect();

        if ordinals.is_none() {
            return schedules.iter().map(|v| Ok(v.to_timestamp())).collect();
        };

        let ordinals = ordinals.unwrap();
        let mut result: Vec<Result<Timestamp, TimingError>> = Vec::with_capacity(schedules.len());

        for s in schedules {
            let (month, year) = (s.month0(), s.year());
            let last_dom = get_days_in_year_month(year, month);

            match ordinals.0 {
                StOrdinals::First
                | StOrdinals::Second
                | StOrdinals::Third
                | StOrdinals::Fourth
                | StOrdinals::Fifth => {
                    let s = s.with_day(1).unwrap();
                    let ref_weekday = s.weekday().num_days_from_sunday();
                    let ordinal: u32 = ordinals.0.into();
                    match ordinals.1 {
                        StWeekday::Const(weekday) => {
                            let weekday: u32 = weekday.into();
                            let dow_offset = get_dow_offset(ref_weekday, weekday.into());
                            let days_offset = DOW * ordinal;
                            let dom = s.day() + days_offset + dow_offset;
                            if dom > last_dom {
                                result.push(Err(TimingError::NonDeterministic))
                            } else {
                                result.push(Ok(s.to_timestamp()
                                    + Timestamp::from_days((days_offset + dow_offset) as f64)))
                            }
                        }

                        StWeekday::Var(weekday) => match weekday {
                            StVarWeekday::Day => {
                                result.push(Ok(
                                    s.to_timestamp() + Timestamp::from_days(ordinal as f64)
                                ));
                            }
                            StVarWeekday::Weekday => {
                                let weekday = {
                                    let weekdays = &[1, 2, 3, 4, 5];
                                    if let Ok(index) = weekdays.binary_search(&ref_weekday) {
                                        let index_of_weekday =
                                            (index + ordinal as usize) % weekdays.len();
                                        weekdays.get(index_of_weekday).unwrap()
                                    } else {
                                        weekdays.get(ordinal as usize).unwrap()
                                    }
                                };
                                let dow_offset = get_dow_offset(ref_weekday, *weekday);
                                result.push(Ok(
                                    s.to_timestamp() + Timestamp::from_days(dow_offset as f64)
                                ));
                            }

                            StVarWeekday::Weekend => {
                                let sun =
                                    (get_dow_offset(ref_weekday, StConstWeekday::Sun.into()), {
                                        let a = (ordinal as f32 / 2.0).ceil() as u32;
                                        let b = ordinal % 2;
                                        let c = DOW * a - b;
                                        c
                                    });
                                let sat =
                                    (get_dow_offset(ref_weekday, StConstWeekday::Sat.into()), {
                                        let a = (ordinal as f32 / 2.0).floor() as u32;
                                        let b = ordinal % 2;
                                        let c = DOW * a + b;
                                        c
                                    });
                                let closest = (sat.0 < sun.0).then_some(sat).unwrap_or(sun);
                                let days_offset = closest.0 + closest.1;
                                let dom = s.day() + days_offset;
                                if dom > last_dom {
                                    result.push(Err(TimingError::NonDeterministic))
                                } else {
                                    result
                                        .push(Ok(s.to_timestamp()
                                            + Timestamp::from_days(days_offset as f64)))
                                }
                            }
                        },
                    }
                }
                StOrdinals::Last => {
                    let s = s.with_day(last_dom).unwrap();
                    let ref_weekday = s.weekday().num_days_from_sunday();
                    match ordinals.1 {
                        StWeekday::Const(weekday) => {
                            let dow_offset_rev = get_rev_dow_offset(ref_weekday, weekday.into());
                            result.push(Ok(
                                s.to_timestamp() - Timestamp::from_days(dow_offset_rev as f64)
                            ));
                        }
                        StWeekday::Var(weekday) => match weekday {
                            StVarWeekday::Day => result.push(Ok(s.to_timestamp())),
                            StVarWeekday::Weekday => {
                                if ref_weekday > StConstWeekday::Sun.into()
                                    && ref_weekday < StConstWeekday::Sat.into()
                                {
                                    result.push(Ok(s.to_timestamp()));
                                } else {
                                    let days_offset = 2 - ((DOW - ref_weekday) % DOW);
                                    result
                                        .push(Ok(s.to_timestamp()
                                            - Timestamp::from_days(days_offset as f64)));
                                }
                            }
                            StVarWeekday::Weekend => {
                                let sun_offset_rev = get_rev_dow_offset(ref_weekday, 0);
                                let sat_offset_rev = get_rev_dow_offset(ref_weekday, 6);
                                result.push(Ok(s.to_timestamp()
                                    - Timestamp::from_days(
                                        sun_offset_rev.min(sat_offset_rev) as f64
                                    )));
                            }
                        },
                    }
                }
            }
        }

        result
    }

    pub fn bring_yr_anchor_forward(
        current_ts: Timestamp,
        anchor_ts: Timestamp,
        every: u32,
    ) -> Timestamp {
        let current_dt = current_ts.to_datetime();
        let anchor_dt = anchor_ts.to_datetime();
        let (current_month, current_year) = (current_dt.month0(), current_dt.year());
        let (anchor_month, anchor_year) = (anchor_dt.month0(), anchor_dt.year());
        let years_remaining = get_years_remaining(every, anchor_dt.year(), current_year);

        if years_remaining.is_none() || anchor_dt > current_dt {
            let y = anchor_year + every as i32;
            let m = anchor_month;
            let d = get_days_in_year_month(y, m);
            let ndt = NaiveDate::from_ymd_opt(y, m, d)
                .unwrap()
                .and_time(anchor_dt.time());
            return DateTime::<Utc>::from_naive_utc_and_offset(ndt, anchor_dt.offset().clone())
                .to_timestamp();
        };

        debug_assert!(
            anchor_ts <= current_ts,
            "anchor timestamp is expected to be less than or equal to current timestamp at this point"
        );

        let years_remaining = years_remaining.unwrap();
        let days_to_rem_years = if years_remaining == 0 {
            0
        } else {
            let leap_years_between = get_leap_years_between(
                current_year + 1,
                current_year + num::cast::<u32, i32>(years_remaining).unwrap(),
                Some(true),
            );
            let num_of_leap_years = leap_years_between.len();
            DOY * years_remaining + num_of_leap_years as u32
        };

        let rem_days_in_current_year = {
            let rem_days_in_current_month =
                get_days_in_year_month(current_year, current_month) - current_dt.day();
            let mut days_in_rem_months = 0;
            let mut n = 1;
            let end = MOY - (current_month + n);
            while n < end {
                days_in_rem_months += get_days_in_year_month(current_year, current_month + n);
                n += 1;
            }
            days_in_rem_months + rem_days_in_current_month
        };

        let days_to_next = days_to_rem_years + rem_days_in_current_year;
        let forwarded = align(current_ts, anchor_ts) + Timestamp::from_days(days_to_next as f64);

        forwarded
    }

    fn get_years_remaining(every: u32, start_year: i32, end_year: i32) -> Option<u32> {
        if end_year < start_year {
            return None;
        };

        let years_elapsed = (end_year - start_year) as u32;
        let result = (every - (years_elapsed % every)) % every;

        Some(result)
    }

    fn get_months_remaining(every: u32, start: (i32, u32), end: (i32, u32)) -> Option<u32> {
        let max_month = 12;
        // end year lt start year or (end year = start year and end month lt start month)
        if end.0 < start.0 || (end.0 == start.0 && end.1 < start.1) {
            return None;
        };

        let month_diff: i32 =
            num::cast::<u32, i32>(end.1).unwrap() - num::cast::<u32, i32>(start.1).unwrap();
        let year_diff = end.0 - start.0;
        let months_elapsed = (month_diff + max_month * year_diff) as u32;
        let result = (every - (months_elapsed % every)) % every;

        Some(result)
    }

    fn set_day_of_week(ts: &Timestamp, weekday: &u32) -> Timestamp {
        let cf = ts.to_datetime().weekday().num_days_from_sunday() as i64 - (weekday % DOW) as i64;
        *ts - Timestamp::from_days(cf as f64)
    }

    #[inline(always)]
    fn get_dow_offset(ref_weekday: u32, target_weekday: u32) -> u32 {
        (DOW - ref_weekday) + (target_weekday % DOW) % DOW
    }

    #[inline(always)]
    fn get_rev_dow_offset(ref_weekday: u32, target_weekday: u32) -> u32 {
        (DOW - get_dow_offset(ref_weekday, target_weekday)) % DOW
    }

    fn align(x2: Timestamp, x1: Timestamp) -> Timestamp {
        let c = Timestamp::from_days(1.0);
        let a = (x2 - x1) % c;
        let b = a.round_div(c) * c - a;
        let x3 = x2 + b;
        x3
    }

    #[inline(always)]
    fn is_feb(month: u32) -> bool {
        month == 1
    }

    #[inline(always)]
    fn is_leap_year(year: i32) -> bool {
        year % 4 == 0 && (year % 100 != 0 || year % 400 == 0)
    }

    #[inline(always)]
    fn is_leap_month(month_year: (u32, i32)) -> bool {
        is_feb(month_year.0) && is_leap_year(month_year.1)
    }

    pub fn get_days_in_year_month(year: i32, month: u32) -> u32 {
        let days = INDEXED_MONTH_DAYS
            .get::<usize>(month as usize)
            .expect("Expected the specified `month` to be between 0..11");

        if is_leap_month((month, year)) {
            days + 1
        } else {
            *days
        }
    }

    fn get_next_leap_year(year: i32) -> i32 {
        let mut next_leap_year = year + 1;

        if next_leap_year % 4 != 0 {
            next_leap_year += 4 - (next_leap_year % 4)
        };
        if next_leap_year % 100 == 0 && next_leap_year % 400 != 0 {
            next_leap_year += 4
        };

        next_leap_year
    }

    fn get_leap_years_between(start_year: i32, end_year: i32, inclusive: Option<bool>) -> Vec<i32> {
        let mut leap_years: Vec<i32> = vec![];

        if start_year == end_year {
            return leap_years;
        };

        let (start, end) = inclusive
            .map(|f| f.then_some((start_year - 1, end_year)))
            .flatten()
            .unwrap_or((start_year, end_year - 1));
        let mut year = start;

        while year <= end {
            year = get_next_leap_year(year);
            leap_years.push(year);
        }

        leap_years
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use wasm_bindgen_test::*;

    use crate::core::time::{HOUR_MILLIS, WEEK_MILLIS};

    wasm_bindgen_test_configure!(run_in_browser);

    /// 2024-10-21T14:19:00.000Z
    static TIMESTAMP: Timestamp = Timestamp::Millis(1729520340000);

    #[test]
    #[wasm_bindgen_test]
    pub fn test_next_hourly_schedule() {
        {
            let hours = 1;
            let next_timestamp =
                Timing::next_hourly_timestamp(TIMESTAMP, hours, &timing::TimingOptions::default());

            assert_eq!(
                ((next_timestamp.as_ms() - TIMESTAMP.as_ms()) / HOUR_MILLIS as i64) % hours as i64,
                0,
            )
        }

        {
            let hours = 4;
            let next_timestamp =
                Timing::next_hourly_timestamp(TIMESTAMP, hours, &timing::TimingOptions::default());

            assert_eq!(
                ((next_timestamp.as_ms() - TIMESTAMP.as_ms()) / HOUR_MILLIS as i64) % hours as i64,
                0,
            )
        }
    }

    #[test]
    #[wasm_bindgen_test]
    pub fn test_next_weekly_schedule() {
        {
            let weeks = 1;
            let next_timestamp = Timing::next_weekly_timestamp(
                TIMESTAMP,
                weeks,
                None,
                &timing::TimingOptions::default(),
            );

            assert_eq!(
                ((next_timestamp.as_ms() - TIMESTAMP.as_ms()) / WEEK_MILLIS as i64) % weeks as i64,
                0,
            )
        }

        {
            let weeks = 3;
            let next_timestamp = Timing::next_weekly_timestamp(
                TIMESTAMP,
                weeks,
                None,
                &timing::TimingOptions::default(),
            );

            assert_eq!(
                ((next_timestamp.as_ms() - TIMESTAMP.as_ms()) / WEEK_MILLIS as i64) % weeks as i64,
                0,
            )
        }
    }
}
