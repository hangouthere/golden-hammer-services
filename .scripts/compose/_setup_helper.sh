#!/bin/sh

npm i && \
printf "Copying node_modules to folders: %s\n" "$(find /_vols/* -maxdepth 1 -type d)" && \
find /_vols/* -print0 -maxdepth 1 -type d | xargs -I {} rm -rf "{}/*" && \
find /_vols/* -print0 -maxdepth 1 -type d | xargs -I {} cp -R /app/node_modules/* "{}/" > /dev/null && \
chown -R 1000.1000 /_vols/ /app
