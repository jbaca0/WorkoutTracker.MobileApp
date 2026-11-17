# WorkoutTracker.MobileApp

React Native (Expo 54) iOS app for logging workouts at the gym, backed by the
[WorkoutTracker.Server](https://github.com/jbaca0/WorkoutTracker.Server) .NET 9 API. This is
the primary client; the earlier React/Capacitor web client is retired.

Expo Router for navigation, Hermes, React Compiler and the New Architecture enabled.

## Features

- **Live workout logging.** Start empty or from a template, then add exercises and sets as you
  go. Edits autosave to the server on a three-second debounce, and the active workout's id and
  start time are kept in device storage, so closing the app mid-session loses nothing — a resume
  banner offers the workout back on relaunch.
- **Rest timer** with haptics and an audible cue, driven by `useRestTimer` and kept running
  while you move between screens.
- **Templates.** Reusable exercise-and-set skeletons, edited in-app, that seed a new workout
  with its target weights and reps.
- **Plans.** Weekly routines that assign a template, or just a note, to each day of the week.
- **Exercise library** filtered by muscle group, with per-user exercise metadata and goals that
  carry targets forward from previous sessions.
- **History.** Calendar view of past workouts plus a read-only detail screen for each.

## Architecture

File-based routing lives in `app/`; everything reusable lives in `src/`.

| Path | Responsibility |
| --- | --- |
| `app/index.tsx` | Auth gate — redirects to login or the tabs based on stored tokens |
| `app/(tabs)/` | `home`, `exercises`, `plans`, `history` |
| `app/workout/[workoutId].tsx` | Active workout screen |
| `app/workout-history/[workoutId].tsx` | Read-only past workout |
| `app/template/[templateId].tsx`, `app/plan/[planId].tsx` | Template and plan editors |
| `src/Services/` | API access, each service extending `BaseService` |
| `src/Domain/` | Domain models with `FromData` / `ToData` conversions |
| `src/DataTransferObjects/` | Wire contracts mirroring the server's `Common` / `Requests` / `Responses` |
| `src/Hooks/` | `useAuth`, `useActiveWorkout`, `useRestTimer`, `useNotification`, `useAsyncStorage`, `useDebounce` |
| `src/Components/` | Shared UI — modals, exercise rows, rest timer, resume banner |
| `src/Theme/colors.ts` | Dark-theme color tokens |

### Auth and token handling

Access and refresh tokens are persisted in `expo-secure-store` with an in-memory cache so reads
are synchronous during a session (`src/Utils/tokenStorage.ts`).

`BaseService` attaches the access token to every request. On a `401` it refreshes once and
retries the original call; concurrent requests share a single in-flight refresh promise, so one
expired token cannot fire a stampede of refreshes. If the refresh itself fails, tokens are
cleared and `sessionManager` notifies the app, which returns the user to the login screen.

## Running locally

```bash
npm install
cp .env.example .env.local
npx expo start --ios
```

Point the app at a server with `EXPO_PUBLIC_SERVER_URL`:

| Variable | Purpose |
| --- | --- |
| `EXPO_PUBLIC_SERVER_URL` | API base URL. Defaults to `http://localhost:5231` if unset. |
| `EXPO_PUBLIC_DEV_EMAIL` / `EXPO_PUBLIC_DEV_PASSWORD` | Optional. Enables the login screen's "Use dev account" button, and only read when `__DEV__` is true. Pair with the server's `DevSeed` user. |

`.env` is tracked and points at the deployed server; `.env.development` points at localhost.
Machine-local overrides and anything resembling a credential belong in `.env.local`, which is
gitignored.

## Device builds

```bash
npx expo run:ios --device --configuration Release
```

Needs a paired iPhone and an Apple development team for signing. Expo rewrites
`DEVELOPMENT_TEAM` into the `.pbxproj` after each build, which can stop it from regenerating an
expired provisioning profile — stripping that line before a build keeps signing self-healing.

## Tests

```bash
npm test
```

236 Jest tests across 33 files (`jest-expo` + React Native Testing Library) covering services,
domain models, hooks, utilities, components, and a smoke test that mounts each screen. Coverage
reports via `npx jest --coverage`.
