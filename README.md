# Software Testing and Debugging

[![Playwright Tests](https://github.com/MagzhanBigabatov/Software-testing-and-debugging/actions/workflows/playwright.yml/badge.svg?branch=main)](https://github.com/MagzhanBigabatov/Software-testing-and-debugging/actions/workflows/playwright.yml)

Assignments for the *Software Testing and Debugging* course (KBTU). Each assignment is in its own folder.

| Folder | Assignment | What's inside |
| --- | --- | --- |
| [`MoneyTransfer/`](MoneyTransfer/) | Assignment 1 | Test plan and test design for a money-transfer feature (limits, SMS confirmation) |
| [`SIS2/`](SIS2/) | SIS 2: test automation | Playwright + TypeScript end-to-end suite (Page Object Model) for [practicesoftwaretesting.com](https://practicesoftwaretesting.com) |
| [`SIS3/`](SIS3/) | SIS 3: CI pipeline | The SIS 2 suite with a GitHub Actions pipeline: 4 parallel shards, merged HTML + JUnit report, artefacts, status badge. Details in [`SIS3/README.md`](SIS3/README.md#ci) |

## CI

The workflow is [`.github/workflows/playwright.yml`](.github/workflows/playwright.yml). It runs the `SIS3/` suite on every push and pull request. The badge above shows the status of `main`.
