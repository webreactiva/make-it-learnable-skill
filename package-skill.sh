#!/usr/bin/env bash
# Packages the skill into make-it-learnable.zip with make-it-learnable/ at the root.
#
# Usage:  ./package-skill.sh
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SKILL_NAME="make-it-learnable"
SKILLS_DIR="$ROOT/skills"
SKILL_DIR="$SKILLS_DIR/$SKILL_NAME"
OUT="$ROOT/$SKILL_NAME.zip"

if [ ! -d "$SKILL_DIR" ]; then
  echo "Error: not found: $SKILL_DIR" >&2
  exit 1
fi

# Drop any previous zip so stale content does not pile up.
rm -f "$OUT"

# The READMEs stay at the repo root: they describe the repo, including the
# reference implementation, which is not part of the distributed skill.

# Zip from skills/ so the archive root is make-it-learnable/.
# Exclude local junk that should not ship.
( cd "$SKILLS_DIR" && zip -r -q -X "$OUT" "$SKILL_NAME" \
    -x '*/__pycache__/*' '*.pyc' '*.DS_Store' '*/work/*' )

echo "Created: $OUT"
unzip -l "$OUT" | tail -n +2 | head -n 5
