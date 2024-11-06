pub trait Comparator<T> {
    fn compare(&self, a: &T, b: &T) -> bool;
}

pub trait ID {
    fn get_id(&self) -> String;
}
