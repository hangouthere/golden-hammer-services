#!/bin/sh

npm i && \
chown -R 1000.1000 /app && \
printf "Copying node_modules to folders:\n%s\n" "$(find /_vols/* -maxdepth 0 -type d)" && \
find /_vols/* -print0 -mindepth 1 -maxdepth 1 -type d | xargs -0 -I {} rm -rf "{}" && \
find /_vols/* -print0 -maxdepth 0 -type d | xargs -0 -I {} cp -pR /app/node_modules/. "{}/" > /dev/null
