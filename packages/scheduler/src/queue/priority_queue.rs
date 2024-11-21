use std::{collections::HashMap, marker::PhantomData};

use crate::traits::{Comparator, ID};

pub struct PQComparator<F, T>
where
    F: Fn(&T, &T) -> bool,
{
    pub func: F,
    _marker: PhantomData<T>,
}

impl<F, T> Comparator<T> for PQComparator<F, T>
where
    F: Fn(&T, &T) -> bool,
{
    fn compare(&self, a: &T, b: &T) -> bool {
        (self.func)(a, b)
    }
}

impl<F, T> PQComparator<F, T>
where
    F: Fn(&T, &T) -> bool,
{
    pub fn new(comparator: F) -> Self {
        PQComparator {
            func: comparator,
            _marker: PhantomData,
        }
    }
}

pub struct PriorityQueue<T>
where
    T: Ord + ID,
{
    heap: Vec<T>,
    tracker: HashMap<String, usize>,
    comparator: Box<dyn Comparator<T>>,
}

impl<T> PriorityQueue<T>
where
    T: Ord + ID,
{
    pub fn new(comparator: Box<dyn Comparator<T>>) -> PriorityQueue<T> {
        PriorityQueue {
            heap: vec![],
            tracker: HashMap::new(),
            comparator,
        }
    }

    pub fn size(&self) -> usize {
        self.heap.len()
    }

    pub fn is_empty(&self) -> bool {
        self.heap.is_empty()
    }

    pub fn peek(&self) -> Option<&T> {
        if let Some(v) = self.heap.first() {
            return Some(v);
        }

        None
    }

    pub fn find(&self, id: String) -> Option<&T> {
        let index = self.tracker.get(&id);

        if let Some(index) = index {
            self.heap.get(*index)
        } else {
            None
        }
    }

    pub fn remove(&mut self, id: String) -> Option<T> {
        let index = self.tracker.remove(&id);

        match index {
            Some(index) => {
                let result = Some(self.heap.remove(index));

                if index > 0 {
                    let idx = index;
                    self.siftup(idx);
                    self.siftdown(idx, None);
                }

                return result;
            }
            None => None,
        }
    }

    pub fn enqueue(&mut self, value: T) {
        let id = value.get_id();
        self.heap.push(value);

        self.tracker.insert(id, self.size() - 1);

        self.siftup(self.size() - 1);
    }

    pub fn dequeue(&mut self) -> Option<T> {
        if self.is_empty() {
            return None;
        } else if self.size() == 1 {
            let value = self.heap.remove(0);

            self.tracker.remove(&value.get_id());

            return Some(value);
        }

        // remove the first element and swap the last element for it
        let root = self.heap.swap_remove(0);
        // stop tracking the removed element
        self.tracker.remove(&root.get_id());
        // update the tracker with the new postion of the formerly last element
        self.tracker.insert(self.peek().unwrap().get_id(), 0);

        self.siftdown(0, None);

        Some(root)
    }

    fn siftup(&mut self, from: usize) {
        let comparator = &self.comparator;
        let mut node = from;
        let mut parent = (node.saturating_sub(1)) >> 1;

        while node > 0 && comparator.compare(&self.heap[node], &self.heap[parent]) {
            self.heap.swap(node, parent);

            // update the swapped nodes in the tracker
            self.tracker.insert(self.heap[node].get_id(), node);
            self.tracker.insert(self.heap[parent].get_id(), parent);

            node = parent;
            parent = (node.saturating_sub(1)) >> 1;
        }
    }

    fn siftdown(&mut self, from: usize, to: Option<usize>) {
        let comparator = &self.comparator;
        let mut node = from;
        let mut parent = node;
        let mut left = (parent << 1) + 1;
        let mut right = left + 1;

        let end = match to {
            Some(x) => x,
            None => self.size() - 1,
        };

        while left <= end {
            if comparator.compare(&self.heap[left], &self.heap[parent]) {
                parent = left;
            }

            if right <= end && comparator.compare(&self.heap[right], &self.heap[parent]) {
                parent = right
            }

            if parent == node {
                return;
            }

            self.heap.swap(node, parent);

            // update the swapped nodes in the tracker
            self.tracker.insert(self.heap[node].get_id(), node);
            self.tracker.insert(self.heap[parent].get_id(), parent);

            node = parent;
            left = (node << 1) + 1;
            right = left + 1;
        }
    }
}

