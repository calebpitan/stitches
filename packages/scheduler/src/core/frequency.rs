use core::fmt;
use std::cmp::Ordering;

use wasm_bindgen::prelude::*;

use crate::traits::Repeating;

#[derive(Debug, Clone, PartialEq, Eq)]
pub enum StFrequency {
    Regular(StRegularFrequency),
    Custom(StCustomFrequency),
}

#[wasm_bindgen]
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum StFrequencyType {
    Hour,
    Day,
    Week,
    Month,
    Year,
    Custom,
}

#[wasm_bindgen]
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum StOrdinals {
    First,
    Second,
    Third,
    Fourth,
    Fifth,
    Last,
}

#[wasm_bindgen]
#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash)]
pub enum StMonth {
    Jan,
    Feb,
    Mar,
    Apr,
    May,
    Jun,
    Jul,
    Aug,
    Sep,
    Oct,
    Nov,
    Dec,
}

#[wasm_bindgen]
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
/// Constant weekdays that are statically known and require no computation
pub enum StConstWeekday {
    Sun,
    Mon,
    Tue,
    Wed,
    Thu,
    Fri,
    Sat,
}

#[wasm_bindgen]
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
/// Varaible weekdays that require dynamic computation when combined with ordinals
pub enum StVarWeekday {
    /// Any weekday
    Day,
    /// Any day between Mon-Fri
    Weekday,
    /// Any day between Sat-Sun
    Weekend,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum StWeekday {
    Const(StConstWeekday),
    Var(StVarWeekday),
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub enum StFrequencyExpression {
    Hourly(StHourlyExpression),
    Daily(StDailyExpression),
    Weekly(StWeeklyExpression),
    Monthly(StMonthlyExpression),
    Yearly(StYearlyExpression),
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub enum StMonthlySubExpression {
    OnDays(StMonthlyOnDaysSubExpression),
    OnThe(StMonthlyOnTheSubExpression),
}

#[wasm_bindgen]
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub struct StHourlyExpression {
    pub every: u8,
}

#[wasm_bindgen]
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub struct StDailyExpression {
    pub every: u8,
}

#[wasm_bindgen]
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct StWeeklySubExpression {
    pub(crate) weekdays: Vec<StConstWeekday>,
}

#[wasm_bindgen]
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct StWeeklyExpression {
    pub every: u8,
    pub(crate) subexpr: StWeeklySubExpression,
}

#[wasm_bindgen]
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct StMonthlyOnDaysSubExpression {
    days: Vec<u8>,
}

#[wasm_bindgen]
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub struct StMonthlyOnTheSubExpression {
    ordinal: StOrdinals,
    weekday: StConstWeekday,
}

#[wasm_bindgen]
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct StMonthlyExpression {
    pub every: u8,
    subexpr: StMonthlySubExpression,
}

#[wasm_bindgen]
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct StYearlyInSubExpression {
    months: Vec<StMonth>,
}

#[wasm_bindgen]
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub struct StYearlyOnTheSubExpression {
    ordinal: StOrdinals,
    weekday: StWeekday,
}

#[wasm_bindgen]
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct StYearlySubExpression {
    r#in: StYearlyInSubExpression,
    on: Option<StYearlyOnTheSubExpression>,
}

#[wasm_bindgen]
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct StYearlyExpression {
    pub every: u8,
    subexpr: StYearlySubExpression,
}

#[wasm_bindgen]
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct StRegularFrequency {
    pub ftype: StFrequencyType,
    pub until: Option<u64>,
    pub(crate) expr: StFrequencyExpression,
}

#[wasm_bindgen]
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct StCustomFrequency {
    pub ftype: StFrequencyType,
    pub until: Option<u64>,
    /// The timezone offset in milliseconds to use for parsing the cron
    pub tz_offset: i32,
    cron_expressions: Vec<String>,
}

impl StOrdinals {
    /// Gets the value, from 0-4 and 255, of the given enum variant
    #[rustfmt::skip]
    pub fn to_value(variant: &Self) -> u8 {
        match variant {
            Self::First     => 0x00,
            Self::Second    => 0x01,
            Self::Third     => 0x02,
            Self::Fourth    => 0x03,
            Self::Fifth     => 0x04,
            Self::Last      => 0xFF,
        }
    }

    /// Gets the enum variant from a value between 0-4 and 255
    ///
    /// # Panics
    ///
    /// When the supplied value is out of bounds, that is, greater than 4 and less than 255
    pub fn from_value(value: &u8) -> Self {
        match value {
            0x00 => Self::First,
            0x01 => Self::Second,
            0x02 => Self::Third,
            0x03 => Self::Fourth,
            0x04 => Self::Fifth,
            0xFF => Self::Last,
            _ => panic!(
                "Unknown value '{}': allowed values are 0x00...0x04 and 0xFF",
                value
            ),
        }
    }
}

impl fmt::Display for StOrdinals {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        f.write_str(match self {
            StOrdinals::First => "First",
            StOrdinals::Second => "Second",
            StOrdinals::Third => "Third",
            StOrdinals::Fourth => "Fourth",
            StOrdinals::Fifth => "Fifth",
            StOrdinals::Last => "Last",
        })
    }
}

impl Ord for StOrdinals {
    fn cmp(&self, other: &Self) -> Ordering {
        let self_value = Self::to_value(self);
        let other_value = Self::to_value(other);

        // place other before self for an inverse ordering
        other_value.cmp(&self_value)
    }
}

impl PartialOrd for StOrdinals {
    fn partial_cmp(&self, other: &Self) -> Option<Ordering> {
        Some(self.cmp(other))
    }
}

impl StConstWeekday {
    /// Gets the value, from 0-6, for the given enum variant
    pub fn to_value(variant: &Self) -> u8 {
        match &variant {
            Self::Sun => 0,
            Self::Mon => 1,
            Self::Tue => 2,
            Self::Wed => 3,
            Self::Thu => 4,
            Self::Fri => 5,
            Self::Sat => 6,
        }
    }

    /// Gets the enum variant from a value between 0-6
    ///
    /// # Panics
    ///
    /// When the supplied value is out of bounds, that is, greater than 6
    pub fn from_value(value: &u8) -> Self {
        match value {
            0 => StConstWeekday::Sun,
            1 => StConstWeekday::Mon,
            2 => StConstWeekday::Tue,
            3 => StConstWeekday::Wed,
            4 => StConstWeekday::Thu,
            5 => StConstWeekday::Fri,
            6 => StConstWeekday::Sat,
            _ => panic!(
                "Weekday '{}' out of bounds: allowed values are 0...6",
                value
            ),
        }
    }

    pub fn to_chrono_weekday(weekday: &Self) -> chrono::Weekday {
        match weekday {
            StConstWeekday::Sun => chrono::Weekday::Sun,
            StConstWeekday::Mon => chrono::Weekday::Mon,
            StConstWeekday::Tue => chrono::Weekday::Tue,
            StConstWeekday::Wed => chrono::Weekday::Wed,
            StConstWeekday::Thu => chrono::Weekday::Thu,
            StConstWeekday::Fri => chrono::Weekday::Fri,
            StConstWeekday::Sat => chrono::Weekday::Sat,
        }
    }

    pub fn from_chrono_weekday(chrono_weekday: &chrono::Weekday) -> Self {
        match chrono_weekday {
            chrono::Weekday::Sun => StConstWeekday::Sun,
            chrono::Weekday::Mon => StConstWeekday::Mon,
            chrono::Weekday::Tue => StConstWeekday::Tue,
            chrono::Weekday::Wed => StConstWeekday::Wed,
            chrono::Weekday::Thu => StConstWeekday::Thu,
            chrono::Weekday::Fri => StConstWeekday::Fri,
            chrono::Weekday::Sat => StConstWeekday::Sat,
        }
    }
}

impl fmt::Display for StConstWeekday {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        f.write_str(match self {
            StConstWeekday::Sun => "Sun",
            StConstWeekday::Mon => "Mon",
            StConstWeekday::Tue => "Tue",
            StConstWeekday::Wed => "Wed",
            StConstWeekday::Thu => "Thu",
            StConstWeekday::Fri => "Fri",
            StConstWeekday::Sat => "Sat",
        })
    }
}

impl Ord for StConstWeekday {
    fn cmp(&self, other: &Self) -> Ordering {
        let self_value = Self::to_value(self);
        let other_value = Self::to_value(other);

        self_value.cmp(&other_value)
    }
}

impl PartialOrd for StConstWeekday {
    fn partial_cmp(&self, other: &Self) -> Option<Ordering> {
        Some(self.cmp(other))
    }
}

impl StMonth {
    /// Gets the value, from 0-11, for the given enum variant
    pub fn to_value(variant: &Self) -> u8 {
        match variant {
            Self::Jan => 0,
            Self::Feb => 1,
            Self::Mar => 2,
            Self::Apr => 3,
            Self::May => 4,
            Self::Jun => 5,
            Self::Jul => 6,
            Self::Aug => 7,
            Self::Sep => 8,
            Self::Oct => 9,
            Self::Nov => 10,
            Self::Dec => 11,
        }
    }

