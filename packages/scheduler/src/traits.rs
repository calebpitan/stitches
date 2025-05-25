pub use crate::core::time::Ts; // Re-Export

pub trait Comparator<T> {
    fn compare(&self, a: &T, b: &T) -> bool;
}

pub trait ID {
    /// Returns the identifier to its `Self`
    fn get_id(&self) -> String;
}

pub trait Repeating {
    /// Returns the repeat frequency for a repeating event
    /// The frequency returned cannot alone be made sense of without a unit of frequency.
    /// For example, yearly, daily, etc.
    fn every(&self) -> u32;
}