#[cfg(test)]
mod test {
    use super::*;
    use wasm_bindgen_test::*;

    wasm_bindgen_test_configure!(run_in_browser);

    // make sure to add unique numbers to the queue since the number is used as ID
    impl ID for i32 {
        fn get_id(&self) -> String {
            return self.to_string();
        }
    }

    pub fn make_pq() -> PriorityQueue<i32> {
        PriorityQueue::new(Box::new(PQComparator::new(|a, b| a < b)))
    }

    pub fn populate_pq(pq: &mut PriorityQueue<i32>) {
        pq.enqueue(32);
        pq.enqueue(12);
        pq.enqueue(27);
        pq.enqueue(47);
        pq.enqueue(15);
    }

    #[test]
    #[wasm_bindgen_test]
    // test that the priority queue can be initialized successfully
    pub fn smoke_test_initialize_priority_queue() {
        let pq = make_pq();

        assert!(pq.is_empty())
    }

    #[test]
    #[wasm_bindgen_test]
    // should add items to the heap and distribute them optimally for O(1) retrievals
    // and O(log(n)) redistribution
    pub fn test_enqueue() {
        let mut pq = make_pq();

        populate_pq(&mut pq);

        assert_eq!(pq.is_empty(), false)
    }

    #[test]
    #[wasm_bindgen_test]
    // should scan the top of the queue immutably and return the item at the top of the queue in O(1) time
    // the item at the top of the queue is the smallest in the entire queue for a min-heap queue.
    pub fn test_peek() {
        let mut pq = make_pq();

        populate_pq(&mut pq);

        assert_eq!(pq.size(), 5);

        // #peek should return the element at the top of the queue
        // which is expected to be the smallest for a min-heap queue
        assert_eq!(pq.peek(), Some(&12));

        // #peek should not mutate the queue and the size must remain the same afterwards
        assert_eq!(pq.size(), 5);
    }

    #[test]
    #[wasm_bindgen_test]
    // should remove an item from the queue from smallest to greatest for a min-heap queue
    // and the reverse case for max-heap queue
    pub fn test_dequeue() {
        let mut pq = make_pq();

        populate_pq(&mut pq);

        assert_eq!(pq.size(), 5);

        // #dequeue should always remove and return the element at the top of the queue
        // which is expected to be the smallest for a min-heap queue.
        assert_eq!(pq.dequeue(), Some(12));
        assert_eq!(pq.dequeue(), Some(15));
        assert_eq!(pq.dequeue(), Some(27));
        assert_eq!(pq.dequeue(), Some(32));
        assert_eq!(pq.dequeue(), Some(47));

        // #dequeue should mutate the queue and the size must reduce by `i` for every `i` dequeues
        assert_eq!(pq.size(), 0);
    }

    #[test]
    #[wasm_bindgen_test]
    // should find an item in the queue by its ID in O(1) time
    pub fn test_find() {
        let mut pq = make_pq();

        populate_pq(&mut pq);

        assert_eq!(pq.size(), 5);

        // #find should find the element given by the ID in O(1) time
        assert_eq!(pq.find("27".to_owned()), Some(&27));
        assert_eq!(pq.find("15".to_owned()), Some(&15));

        // #find should not mutate the queue and size must remain the same afterwards
        assert_eq!(pq.size(), 5);
    }

    #[test]
    #[wasm_bindgen_test]
    // should remove an item from the queue by its ID in O(1) time
    pub fn test_remove() {
        let mut pq = make_pq();

        populate_pq(&mut pq);

        // size should be 5
        assert_eq!(pq.size(), 5);

        assert_eq!(pq.remove("27".to_owned()), Some(27));
        assert_eq!(pq.remove("15".to_owned()), Some(15));

        // size should have changed to 3
        assert_eq!(pq.size(), 3);

        // #remove shouldn't affect how the priority queue works
        assert_eq!(pq.dequeue(), Some(12));
        assert_eq!(pq.dequeue(), Some(32));
        assert_eq!(pq.dequeue(), Some(47));

        assert_eq!(pq.tracker.is_empty(), true);
    }
}
