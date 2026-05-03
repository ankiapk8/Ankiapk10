#!/bin/bash
set -e

if [ -z "$GITHUB_TOKEN" ]; then
  echo "GITHUB_TOKEN is not set. Skipping push."
  exit 0
fi

cat > /tmp/git-askpass.sh << 'ASKPASS'
#!/bin/bash
echo "$GITHUB_TOKEN"
ASKPASS
chmod +x /tmp/git-askpass.sh

BRANCH=$(git --no-optional-locks rev-parse --abbrev-ref HEAD 2>/dev/null || echo "main")
echo "Pushing branch: $BRANCH"

GIT_ASKPASS=/tmp/git-askpass.sh GIT_TERMINAL_PROMPT=0 \
  git push https://ankiapk8@github.com/ankiapk8/Ankiapk10.git "HEAD:${BRANCH}" 2>&1

echo "Successfully pushed to GitHub: $BRANCH"
