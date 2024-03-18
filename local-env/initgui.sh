#!/usr/bin/env sh
set -x
# Configure redis insights
curl redis-gui:5540/api/databases -X POST -H "Content-Type: application/json" --data '{
  "name": "Laudspeaker",
  "host": "redis",
  "port": 6379
}'