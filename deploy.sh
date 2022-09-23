#!/bin/bash

set -e
export HUGO_SHORT_COMMIT=`git rev-parse --short HEAD`

if [ "`git status -s`" ]
then
        echo "The working directory is dirty. Please commit any pending changes."
            exit 1;
fi

echo "Deleting old publication"
rm -rf public
mkdir public
git worktree prune
rm -rf .git/worktrees/public/

echo "Checking out gh-pages branch into public"
git worktree add -B prod public origin/prod

echo "Removing existing files"
rm -rf public/*

echo "Generating site"
hugo --minify

echo "Updating prod pages branch"
cd public
echo "blog.jackgreenberg.co" > CNAME

git add --all && git commit -m "Deploy changes"

#echo "Pushing to github"
printf "\033[0;32mDeploying updates to GitHub...\033[0m\n"
git push origin prod

cd ..
