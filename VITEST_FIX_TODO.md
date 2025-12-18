# Vitest Configuration Issue - v0.4 TODO

## Problem
Vitest v4.0.16 cannot find test suites in TypeScript files. Error:
```
Error: No test suite found in file src/analyzer/project-analyzer.test.ts
```

## Investigation
1. Test files have correct `describe()` and `it()` calls
2. Import statements are fixed (removed `.js` extensions)
3. Vitest configuration is set up correctly
4. TypeScript compilation works (`npm run build` passes)
5. Type checking works (`npm run type-check` passes)

## Root Cause
Vitest is failing to load/transpile the TypeScript test files before parsing them for test suites. This appears to be a module resolution or transpilation configuration issue.

## Attempted Fixes
- ✓ Removed `.js` extensions from test imports
- ✓ Added `tsx` dev dependency
- ✓ Updated `vitest.config.ts` with proper includes/excludes
- ✗ Changed `tsconfig.json` moduleResolution (reverted)
- ✗ Added separate `tsconfig.test.json`
- ✗ Configured vitest pools

## Next Steps for v0.4
1. Try upgrading vitest to latest (currently v4.0.16)
2. Try using `vitest --no-ts` or explicit TypeScript loader
3. Consider migrating to Jest temporarily
4. Check Vitest GitHub issues for similar ESM+TypeScript problems
5. Possibly add `tsx` as CLI option: `NODE_LOADER=tsx vitest`

## Files Modified
- `vitest.config.ts` - updated config
- `src/**/*.test.ts` - fixed import statements
- `package.json` - added `test:watch` command

## Impact
- ✓ Build still works
- ✓ Type checking still works
- ✓ npm publishing still works
- ✗ Tests cannot be run locally (but not blocking development)

## Workaround
For now, continue development and defer full test suite execution to v0.4 maintenance release.
