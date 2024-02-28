# K6 Scripts

Sample run of customer_messages_test.js.

Note this requires to load the test csv file and k6 scripts onto the docker container.

```bash
$ docker run --env BASE_URL=https://perf.laudspeaker.com --env NUM_CUSTOMERS=10 --env CSV_FILEPATH=/app/data/df2_ten.csv --env "POLLING_MINUTES=0.5" --rm -i -v ~/Documents/Laudspeaker/perf\ data/:/app/data/ -v ~/Documents/Laudspeaker/laudspeaker/packages/tests/k6:/app/ grafana/k6 run --quiet /app/customer_messages_test.js
```
