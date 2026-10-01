# Goal

Read before discussing or changing this skill.

## Why

Avatar creators export VRM files from Blender, VRoid, or Unity without knowing what MEs loads. A file can carry data MEs never uses, cost far more memory than it looks, or fail to load for a reason the creator cannot see. This skill tells the creator what is in the file, what MEs does with it, and what to change.

## Values

- **Read-only unless asked.** A check never changes the user's file. Writing needs an explicit request, and even then the original stays.
- **Never break the avatar.** A smaller file that lost its VRM data is worse than no change. Edits keep every VRM object, and the script proves it before writing.
- **Every change names its risk.** No-risk changes are always recommended. Visual and portability changes are the user's call, made with measured numbers and the platforms that would break.
- **Plain words for creators.** The reader may not know glTF. Each problem says what it costs them and what fixes it.
- **MEs facts come from MEs code.** Support claims trace to the importer source, and the reference records the changeset they were read from.
- **Nothing to install but Node.** Codecs and the validator ship with the skill, so the user never installs global tools. If Node is missing, the skill asks first.

## Boundary

The skill checks and re-encodes existing data. It does not remodel meshes, retarget bones, author blendshapes, or change the MEs importer. Those go back to the creator's tools or to MEs development.
