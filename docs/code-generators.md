# Code Generators (`scripts/crud/`)

This repo ships five **Node scaffolding scripts** that write CRUD boilerplate from a
single model name. They are plain CommonJS string-template scripts — no template
engine, no CLI framework. Run them with `node`, pass the model name with `-name`.

They are **not** wired into `package.json`. There is no `npm run generate`.

## The scripts

| Script | Writes to | Purpose |
|---|---|---|
| `scripts/crud/model-generator.js` | `src/common/models/<name>.js` | Mongoose schema stub (`is_deleted`, `created_at`, `updated_at`) |
| `scripts/crud/helper-generator.js` | `src/common/helpers/<name>.helper.js` | Data-access layer — v3 is a one-liner `new BaseHelper(Model)` |
| `scripts/crud/handler-generator.js` | `src/common/lib/<name>/<name>Handler.js` | Business-logic layer — `addNewXHandler`, `getXDetailsHandler`, `updateXDetailsHandler`, `getXListHandler`, `deleteXHandler`, `getXByQueryHandler` |
| `scripts/crud/route-generator.js` | `src/server/routes/<name>.routes.js` | Express router — `POST /list`, `POST /new`, `GET /:id`, `POST /:id/update`, `POST /:id/remove` |
| `scripts/crud/curl-generator.js` | `scripts/curl/<name>/<name>.txt` | Sample curl commands for the five routes |

## Usage

```bash
node scripts/crud/model-generator.js   -name menu
node scripts/crud/helper-generator.js  -name menu -version v3
node scripts/crud/handler-generator.js -name menu -version v3
node scripts/crud/route-generator.js   -name menu -version v3
node scripts/crud/curl-generator.js    -name menu
```

### Flags

- `-name <modelName>` — **required**. Use the lowercase singular name, e.g. `menu`,
  `order`, `user`. This string is used verbatim as the filename, the import path, the
  request-body key (`req.body.menu`), and the response key (`menuList`, `menuCount`).
- `-version v2|v3` — optional, **defaults to `v3`**. Supported by the helper, handler
  and route generators. The model and curl generators ignore it.

Argument parsing is a naive `process.argv.forEach` looking for the literal flag and
taking the next element. No validation: a missing `-name` silently writes a file
named `undefined.js`.

### Naming derivations

Given `-name menu`, the templates derive:

- `menu` — filenames, import paths, body/response keys
- `lodash.startCase(name).replace(/ /g, '')` → `Menu` — function names (`addNewMenuHandler`), class/model import identifier
- model generator only: `lodash.startCase(lodash.snakeCase(name))` → mongoose model name

## The v2 / v3 split

Every multi-version template carries a legacy `v2` (callback + `async.series`, from the
`social-media-backend` codebase this repo was scaffolded from) and a current `v3`
(async/await, `BaseHelper`, `responseStatus`/`responseData` constants).

**All code in `src/` is v3. Use v3.** The v2 templates are kept for reference but are
broken on the current stack:

- v2 helpers call `.exec((err, docs) => …)` and `Model.count()` — removed in Mongoose 8.
- The v2 helper template exports `getObjectByQuery` but never defines it.
- The v2 route template references `async`, `setResponse`, `setServerError` and
  `handleValidationXModel` without importing or defining them.
- v2 handlers wrap the helper in `.then()/.catch()`, but v2 helpers are callback-style —
  the two v2 layers don't actually compose.

## Generated layer contract (v3)

```
route  (src/server/routes/x.routes.js)     HTTP, req/res, status codes
  ↓
handler (src/common/lib/x/xHandler.js)     orchestration, returns plain data
  ↓
helper (src/common/helpers/x.helper.js)    new BaseHelper(Model)
  ↓
model  (src/common/models/x.js)            mongoose schema
```

`BaseHelper` (`src/common/helpers/baseHelper.js`) supplies every method the generated
handler calls — `addObject`, `getObjectById`, `getObjectByQuery`, `directUpdateObject`,
`deleteObjectById`, `getAllObjects`, `getAllObjectCount` — plus extras the templates
don't use (`aggregate`, `bulkWrite`, `insertMany`, `updateMany`, `updateObjectByQuery`,
`deleteManyByQuery`, `updateOneAndUpdate`). Add per-model behaviour to the handler, not
to the helper; the helper stays a one-liner.

## Gotchas

- **Files are overwritten without warning.** `fs.writeFile` with no existence check. Never
  re-run a generator over a model you have already edited.
- **Routes are not auto-mounted.** After generating, add the import and
  `app.use("/api/v1/<name>", <name>Routes)` to `src/server/index.js` by hand.
- **No auth by default.** Generated routes have no `authMiddleware` / `protectRoutes`.
  Add it per-route (see `src/server/routes/menu.routes.js` for the real pattern).
- **Multi-word names leak a space into the mongoose model name.**
  `-name menu_item` produces `mongoose.model('Menu Item', …)`. Fix by hand, or stick to
  single-word names.
- **`curl-generator.js` emits a stale hard-coded JWT** and placeholder fields inherited
  from the ancestor project. It is a starting point, not a working request. The committed
  `scripts/curl/menu/menu.txt` and `scripts/curl/order/order.txt` were written by hand and
  do **not** match the generator's output format.
- **`fs.mkdir` is non-recursive and errors are swallowed** in the handler and curl
  generators. Works only because the parent directory already exists.
- **Generated model has no real fields** — just the three audit fields. Schema design is
  yours; see `docs/database-design.md`.

## When to use these

For a new CRUD resource that follows the standard five-route shape, running all five
generators is faster than copying an existing module. For anything with custom routes,
file uploads, aggregation, or non-standard auth, generate the model/helper/handler and
write the route by hand.
