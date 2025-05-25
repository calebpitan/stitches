use core::fmt;
use core::fmt::{Debug, Display};

#[derive(Debug, Clone, Copy)]
pub enum ConversionError<T>
where
    T: Debug,
{
    /// The value to be converted is out of the defined range.
    /// `RangeError(value, lower, upper)`
    RangeError(T, T, T),
}

impl<T> std::error::Error for ConversionError<T> where T: Debug {}

impl<T> Display for ConversionError<T>
where
    T: Debug,
{
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        match self {
            ConversionError::RangeError(value, lower, upper) => {
                write!(
                    f,
                    "Value '{:?}' is out of range {:?} to {:?}",
                    value, lower, upper
                )
            }
        }
    }
}

#[derive(Debug)]
pub enum ParseError {
    /// There was an error parsing a timezone string
    Timezone(chrono_tz::ParseError),
    /// There was an error parsing a datetime
    DateTime(chrono::ParseError),
    /// There was an error parsing a cron expression
    CronExpr(cron_parser::ParseError),
    /// The parsed input could not be resolved into a useful output
    ResolutionFailed,
}

impl std::error::Error for ParseError {}

impl Display for ParseError {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        match &self {
            ParseError::Timezone(err) => write!(f, "{}", err),
            ParseError::DateTime(err) => write!(f, "{}", err),
            ParseError::CronExpr(err) => write!(f, "{}", err),
            ParseError::ResolutionFailed => {
                write!(f, "The parsed input could not resolve to a useful output")
            }
        }
    }
}

impl From<chrono::ParseError> for ParseError {
    fn from(value: chrono::ParseError) -> Self {
        ParseError::DateTime(value)
    }
}

impl From<chrono_tz::ParseError> for ParseError {
    fn from(value: chrono_tz::ParseError) -> Self {
        ParseError::Timezone(value)
    }
}

impl From<cron_parser::ParseError> for ParseError {
    fn from(value: cron_parser::ParseError) -> Self {
        ParseError::CronExpr(value)
    }
}

#[derive(Debug)]
pub enum TimingError {
    /// A parse error occured while trying to parse one or more of the parameters
    /// needed to generate a `Timing`.
    ParseError(ParseError),
    /// The frequency expression has a validity date after which the timing should stop
    /// repeating, and that validity date is now passed.
    FrequencyExpired,
    /// Some of the required frequency expressions are missing, for example when supplied
    /// an empty cron expression vector or two mutually exclusive parameters are missing as
    /// in monthly frequency expressions.
    MissingExpression,
    /// The timing for the frequency expression cannot be determined at the time after several
    /// attempts at a resolution.
    NonDeterministic,
    /// A conflict is reached when evaluating the timing for a frequency probably because the
    /// previous timing hasn't elapsed or been due yet.
    Conflict,
}

impl std::error::Error for TimingError {}

impl Display for TimingError {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        match &self {
            TimingError::ParseError(err) => write!(f, "{}", err),
            TimingError::FrequencyExpired => write!(
                f,
                "The timing frequency has expired since its given 'until' is passed "
            ),
            TimingError::MissingExpression => {
                write!(
                    f,
                    "The frequency expressions list is either empty or parameters omitted"
                )
            }
            TimingError::NonDeterministic => {
                write!(f, "The correct timing could not be determined at the time")
            }
            TimingError::Conflict => write!(f, "There seem to be ongoing timing that is yet due"),
        }
    }
}

impl From<ParseError> for TimingError {
    fn from(value: ParseError) -> Self {
        TimingError::ParseError(value)
    }
}

impl From<chrono::ParseError> for TimingError {
    fn from(value: chrono::ParseError) -> Self {
        TimingError::ParseError(value.into())
    }
}

impl From<chrono_tz::ParseError> for TimingError {
    fn from(value: chrono_tz::ParseError) -> Self {
        TimingError::ParseError(value.into())
    }
}

impl From<cron_parser::ParseError> for TimingError {
    fn from(value: cron_parser::ParseError) -> Self {
        TimingError::ParseError(value.into())
    }
}
