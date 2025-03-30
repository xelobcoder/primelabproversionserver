#!/usr/bin/bash
git add .
commit_message=${1:-"updates to codebase"}
git commit -m "$commit_message"
git push
