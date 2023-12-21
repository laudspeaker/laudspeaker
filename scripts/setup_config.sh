#!/usr/bin/env bash
OUTPUT=/app/client/config.js
echo "window.appConfig={}" > $OUTPUT
if [[ -z "$API_BASE_URL" ]]; then
    echo "API_BASE_URL environment variable needs to be present."
    exit 1
fi
echo "window.appConfig.api_base_url =\"$API_BASE_URL\"" >> $OUTPUT

echo "Final config.js file"
cat $OUTPUT