    /// Gets the enum variant from a value between 0-11
    ///
    /// # Panics
    ///
    /// When the supplied value is out of bounds, that is, greater than 11
    pub fn from_value(value: &u8) -> Self {
        match value {
            0 => Self::Jan,
            1 => Self::Feb,
            2 => Self::Mar,
            3 => Self::Apr,
            4 => Self::May,
            5 => Self::Jun,
            6 => Self::Jul,
            7 => Self::Aug,
            8 => Self::Sep,
            9 => Self::Oct,
            10 => Self::Nov,
            11 => Self::Dec,
            _ => panic!("Month '{}' out of bounds: allowed values are 0...11", value),
        }
    }

    pub fn number_of_days(&self) -> u8 {
        match self {
            Self::Jan => 31,
            Self::Feb => 28,
            Self::Mar => 31,
            Self::Apr => 30,
            Self::May => 31,
            Self::Jun => 30,
            Self::Jul => 31,
            Self::Aug => 31,
            Self::Sep => 30,
            Self::Oct => 31,
            Self::Nov => 30,
            Self::Dec => 31,
        }
    }

    pub fn number_of_leap_days(&self) -> u8 {
        match self {
            Self::Feb => 29,
            _ => self.number_of_days(),
        }
    }
}

impl fmt::Display for StMonth {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        f.write_str(match self {
            StMonth::Jan => "Jan",
            StMonth::Feb => "Feb",
            StMonth::Mar => "Mar",
            StMonth::Apr => "Apr",
            StMonth::May => "May",
            StMonth::Jun => "Jun",
            StMonth::Jul => "Jul",
            StMonth::Aug => "Aug",
            StMonth::Sep => "Sep",
            StMonth::Oct => "Oct",
            StMonth::Nov => "Nov",
            StMonth::Dec => "Dec",
        })
    }
}

