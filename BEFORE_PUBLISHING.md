# Before publishing

Use this checklist when preparing the workspace for public release.

1. Choose which skills are public. Exclude private material and decide whether `references/` belongs in the release.
2. Choose the repository owner, name, visibility, and license.
3. Check the current official Codex and Claude Code plugin documentation. Do not rely on old manifest examples.
4. Remove private and historical variants from the published tree. An `_` prefix only hides them from this workspace's scripts; external installers may still discover them. Keep the public skills in `skills/` without making a second maintained copy.
5. Choose the distribution channels. Plain `npx skills` distribution needs a hosted Git repository, not plugin metadata. Add `.codex-plugin/plugin.json` or Claude plugin metadata only when publishing through those plugin systems. Add marketplace files only for marketplace distribution.
6. Use the default branch for rolling skill updates. `npx skills update` tracks skill-folder content hashes, not versions in `SKILL.md`. Use Git tags for pinned installs and rollback. Version plugin manifests separately.
7. Update `README.md` with project and global installation commands, update commands, rolling-versus-pinned behavior, and the public skill names.
8. Run `scripts/check-skills.sh` and `npx skills add . --list`; both must expose exactly the intended public skills. Test a clean install and invocation in the current Codex and Claude Code tools. After the first release, test updating from the previous release.
9. Initialize Git and publish the remote only after excluded material is gone. Add automation and release notes when useful.
