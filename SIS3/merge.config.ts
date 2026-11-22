// Used only by `npx playwright merge-reports --config merge.config.ts <blob-dir>`
// to turn the blob reports of all CI shards into one HTML report and one JUnit file.
export default {
  testDir: './tests',
  reporter: [
    ['html', { outputFolder: 'playwright-report', open: 'never' }],
    ['junit', { outputFile: 'reports/junit-merged.xml' }],
  ],
};