impl Ord for StMonth {
    fn cmp(&self, other: &Self) -> Ordering {
        let self_value = Self::to_value(self);
        let other_value = Self::to_value(other);

        self_value.cmp(&other_value)
    }
}

impl PartialOrd for StMonth {
    fn partial_cmp(&self, other: &Self) -> Option<Ordering> {
        Some(self.cmp(other))
    }
}

impl Repeating for StFrequencyExpression {
    fn every(&self) -> u64 {
        (match &self {
            Self::Daily(v) => v.every,
            Self::Hourly(v) => v.every,
            Self::Monthly(v) => v.every,
            Self::Weekly(v) => v.every,
            Self::Yearly(v) => v.every,
        }) as u64
    }
}

#[wasm_bindgen]
impl StHourlyExpression {
    #[wasm_bindgen(constructor)]
    pub fn new(every: u8) -> Self {
        StHourlyExpression { every }
    }
}

#[wasm_bindgen]
impl StDailyExpression {
    #[wasm_bindgen(constructor)]
    pub fn new(every: u8) -> Self {
        StDailyExpression { every }
    }
}

#[wasm_bindgen]
impl StWeeklySubExpression {
    #[wasm_bindgen(constructor)]
    /// Initializes a sub expression for a weekly frequency strategy
    pub fn new(weekdays: Vec<u8>) -> Self {
        assert!(
            weekdays.len() <= 7,
            "Size of `weekdays` can't be more than 7"
        );

        let weekdays = weekdays
            .iter()
            .take(7)
            .map(|w| StConstWeekday::from_value(w))
            .collect::<Vec<StConstWeekday>>();

        StWeeklySubExpression { weekdays }
    }

    pub(crate) fn get_weekdays(&self) -> &Vec<StConstWeekday> {
        &self.weekdays
    }
}

