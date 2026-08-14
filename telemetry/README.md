# Telemetry

ZebOS's performance-testing and instrumentation framework. It's a small
JS API any module or app can call to record timings and metrics, plus a
devtools-only viewer window to see what's been recorded. It has no
desktop icon or Start Menu entry, reachable only by typing `telemetry`
(or `perfmon`, `perf`) into Run, same as `/devtools/sysflags.js`.

## Using it from code

```js
import { Telemetry } from '../telemetry/index.js';

Telemetry.mark('boot-start');
// ... do the thing ...
Telemetry.measure('boot-time', 'boot-start'); // duration since 'boot-start', in ms

Telemetry.record('open-windows', windows.length); // any one-off numeric metric
```

- `mark(name)` -- remembers `performance.now()` under `name`.
- `measure(name, startMark, endMark?)` -- logs the duration from `startMark`
  to `endMark` (or to now, if omitted).
- `record(name, value, meta?)` -- logs an arbitrary numeric metric, not
  necessarily a duration.
- `getMarks()` / `getMeasures()` / `getFpsSamples()` / `getMemSamples()` --
  read back everything recorded this session.
- `exportJSON()` / `downloadExport()` -- snapshot the session as JSON.
- `clear()` -- wipe everything.
- `subscribe(fn)` -- get called whenever new data lands; returns an
  unsubscribe function.

FPS (via `requestAnimationFrame`) and JS heap memory (via
`performance.memory`, where the browser exposes it) are sampled
automatically once a second for the life of the OS session, no setup
required, they start the moment anything imports the framework.

## The viewer

Open it by typing `telemetry` into Run. Two tabs:

- **Live** — FPS and memory sparklines, styled like Task Manager's
  Performance tab (`programs/taskmgr.js`).
- **Log** — every mark/measure/record this session, newest first, with
  buttons to export the session as JSON or clear the log.
