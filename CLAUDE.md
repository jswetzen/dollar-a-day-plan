# Claude Code — Project Notes

## Matsedel App

The app lives at `matsedel/` and is served at **http://192.168.1.164:8090**.

### Rebuild & Deploy

Writing new content to `matsedel/restart.txt` triggers an **automatic no-cache rebuild and redeploy** (takes ~40 seconds). Use `date` to ensure the content actually changes:

```bash
date > matsedel/restart.txt
```

`touch` alone does **not** work — the watcher checks file content, not mtime.

This is the standard way to deploy any change to the frontend or Dockerfile.

### Verifying changes went live

After touching `restart.txt`, check the build log to confirm the new image was built and the app is up:

```bash
# Wait ~40s, then:
curl -s http://192.168.1.164:8090   # should return 200
tail -20 matsedel/build.log         # should show "Successfully tagged" and the final container ID
```

### Lidl CSV Import

- Source data: `matsedel/lidl_items.csv` (6,907 rows, semicolon-delimited, UTF-8 BOM)
- Parse script: `matsedel/scripts/parse-lidl.js` — run manually or auto-run at build time
- Output: `matsedel/frontend/src/lidlData.js` (generated, 1,275 unique items)

The parse script auto-detects Docker vs local by checking if `../src` exists relative to the script:
- **Docker** (`COPY frontend/ ./` flattens to `/build/src/`): writes to `/build/src/lidlData.js`
- **Local** (script at `matsedel/scripts/`): writes to `matsedel/frontend/src/lidlData.js`

To regenerate locally:
```bash
cd matsedel && node scripts/parse-lidl.js
```
