web: MAX_PROCESS_COUNT_PER_REPLICA=1 LAUDSPEAKER_PROCESS_TYPE=WEB npm run start:local -w packages/server -- --debug=9229 --watch
queue: MAX_PROCESS_COUNT_PER_REPLICA=1 LAUDSPEAKER_PROCESS_TYPE=QUEUE npm run start:local:noprebuild -w packages/server -- --debug=9329 --watch
cron: MAX_PROCESS_COUNT_PER_REPLICA=1 LAUDSPEAKER_PROCESS_TYPE=CRON npm run start:local:noprebuild -w packages/server -- --debug=9429 --watch
client: npm run start:client
