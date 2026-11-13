# Website restore points

The owner wants website changes to be easy to undo. Save a separate local
checkpoint before each substantial change and keep this original backup.

Original state saved on 13 November 2026 (Asia/Dhaka):

`artifacts/backups/2026-11-13-before-changes.tar.gz`

Checkpoint before the green palette and homepage waves update:

`artifacts/backups/2026-11-13-before-green-waves.tar.gz`

Restore this checkpoint to undo the palette/waves update. Its contents were
also verified against the source files before any implementation edits.

Checkpoint before returning the waves to monochrome and adjusting responsive
layouts:

`artifacts/backups/2026-11-13-before-monochrome-responsive.tar.gz`

This archive includes the website source, public assets, reference files,
project configuration, lockfile, and the data present when it was created.
It was verified against the original files with `tar --compare`.

Dependencies (`node_modules`), generated Next.js output (`.next`), caches,
backups, and protected tool metadata directories are excluded. Dependencies
can be reinstalled from the saved lockfile and build output regenerated.

To request an undo, tell the assistant which change to undo, or say:
“ওয়েবসাইটটা পরিবর্তনের আগের অবস্থায় ফিরিয়ে দাও।”

Before restoring, save the current state as another checkpoint. Extract the
requested backup into a separate temporary directory, then restore the
requested source/configuration/assets. Identify and remove files introduced
by that change as needed. Preserve newer form submissions, environment
values, and unrelated edits unless the owner explicitly requests restoring
those too. Do not blindly extract an old archive over a running website.

The archive may contain private data or environment files. Keep it local.
