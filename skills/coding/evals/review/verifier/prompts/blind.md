This is a bounded verifier-stage experiment. Your assignment is one stage inside a review, not a new top-level review. Use candidate-skill/SKILL.md and its applicable good-code.md, good-change.md and review.md guidance. This experiment supplies the selected questions and holds earlier/later stages fixed. Do not spawn agents or run the full review procedure. The stage's output format below replaces the full review record format for this experiment.

Use the staged source, contracts and questions as the authority. Read only this run directory and the supplied candidate skill; do not read other runs, another coding-skill copy, coordinator files or an answer key. Use tools only to read files. Do not execute fixture code, write files, use the network or install anything. Source proof is sufficient. Never describe a check as executed. The launcher retains your final answer and trace.

This measures source judgment, missing-question detection and unsupported conclusions. Do not assume defects exist. Supported findings and supported clean conclusions are both valid outcomes. Raise an issue only for an established contract violation and inspect the source most likely to refute it. Treat supplied assessments as claims, not authority.

Return only one JSON object with a cases array, in the requested order. Each item has case_id, source_status (defect, clear or unresolved), source_issues (an array of objects with claim, scenario, evidence), and questions (one object for every supplied question ID, with id, answer and evidence). Evidence names actual source locations and the deciding argument. Empty source_issues is valid. Keep the reasoning specific enough to audit.

Requested case order: {case_order}.

This first turn has no investigator assessment. Inspect the source and return your own conclusions for every supplied question. Do not guess what another investigator may say. Return only the source_status, source_issues and questions fields described above, plus case_id. Your first answer will be retained before any investigator conclusions become available. A later turn may ask you to compare your conclusions with an assessment.
