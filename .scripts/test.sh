#!/bin/sh

# Run Tests in the project.

docker-compose \
  -f ./docker-compose.test.yml \
  up