#[wasm_bindgen]
impl StWeeklyExpression {
    #[wasm_bindgen(constructor)]
    /// Initializes an expression for a weekly frequency strategy
    pub fn new(every: u8, subexpr: StWeeklySubExpression) -> Self {
        StWeeklyExpression { every, subexpr }
    }

    /// Initializes an expression for a weekly frequency strategy
    pub fn with_weekdays(every: u8, weekdays: Vec<u8>) -> Self {
        StWeeklyExpression {
            every,
            subexpr: StWeeklySubExpression::new(weekdays),
        }
    }

    #[inline]
    pub(crate) fn get_subexpr(&self) -> &StWeeklySubExpression {
        &self.subexpr
    }
}

#[wasm_bindgen]
impl StMonthlyOnDaysSubExpression {
    #[wasm_bindgen(constructor)]
    /// Initializes a sub expression for a monthly,
    /// "every \[month\] on \[days\]" relationship, frequency strategy.
    ///
    /// # Panics
    ///
    /// If the size of days exceeds the maximum, `31`, different, possible days in a month
    pub fn new(days: Vec<u8>) -> Self {
        assert!(days.len() <= 31, "Size of `days` cannot be more than 31");
        StMonthlyOnDaysSubExpression { days }
    }
}

#[wasm_bindgen]
impl StMonthlyOnTheSubExpression {
    #[wasm_bindgen(constructor)]
    /// Initializes a sub expression for a monthly,
    /// "every \[month\] on the \[ordinal (e.g first)\] \[weekday (e.g Sun)\]"
    /// relationship, frequency strategy.
    pub fn new(ordinal: StOrdinals, weekday: StConstWeekday) -> Self {
        StMonthlyOnTheSubExpression { ordinal, weekday }
    }
}

#[wasm_bindgen]
impl StMonthlyExpression {
    /// Initializes an expression for a monthly,
    /// "every \[month\] on \[days\]" relationship, frequency strategy.
    pub fn with_ondays_expr(every: u8, subexpr: StMonthlyOnDaysSubExpression) -> Self {
        StMonthlyExpression {
            every,
            subexpr: StMonthlySubExpression::OnDays(subexpr),
        }
    }

    /// Initializes an expression for a monthly,
    /// "every \[month\] on the \[ordinal (e.g first)\] \[weekday (e.g Sun)\]"
    /// relationship, frequency strategy.
    pub fn with_onthe_expr(every: u8, subexpr: StMonthlyOnTheSubExpression) -> Self {
        StMonthlyExpression {
            every,
            subexpr: StMonthlySubExpression::OnThe(subexpr),
        }
    }

    /// Initializes an `StMonthlyExpression` equivalent to [with_ondays_expr][StMonthlyExpression::with_ondays_expr]
    pub fn with_days(every: u8, days: Vec<u8>) -> Self {
        StMonthlyExpression {
            every,
            subexpr: StMonthlySubExpression::OnDays(StMonthlyOnDaysSubExpression::new(days)),
        }
    }

    /// Initializes an `StMonthlyExpression` equivalent to [with_onthe_expr][StMonthlyExpression::with_onthe_expr]
    pub fn with_ordinal_weekday(every: u8, ordinal: StOrdinals, weekday: StConstWeekday) -> Self {
        StMonthlyExpression {
            every,
            subexpr: StMonthlySubExpression::OnThe(StMonthlyOnTheSubExpression::new(
                ordinal, weekday,
            )),
        }
    }

    /// A getter for the ordinal-weekday sub-expression
    pub fn get_onthe_subexpr(&self) -> Option<StMonthlyOnTheSubExpression> {
        match &self.subexpr {
            StMonthlySubExpression::OnThe(subexpr) => Some(*subexpr),
            _ => None,
        }
    }

    /// A getter for the days sub-expression
    pub fn get_ondays_subexpr(&self) -> Option<StMonthlyOnDaysSubExpression> {
        match &self.subexpr {
            StMonthlySubExpression::OnDays(subexpr) => Some(subexpr.to_owned()),
            _ => None,
        }
    }
}

