#!/usr/bin/env bash

set -x
arguments=("$@") # options include [environment, connectors, guis]

if [[ ${arguments[@]} =~ "guis" ]]; then
  echo "Setting up 'guis' resources."
  # Configure redis insights
  curl redis-gui:5540/api/databases -X POST -H "Content-Type: application/json" --data '{
    "name": "Laudspeaker",
    "host": "redis",
    "port": 6379
  }'
fi
