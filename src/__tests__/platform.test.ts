/**
 * Test that the transpiler is correctly configured
 *
 * Reference: https://mobx.js.org/installation.html#use-spec-compliant-transpilation-for-class-properties
 */
test('transpiler configuration for MobX', () => {
  expect(
    new (class {
      x: number = 0;
    })().hasOwnProperty('x')
  ).toBeTruthy();
});
