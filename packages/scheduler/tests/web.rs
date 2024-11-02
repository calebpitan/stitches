//! Test suite for the Web and headless browsers.

#![cfg(target_arch = "wasm32")]

extern crate wasm_bindgen_test;
use wasm_bindgen_test::*;

wasm_bindgen_test_configure!(run_in_browser);

#[wasm_bindgen_test]
fn pass() {
    assert_eq!(1 + 1, 2);
}


// &.collapsed {
//     & .s-subtask-listitem {
//       margin-block-end: 0;

//       &:nth-last-child(1) {
//         --color: var(--p-green-300);
//         --color: var(--p-slate-200);
//       }

//       &:nth-last-child(2) {
//         --color: var(--p-red-300);
//         --color: var(--p-slate-400);
//       }

//       &:nth-last-child(n + 2) {
//         /* max-height: 1rem; */
//         overflow: hidden;
//       }

//       &:nth-last-child(n + 3) {
//         --color: var(--p-amber-300);
//         --color: var(--p-slate-600);
//       }

//       --deviation: calc(var(--s-index) - var(--mid));
//       --factor: max(var(--deviation), 0);

//       transform: translate3d(
//           0,
//           calc(1rem * var(--factor) - 100% * var(--s-index)),
//           /* calc((-100% * var(--s-index)) + 1rem * var(--s-index)), */ calc(-1px * var(--n-index))
//         )
//         scale(calc(1 - (0.05 * var(--n-index))));

//       & .s-subtask-element {
//         background-color: rgba(
//           from var(--s-surface-ground) r g b / calc(var(--s-index) / var(--size))
//         ); /* rgb(from var(--color) r g b / calc(0.5 - (var(--n-index) / 10)));*/
//         backdrop-filter: blur(15px);
//         /* filter: saturate(calc(10% * var(--s-index) + 30%)); */
//       }
//     }
//   }