#[wasm_bindgen]
impl StYearlyInSubExpression {
    #[wasm_bindgen(constructor)]
    /// Initializes a sub expression for a yearly,
    /// "in \[...months\] relationship, frequency strategy.
    pub fn new(months: Vec<u8>) -> Self {
        assert!(months.len() <= 12, "Size of `months` can't be more than 12");
        let months = months
            .iter()
            .take(12)
            .map(|m| StMonth::from_value(m))
            .collect::<Vec<StMonth>>();

        StYearlyInSubExpression { months }
    }

    #[inline]
    pub fn get_months(&self) -> Vec<StMonth> {
        self.months.to_owned()
    }
}

#[wasm_bindgen]
impl StYearlyOnTheSubExpression {
    #[wasm_bindgen(constructor)]
    /// Initializes a sub expression for a yearly,
    /// "on the \[ordinal (e.g first)\] \[weekday (e.g Sun)\]" relationship, frequency strategy.
    pub fn new(ordinal: StOrdinals, weekday: StConstWeekday) -> Self {
        StYearlyOnTheSubExpression {
            ordinal,
            weekday: StWeekday::Const(weekday),
        }
    }

    /// Initializes a sub expression for a yearly,
    /// "on the \[ordinal (e.g first)\] \[weekday (e.g Weekend)\]" relationship, frequency strategy.
    pub fn with_var_weekday(ordinal: StOrdinals, weekday: StVarWeekday) -> Self {
        StYearlyOnTheSubExpression {
            ordinal,
            weekday: StWeekday::Var(weekday),
        }
    }

    #[inline]
    pub fn get_ordinal(&self) -> StOrdinals {
        self.ordinal
    }

    pub fn get_const_weekday(&self) -> Option<StConstWeekday> {
        match &self.weekday {
            StWeekday::Const(const_weekday) => Some(*const_weekday),
            _ => None,
        }
    }

    pub fn get_var_weekday(&self) -> Option<StVarWeekday> {
        match &self.weekday {
            StWeekday::Var(var_weekday) => Some(*var_weekday),
            _ => None,
        }
    }
}

#[wasm_bindgen]
impl StYearlySubExpression {
    #[wasm_bindgen(constructor)]
    /// Initializes an expression for a yearly,
    /// "`in` \[months (e.g Jan)\] `on` \[ordinal (e.g first)\] \[weekday (e.g Sun)\]"
    /// relationship, frequency strategy.
    pub fn new(_in: StYearlyInSubExpression, on: Option<StYearlyOnTheSubExpression>) -> Self {
        StYearlySubExpression { r#in: _in, on }
    }

    /// Initializes an expression for a yearly, "`in` \[months (e.g Jan)\]" relationship, frequency strategy.
    pub fn with_months(months: Vec<u8>) -> Self {
        StYearlySubExpression {
            r#in: StYearlyInSubExpression::new(months),
            on: None,
        }
    }

    /// Initializes an `StYearlySubExpression` with a constant weekday (Sun-Sat) equivalent to
    /// [new][StMonthlyExpression::new] when the `on` argument is not `None`
    pub fn with_months_ordinal_const_weekday(
        months: Vec<u8>,
        ordinal: StOrdinals,
        weekday: StConstWeekday,
    ) -> Self {
        StYearlySubExpression {
            r#in: StYearlyInSubExpression::new(months),
            on: Some(StYearlyOnTheSubExpression::new(ordinal, weekday)),
        }
    }

    /// Initializes an `StYearlySubExpression` with a variable weekday (Day, Weekday, Weekend)
    /// equivalent to [new][StMonthlyExpression::new] when the `on` argument is not `None`
    pub fn with_months_ordinal_var_weekday(
        months: Vec<u8>,
        ordinal: StOrdinals,
        weekday: StVarWeekday,
    ) -> Self {
        StYearlySubExpression {
            r#in: StYearlyInSubExpression::new(months),
            on: Some(StYearlyOnTheSubExpression::with_var_weekday(
                ordinal, weekday,
            )),
        }
    }

    #[inline]
    pub fn get_in_expr(&self) -> StYearlyInSubExpression {
        self.r#in.to_owned()
    }

    #[inline]
    pub fn get_on_expr(&self) -> Option<StYearlyOnTheSubExpression> {
        self.on.to_owned()
    }
}

#[wasm_bindgen]
impl StYearlyExpression {
    #[wasm_bindgen(constructor)]
    pub fn new(every: u8, subexpr: StYearlySubExpression) -> Self {
        StYearlyExpression { every, subexpr }
    }

