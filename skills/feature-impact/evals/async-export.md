# Async export source bundle

This is a small source fixture. Paths identify separate files in the application. Only the shown behavior is available; do not infer other handlers.

The application used to return a completed export from POST /exports. It now queues generation and returns a job. The change applies to personal and team workspaces. Artifacts expire after the chosen retention period. Product intentionally allows lower retention on the economy plan. The export worker and job polling API already implement that design.

## api/exports.py

```python
def create_export(workspace, rows):
    job = queue.submit(workspace.id, rows)
    return Response(202, {"id": job.id, "state": "queued"})

def get_export(job_id):
    job = jobs.get(job_id)
    return {"id": job.id, "state": job.state, "download_url": job.url}

def list_exports(workspace):
    return jobs.list_for_workspace(workspace.id)
```

## web/export-dialog.ts

```typescript
async function startExport(rows) {
  const response = await api.post('/exports', { rows });
  const job = response.data;
  await pollUntil(job.id, current => current.state === 'complete');
  openDownload((await api.get('/exports/' + job.id)).data.download_url);
}
```

## web/export-history.ts

```typescript
async function loadHistory(workspace) {
  return api.get('/exports', { workspace });
}
function activateHistoryRow(row) {
  if (row.download_url) openDownload(row.download_url);
}
```

## integrations/scheduled-report.py

```python
def send_scheduled_report(workspace, recipients):
    result = exports.create_export(workspace, scheduled_rows(workspace))
    mail.send(recipients, "Your report is ready", result.body.get("download_url", ""))
```

## web/export-batch.ts

```typescript
async function downloadAll(rows) {
  for (const row of rows) {
    const response = await api.post('/exports', { rows: [row] });
    location.assign(response.data.download_url);
  }
}
```

## analytics/exports.py

```python
def export_count(workspace):
    return jobs.count_for_workspace(workspace.id)
```

## web/export-cancellation.ts

```typescript
async function cancelExport(jobId) {
  table.remove(jobId);
  try {
    await api.delete('/exports/' + jobId);
  } catch {
    table.replace(await api.listExports());
  }
}
setInterval(async () => table.replace(await api.listExports()), 1000);
```

The delete API removes the job from the persistent list when cancellation completes. Until then, list requests still return it.

## web/workspace-card.ts

```typescript
function exportLabel(count) {
  return count + ' downloads ready';
}
```

## benchmarks/export.py

```python
def measure_export_latency(workspace, rows):
    start = clock()
    response = post("/exports", workspace=workspace, rows=rows)
    assert response.status in (200, 202)
    return clock() - start  # CSV column: complete_export_seconds
```

## settings/retention.py

```python
def retention_hours(plan):
    return 1 if plan == "economy" else 24
```

## web/saved-downloads.ts

```typescript
function saveDownload(row) {
  localStorage.setItem('last-download', row.download_url);
}
function reopenDownload() {
  location.assign(localStorage.getItem('last-download'));
}
```

## admin/retry-button.binding

```text
component: RetryExportButton
action: dynamic-plugin:retryLastExport
```

The dynamic plugin's source is unavailable in this fixture.

## docs/reporting.md

POST /exports responds after generation has finished. A successful response means the download can be sent to another person immediately.
