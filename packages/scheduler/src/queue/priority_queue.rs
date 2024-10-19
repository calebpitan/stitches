pub trait Comparator<T> {
    fn compare(&self, a: &T, b: &T) -> bool;
}

pub struct PriorityQueue<T>
where
    T: Ord,
{
    heap: Vec<T>,
    comparator: Box<dyn Comparator<T>>,
}

impl<T> PriorityQueue<T>
where
    T: Ord,
{
    pub fn new(comparator: Box<dyn Comparator<T>>) -> PriorityQueue<T> {
        PriorityQueue {
            heap: vec![],
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

    pub fn enqueue(&mut self, value: T) {
        self.heap.push(value);
        self.siftup((self.size() - 1) as i32);
    }

    pub fn dequeue(&mut self) -> Option<T> {
        if self.is_empty() {
            return None;
        } else if self.heap.len() == 1 {
            let data = self.heap.remove(0);
            return Some(data);
        }

        let root = self.heap.swap_remove(0);
        self.siftdown(0, None);
        Some(root)
    }

    fn siftup(&mut self, from: i32) {
        let comparator = &self.comparator;
        let mut node = from as usize;
        let mut parent = (node - 1) >> 1;

        while node > 0 && comparator.compare(&self.heap[node], &self.heap[parent]) {
            self.heap.swap(node, parent);
            node = parent;
            parent = (node - 1) >> 1;
        }
    }

    fn siftdown(&mut self, from: i32, to: Option<i32>) {
        let comparator = &self.comparator;
        let mut node = from as usize;
        let mut parent = node;
        let mut left = (parent << 1) + 1;
        let mut right = left + 1;

        let end = match to {
            Some(x) => x as usize,
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
            node = parent;
            left = (node << 1) + 1;
            right = left + 1;
        }
    }
}
