# Merge duplicate changes

Judges worked in separate groups, each on its own kinds of site, so one change can appear in several groups' verdicts under different rules. One judge proposes a request wrapper for external calls; another proposes a JSON fetch helper for the same responses. Each list line gives a verdict's id, token, rule, layer, files and proposal. Read the lines; open source only to settle whether two proposals touch the same code.

Merge a row into another when carrying out the other row's proposal completes this row's proposal at its sites. Merge the row with fewer sites into the one with more. Two rows that touch the same file but change different things are not duplicates.

Write one JSON object per merge to the file the packet names:

```json
{"row": "J03-4", "into": "J01-3", "reason": "shopRequest decodes each response against a schema, which is all fetchJson adds at these three sites"}
```

`into` must be a row that is not itself merged. When nothing merges, write an empty file. You are done when the check command at the end of the packet passes.
