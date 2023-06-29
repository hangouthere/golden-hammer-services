#!/bin/sh

npm i && \
printf "Copying node_modules to folders: %s\n" "$(find /_vols/* -maxdepth 1 -type d)" && \
chown -R 1000.1000 /app && \
find /_vols/* -print0 -maxdepth 1 -type d | xargs -I {} rm -rf "{}/*" && \
find /_vols/* -print0 -maxdepth 1 -type d | xargs -I {} cp -R /app/node_modules/* "{}/" > /dev/null
