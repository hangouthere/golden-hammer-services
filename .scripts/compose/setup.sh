#!/bin/sh

# shellcheck disable=SC3043

PROFILE="--profile standard"
PROFILE_LINKED="--profile registry --profile linked"

WARN=$(tput setaf 3)
RESET=$(tput sgr0)

installDeps() {
  rm -rf node_modules package-lock.json
  mkdir -p node_modules

  eval docker compose \
    "${PROFILE}" \
    -f ./docker-compose.setup.yml \
    up -d

  docker exec -it setup sh -c "npm i"

  eval docker compose \
    "${PROFILE}" \
    -f ./docker-compose.setup.yml \
    down
}

upgradeDeps() {
  eval docker compose \
    "${PROFILE}" \
    -f ./docker-compose.setup.yml \
    up -d

  docker exec -it setup sh -c "npx -y npm-upgrade && npm i"

  eval docker compose \
    "${PROFILE}" \
    -f ./docker-compose.setup.yml \
    down
}

showHelp() {
  figlet -f small -w "$(tput cols)" "hh-util Setup Script"
  printf "\nOptions:\n\t-l: Linked development includes a local npm registry and sets up compose with appropriate volumes\n\t-f: Force Installing depdencies %s(This will also delete node_modules and package-lock.json)%s\n\n\n\n" "${WARN}" "${RESET}"
}

start() {
  local alreadyInstalled
  local msg
  local forceInstall
  alreadyInstalled=$([ -e node_modules/.package-lock.json ] && echo "1" || echo "")

  while getopts "flh" arg; do
    case $arg in
      l)
        PROFILE="$PROFILE_LINKED"
        msg="${msg}\nLinking Local Registry"
        ;;
      f)
        msg="${msg}\nForce Install Activated"
        forceInstall=1
        ;;
      *)
        showHelp
        exit 0
        ;;
    esac
  done

  if [ -z "$forceInstall" ]; then
    if [ -n "$alreadyInstalled" ]; then
      msg="${msg}\nUpdating Existing Dependencies"
    else
      msg="${msg}\nClean Install Activated"
      forceInstall=1
    fi
  fi

  printf "\n%s------------------------------------------${msg}\n------------------------------------------\n\n%s" "${WARN}" "${RESET}"

  if [ -n "$forceInstall" ]; then
    installDeps
  else
    upgradeDeps
  fi
}

start "$@"
