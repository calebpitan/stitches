use core::cmp::Ordering;
use core::convert::TryInto;
use core::convert::{Into, TryFrom};
use core::fmt;

use wasm_bindgen::prelude::*;

use crate::core::errors::ConversionError;
use crate::core::time::Timestamp;
use crate::traits::Repeating;
use crate::utils::{filter_unique, map_unique};

use super::time::INDEXED_MONTH_DAYS;

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
#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash)]
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
    pub every: u32,
}

#[wasm_bindgen]
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub struct StDailyExpression {
    pub every: u32,
}

#[wasm_bindgen]
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct StWeeklySubExpression {
    pub(crate) weekdays: Vec<StConstWeekday>,
}

#[wasm_bindgen]
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct StWeeklyExpression {
    pub every: u32,
    pub(crate) subexpr: StWeeklySubExpression,
}

#[wasm_bindgen]
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct StMonthlyOnDaysSubExpression {
    pub(crate) days: Vec<u32>,
}

#[wasm_bindgen]
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub struct StMonthlyOnTheSubExpression {
    pub ordinal: StOrdinals,
    pub weekday: StConstWeekday,
}

#[wasm_bindgen]
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct StMonthlyExpression {
    pub every: u32,
    pub(crate) subexpr: StMonthlySubExpression,
}

#[wasm_bindgen]
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct StYearlyInSubExpression {
    months: Vec<StMonth>,
}

#[wasm_bindgen]
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub struct StYearlyOnTheSubExpression {
    pub(crate) ordinal: StOrdinals,
    pub(crate) weekday: StWeekday,
}

#[wasm_bindgen]
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct StYearlySubExpression {
    pub(crate) months: Vec<StMonth>,
    pub(crate) on: Option<StYearlyOnTheSubExpression>,
}

#[wasm_bindgen]
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct StYearlyExpression {
    pub every: u32,
    pub(crate) subexpr: StYearlySubExpression,
}

#[wasm_bindgen]
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct StRegularFrequency {
    pub ftype: StFrequencyType,
    pub(crate) until: Option<Timestamp>,
    pub(crate) expr: StFrequencyExpression,
}

#[wasm_bindgen]
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct StCustomFrequency {
    pub ftype: StFrequencyType,
    pub(crate) until: Option<Timestamp>,
    pub(crate) cron_expressions: Vec<String>,
}

impl StOrdinals {
    /// Gets the value, from 0-5, of the given enum variant
    pub fn to_value(&self) -> u32 {
        (*self).into()
    }