    pub fn with_months(every: u8, months: Vec<u8>) -> Self {
        StYearlyExpression {
            every,
            subexpr: StYearlySubExpression::with_months(months),
        }
    }

    pub fn with_months_ordinal_const_weekday(
        every: u8,
        months: Vec<u8>,
        ordinal: StOrdinals,
        weekday: StConstWeekday,
    ) -> Self {
        StYearlyExpression {
            every,
            subexpr: StYearlySubExpression::with_months_ordinal_const_weekday(
                months, ordinal, weekday,
            ),
        }
    }

    pub fn with_months_ordinal_var_weekday(
        every: u8,
        months: Vec<u8>,
        ordinal: StOrdinals,
        weekday: StVarWeekday,
    ) -> Self {
        StYearlyExpression {
            every,
            subexpr: StYearlySubExpression::with_months_ordinal_var_weekday(
                months, ordinal, weekday,
            ),
        }
    }
}

#[wasm_bindgen]
impl StRegularFrequency {
    #[wasm_bindgen(constructor)]
    pub fn new(ftype: StFrequencyType, expr: StHourlyExpression, until: Option<u64>) -> Self {
        StRegularFrequency {
            ftype,
            until,
            expr: StFrequencyExpression::Hourly(expr),
        }
    }

    pub fn with_daily_expr(
        ftype: StFrequencyType,
        expr: StDailyExpression,
        until: Option<u64>,
    ) -> Self {
        StRegularFrequency {
            ftype,
            until,
            expr: StFrequencyExpression::Daily(expr),
        }
    }

    pub fn with_weekly_expr(
        ftype: StFrequencyType,
        expr: StWeeklyExpression,
        until: Option<u64>,
    ) -> Self {
        StRegularFrequency {
            ftype,
            until,
            expr: StFrequencyExpression::Weekly(expr),
        }
    }

    pub fn with_monthly_expr(
        ftype: StFrequencyType,
        expr: StMonthlyExpression,
        until: Option<u64>,
    ) -> Self {
        StRegularFrequency {
            ftype,
            until,
            expr: StFrequencyExpression::Monthly(expr),
        }
    }

    pub fn with_yearly_expr(
        ftype: StFrequencyType,
        expr: StYearlyExpression,
        until: Option<u64>,
    ) -> Self {
        StRegularFrequency {
            ftype,
            until,
            expr: StFrequencyExpression::Yearly(expr),
        }
    }

    #[inline]
    pub(crate) fn get_expr(&self) -> &StFrequencyExpression {
        &self.expr
    }

    pub fn get_hourly_expr(&self) -> Option<StHourlyExpression> {
        match &self.expr {
            StFrequencyExpression::Hourly(expr) => Some(*expr),
            _ => None,
        }
    }

    pub fn get_daily_expr(&self) -> Option<StDailyExpression> {
        match &self.expr {
            StFrequencyExpression::Daily(expr) => Some(*expr),
            _ => None,
        }
    }

    pub fn get_weekly_expr(&self) -> Option<StWeeklyExpression> {
        match &self.expr {
            StFrequencyExpression::Weekly(expr) => Some(expr.to_owned()),
            _ => None,
        }
    }

    pub fn get_monthly_expr(&self) -> Option<StMonthlyExpression> {
        match &self.expr {
            StFrequencyExpression::Monthly(expr) => Some(expr.to_owned()),
            _ => None,
        }
    }

    pub fn get_yearly_expr(&self) -> Option<StYearlyExpression> {
        match &self.expr {
            StFrequencyExpression::Yearly(expr) => Some(expr.to_owned()),
            _ => None,
        }
    }
}

#[wasm_bindgen]
impl StCustomFrequency {
    #[wasm_bindgen(constructor)]
    pub fn new(tz_offset: i32, cron_expressions: Vec<String>, until: Option<u64>) -> Self {
        assert!(
            cron_expressions.len() <= 3,
            "Only a maximum of three cron expressions are allowed for a custom frequency"
        );
        StCustomFrequency {
            ftype: StFrequencyType::Custom,
            until,
            tz_offset,
            cron_expressions,
        }
    }

    pub fn get_cron_expressions(&self) -> Vec<String> {
        self.cron_expressions.clone()
    }
}
