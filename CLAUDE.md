# Claude Code — Project Notes

## Matsedel App

The app lives at `matsedel/` and is served at **http://192.168.1.164:8090**.

### Rebuild & Deploy

Touching `matsedel/restart.txt` triggers an **automatic no-cache rebuild and redeploy** (takes ~17 seconds):

```bash
touch matsedel/restart.txt
```

This is the standard way to deploy any change to the frontend or Dockerfile.

### Verifying changes went live

After touching `restart.txt`, check the build log to confirm the new image was built and the app is up:

```bash
# Wait ~20s, then:
curl -s http://192.168.1.164:8090   # should return 200
cat matsedel/build.log | tail -20   # should show no errors and the final container ID
```

If the build log shows `Using cache` for all steps, the rebuild didn't pick up changes — this should no longer happen since the trigger uses `--no-cache`.

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
