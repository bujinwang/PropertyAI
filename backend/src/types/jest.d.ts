import '@jest/globals';

declare global {
  var jest: typeof import('@jest/globals').jest;
  var expect: typeof import('@jest/globals').expect;
  var test: typeof import('@jest/globals').test;
  var it: typeof import('@jest/globals').it;
  var describe: typeof import('@jest/globals').describe;
  var beforeAll: typeof import('@jest/globals').beforeAll;
  var beforeEach: typeof import('@jest/globals').beforeEach;
  var afterAll: typeof import('@jest/globals').afterAll;
  var afterEach: typeof import('@jest/globals').afterEach;
}

export {};