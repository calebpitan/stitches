use std::{collections::HashSet, hash::Hash};

#[allow(dead_code)]
pub fn set_panic_hook() {
    // When the `console_error_panic_hook` feature is enabled, we can call the
    // `set_panic_hook` function at least once during initialization, and then
    // we will get better error messages if our code ever panics.
    //
    // For more details see
    // https://github.com/rustwasm/console_error_panic_hook#readme
    #[cfg(feature = "console_error_panic_hook")]
    console_error_panic_hook::set_once();
}

pub fn filter_unique<T, P>(collection: &Vec<T>, predicate: P) -> Vec<T>
where
    T: Hash + Eq + Clone,
    P: FnMut(&T) -> bool,
{
    collection
        .clone()
        .into_iter()
        .filter(predicate)
        .collect::<HashSet<T>>()
        .into_iter()
        .collect()
}

pub fn map_unique<T, B, F>(collection: &Vec<T>, f: F) -> Vec<B>
where
    B: Hash + Eq,
    F: FnMut(&T) -> B,
{
    collection
        .into_iter()
        .map(f)
        .collect::<HashSet<B>>()
        .into_iter()
        .collect()
}

#[cfg(test)]
mod tests {
    use num::Signed;

    use super::filter_unique;
    use super::map_unique;

    #[test]
    pub fn test_filter_unique() {
        let collection = vec![
            38, 192, -256, 10, 20, 10, 15, 1, 2, 6, 2, 3, 2, 6, 5, 17, 15, -1, 10, -25,
        ];
        let mut unique = filter_unique(&collection, |d| d.is_positive() && d < &100);
        let mut expected = vec![38, 10, 20, 15, 1, 2, 6, 3, 5, 17];

        unique.sort_unstable();
        expected.sort_unstable();
        assert_eq!(unique, expected);
    }

    #[test]
    pub fn test_map_unique() {
        let collection = vec![
            38, 192, -256, 10, 20, 10, 15, 1, 2, 6, 2, 3, 2, 6, 5, 17, 15, -1, 10, -25,
        ];
        let mut unique = map_unique(&collection, |d| d * 2);
        let mut expected = vec![76, 384, -512, 20, 40, 30, 2, 4, 12, 6, 10, 34, -2, -50];

        unique.sort_unstable();
        expected.sort_unstable();
        assert_eq!(unique, expected);
    }
}