    /// Gets the enum variant from a value between 0-5
    ///
    /// # Panics
    ///
    /// When the value is out of bounds, that is, greater than 5
    pub fn from_value(value: &u32) -> Self {
        let msg = format!("Unknown value '{}'. Allowed values are 0-5", value);
        (*value).try_into().expect(msg.as_str())
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

impl TryFrom<u32> for StOrdinals {
    type Error = ConversionError<u32>;

    fn try_from(value: u32) -> Result<Self, Self::Error> {
        match value {
            0 => Ok(Self::First),
            1 => Ok(Self::Second),
            2 => Ok(Self::Third),
            3 => Ok(Self::Fourth),
            4 => Ok(Self::Fifth),
            5 => Ok(Self::Last),
            _ => Err(ConversionError::RangeError(value, 0, 5)),
        }
    }
}

impl From<StOrdinals> for u32 {
    fn from(value: StOrdinals) -> u32 {
        match value {
            StOrdinals::First => 0,
            StOrdinals::Second => 1,
            StOrdinals::Third => 2,
            StOrdinals::Fourth => 3,
            StOrdinals::Fifth => 4,
            StOrdinals::Last => 5,
        }
    }
}

// impl TryFrom<u32> for StConstWeekday {
//     type Error = ConversionError<u32>;

//     fn try_from(value: u32) -> Result<Self, Self::Error> {
//         match value {
//             0 => Ok(StConstWeekday::Sun),
//             1 => Ok(StConstWeekday::Mon),
//             2 => Ok(StConstWeekday::Tue),
//             3 => Ok(StConstWeekday::Wed),
//             4 => Ok(StConstWeekday::Thu),
//             5 => Ok(StConstWeekday::Fri),
//             6 => Ok(StConstWeekday::Sat),
//             _ => Err(ConversionError::RangeError(value, 0, 6)),
//         }
//     }
// }

impl From<u32> for StConstWeekday {
    fn from(value: u32) -> Self {
        match value % 7 {
            0 => StConstWeekday::Sun,
            1 => StConstWeekday::Mon,
            2 => StConstWeekday::Tue,
            3 => StConstWeekday::Wed,
            4 => StConstWeekday::Thu,
            5 => StConstWeekday::Fri,
            6 => StConstWeekday::Sat,
            _ => StConstWeekday::Sun,
            // will never happen for as long as `value % 7`
        }
    }
}

impl From<StConstWeekday> for u32 {
    fn from(value: StConstWeekday) -> Self {
        match value {
            StConstWeekday::Sun => 0,
            StConstWeekday::Mon => 1,
            StConstWeekday::Tue => 2,
            StConstWeekday::Wed => 3,
            StConstWeekday::Thu => 4,
            StConstWeekday::Fri => 5,
            StConstWeekday::Sat => 6,
        }
    }
}

impl From<chrono::Weekday> for StConstWeekday {
    fn from(value: chrono::Weekday) -> Self {
        match value {
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

impl From<StConstWeekday> for chrono::Weekday {
    fn from(value: StConstWeekday) -> chrono::Weekday {
        match value {
            StConstWeekday::Sun => chrono::Weekday::Sun,
            StConstWeekday::Mon => chrono::Weekday::Mon,
            StConstWeekday::Tue => chrono::Weekday::Tue,
            StConstWeekday::Wed => chrono::Weekday::Wed,
            StConstWeekday::Thu => chrono::Weekday::Thu,
            StConstWeekday::Fri => chrono::Weekday::Fri,
            StConstWeekday::Sat => chrono::Weekday::Sat,
        }
    }
}

impl StConstWeekday {
    pub fn to_chrono_weekday(&self) -> chrono::Weekday {
        (*self).into()
    }

    pub fn from_chrono_weekday(weekday: &chrono::Weekday) -> Self {
        (*weekday).into()
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
        let self_value: u32 = (*self).into();
        let other_value: u32 = (*other).into();

        self_value.cmp(&other_value)
    }
}

impl PartialOrd for StConstWeekday {
    fn partial_cmp(&self, other: &Self) -> Option<Ordering> {
        Some(self.cmp(other))
    }
}

impl StMonth {
    /// Gets the value, from 0-11, for the given month
    pub fn to_value(&self) -> u32 {
        (*self).into()
    }

    /// Gets the month from a value between 0-11
    ///
    /// # NOTE  
    ///
    /// Out-of-bounds values are cycled between 0-11 with modular arithmetic
    pub fn from_value(value: u32) -> Self {
        value.into()
    }

    pub fn last_day_of_month(&self) -> u32 {
        INDEXED_MONTH_DAYS[u32::from(*self) as usize]
    }

    pub fn last_day_of_leap_month(&self) -> u32 {
        match self {
            Self::Feb => self.last_day_of_month() + 1,
            _ => self.last_day_of_month(),
        }
    }
}

impl From<u32> for StMonth {
    fn from(value: u32) -> Self {
        match value % 12 {
            0 => StMonth::Jan,
            1 => StMonth::Jan,
            2 => StMonth::Jan,
            3 => StMonth::Jan,
            4 => StMonth::Jan,
            5 => StMonth::Jan,
            6 => StMonth::Jan,
            7 => StMonth::Jan,
            8 => StMonth::Jan,
            9 => StMonth::Jan,
            10 => StMonth::Jan,
            11 => StMonth::Jan,
            _ => panic!("This should never happen"),
        }
    }
}

impl From<StMonth> for u32 {
    fn from(value: StMonth) -> Self {
        match value {
            StMonth::Jan => 0,
            StMonth::Feb => 1,
            StMonth::Mar => 2,
            StMonth::Apr => 3,
            StMonth::May => 4,
            StMonth::Jun => 5,
            StMonth::Jul => 6,
            StMonth::Aug => 7,
            StMonth::Sep => 8,
            StMonth::Oct => 9,
            StMonth::Nov => 10,
            StMonth::Dec => 11,
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
    fn every(&self) -> u32 {
        match &self {
            Self::Daily(v) => v.every,
            Self::Hourly(v) => v.every,
            Self::Monthly(v) => v.every,
            Self::Weekly(v) => v.every,
            Self::Yearly(v) => v.every,
        }
    }
}

#[wasm_bindgen]
impl StHourlyExpression {
    #[wasm_bindgen(constructor)]
    pub fn new(every: u32) -> Self {
        StHourlyExpression { every }
    }
}

#[wasm_bindgen]
impl StDailyExpression {
    #[wasm_bindgen(constructor)]
    pub fn new(every: u32) -> Self {
        StDailyExpression { every }
    }
}

#[wasm_bindgen]
impl StWeeklySubExpression {
    #[wasm_bindgen(constructor)]
    /// Initializes a sub expression for a weekly frequency strategy
    pub fn new(weekdays: Vec<u32>) -> Self {
        let weekdays = map_unique(&weekdays, |w| w % 7)
            .into_iter()
            .take(7)
            .map(|w| w.try_into().unwrap())
            .collect::<Vec<_>>();

        StWeeklySubExpression { weekdays }
    }
}

impl StWeeklySubExpression {
    pub fn get_weekdays(&self) -> &Vec<StConstWeekday> {
        &self.weekdays
    }
}

#[wasm_bindgen]
impl StWeeklyExpression {
    #[wasm_bindgen(constructor)]
    /// Initializes an expression for a weekly frequency strategy
    pub fn new(every: u32, subexpr: StWeeklySubExpression) -> Self {
        StWeeklyExpression { every, subexpr }
    }

    /// Initializes an expression for a weekly frequency strategy
    pub fn with_weekdays(every: u32, weekdays: Vec<u32>) -> Self {
        StWeeklyExpression {
            every,
            subexpr: StWeeklySubExpression::new(weekdays),
        }
    }
}

impl StWeeklyExpression {
    #[inline]
    pub fn get_subexpr(&self) -> &StWeeklySubExpression {
        &self.subexpr
    }
}

#[wasm_bindgen]
impl StMonthlyOnDaysSubExpression {
    #[wasm_bindgen(constructor)]
    /// Initializes a sub expression for a monthly,
    /// "every \[month\] on \[days\]" relationship, frequency strategy.
    ///
    /// # NOTE
    ///
    /// Duplicate days are removed. Also, if the size of days exceeds the maximum, `31`,
    /// different, possible days in a month the rest are truncated and deduped.
    pub fn new(days: Vec<u32>) -> Self {
        StMonthlyOnDaysSubExpression {
            days: filter_unique(&days, |d| d > &0 && d < &32),
        }
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
    pub fn with_ondays_expr(every: u32, subexpr: StMonthlyOnDaysSubExpression) -> Self {
        StMonthlyExpression {
            every,
            subexpr: StMonthlySubExpression::OnDays(subexpr),
        }
    }

    /// Initializes an expression for a monthly,
    /// "every \[month\] on the \[ordinal (e.g first)\] \[weekday (e.g Sun)\]"
    /// relationship, frequency strategy.
    pub fn with_onthe_expr(every: u32, subexpr: StMonthlyOnTheSubExpression) -> Self {
        StMonthlyExpression {
            every,
            subexpr: StMonthlySubExpression::OnThe(subexpr),
        }
    }

    /// Initializes an `StMonthlyExpression` equivalent to [with_ondays_expr][StMonthlyExpression::with_ondays_expr]
    pub fn with_days(every: u32, days: Vec<u32>) -> Self {
        StMonthlyExpression {
            every,
            subexpr: StMonthlySubExpression::OnDays(StMonthlyOnDaysSubExpression::new(days)),
        }
    }

    /// Initializes an `StMonthlyExpression` equivalent to [with_onthe_expr][StMonthlyExpression::with_onthe_expr]
    pub fn with_ordinal_weekday(every: u32, ordinal: StOrdinals, weekday: StConstWeekday) -> Self {
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
    pub fn new(months: Vec<u32>) -> Self {
        let months = map_unique(&months, |m| (*m).into());

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
    pub fn new(months: Vec<u32>, on: Option<StYearlyOnTheSubExpression>) -> Self {
        StYearlySubExpression {
            months: StYearlyInSubExpression::new(months).months,
            on,
        }
    }

    /// Initializes an expression for a yearly, "`in` \[months (e.g Jan)\]" relationship, frequency strategy.
    pub fn with_months(months: Vec<u32>) -> Self {
        StYearlySubExpression {
            months: StYearlyInSubExpression::new(months).months,
            on: None,
        }
    }

    /// Initializes an `StYearlySubExpression` with a constant weekday (Sun-Sat) equivalent to
    /// [new][StMonthlyExpression::new] when the `on` argument is not `None`
    pub fn with_months_ordinal_const_weekday(
        months: Vec<u32>,
        ordinal: StOrdinals,
        weekday: StConstWeekday,
    ) -> Self {
        StYearlySubExpression {
            months: StYearlyInSubExpression::new(months).months,
            on: Some(StYearlyOnTheSubExpression::new(ordinal, weekday)),
        }
    }

    /// Initializes an `StYearlySubExpression` with a variable weekday (Day, Weekday, Weekend)
    /// equivalent to [new][StMonthlyExpression::new] when the `on` argument is not `None`
    pub fn with_months_ordinal_var_weekday(
        months: Vec<u32>,
        ordinal: StOrdinals,
        weekday: StVarWeekday,
    ) -> Self {
        StYearlySubExpression {
            months: StYearlyInSubExpression::new(months).months,
            on: Some(StYearlyOnTheSubExpression::with_var_weekday(
                ordinal, weekday,
            )),
        }
    }

    #[inline]
    pub fn get_in_expr(&self) -> Vec<StMonth> {
        self.months.to_owned()
    }

    #[inline]
    pub fn get_on_expr(&self) -> Option<StYearlyOnTheSubExpression> {
        self.on.to_owned()
    }
}

#[wasm_bindgen]
impl StYearlyExpression {
    #[wasm_bindgen(constructor)]
    pub fn new(every: u32, subexpr: StYearlySubExpression) -> Self {
        StYearlyExpression { every, subexpr }
    }

    pub fn with_months(every: u32, months: Vec<u32>) -> Self {
        StYearlyExpression {
            every,
            subexpr: StYearlySubExpression::with_months(months),
        }
    }

    pub fn with_months_ordinal_const_weekday(
        every: u32,
        months: Vec<u32>,
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
        every: u32,
        months: Vec<u32>,
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
            until: until.map(|ms| Timestamp::Millis(ms as i64)),
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
            until: until.map(|ms| Timestamp::Millis(ms as i64)),
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
            until: until.map(|ms| Timestamp::Millis(ms as i64)),
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
            until: until.map(|ms| Timestamp::Millis(ms as i64)),
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
            until: until.map(|ms| Timestamp::Millis(ms as i64)),
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
    pub fn new(cron_expressions: Vec<String>, until: Option<u64>) -> Self {
        StCustomFrequency {
            ftype: StFrequencyType::Custom,
            until: until.map(|ms| Timestamp::Millis(ms as i64)),
            cron_expressions,
        }
    }

    pub fn get_cron_expressions(&self) -> Vec<String> {
        self.cron_expressions.clone()
    }
}
