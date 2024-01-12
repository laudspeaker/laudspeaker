#!/usr/bin/env bash
OUTPUT=/app/client/config.js
echo "window.appConfig={}" >$OUTPUT
if [[ -z "$API_BASE_URL" ]]; then
    echo "API_BASE_URL environment variable needs to be present."
    exit 1
fi
echo "window.appConfig.api_base_url =\"$API_BASE_URL\"" >>$OUTPUT

if [[ -z "$POSTHOG_KEY" ]]; then
    echo "POSTHOG_KEY environment variable not set, anayltics will not be collected."
fi
echo "window.appConfig.posthog_key =\"$POSTHOG_KEY\"" >>$OUTPUT

if [[ -z "$POSTHOG_HOST" ]]; then
    echo "POSTHOG_HOST environment variable is not set, defaulting to app.posthog.com."
fi
echo "window.appConfig.posthog_host =\"$POSTHOG_HOST\"" >>$OUTPUT

if [[ -z "$WS_BASE_URL" ]]; then
    echo "WS_BASE_URL environment variable is not set, websocket features are disabled."
fi
echo "window.appConfig.ws_base_url =\"$WS_BASE_URL\"" >>$OUTPUT

if [[ -z "$JOURNEY_ONBOARDING" ]]; then
    echo "JOURNEY_ONBOARDING environment variable is not set, app onboarding is disabled."
fi
echo "window.appConfig.journey_onboarding =\"$JOURNEY_ONBOARDING\"" >>$OUTPUT

if [[ -z "$ONBOARDING_API_KEY" ]]; then
    echo "ONBOARDING_API_KEY environment variable is not set, app onboarding will not function."
fi
echo "window.appConfig.onboarding_api_key =\"$ONBOARDING_API_KEY\"" >>$OUTPUT

if [[ ! -z "$SENTRY_DSN_URL_FRONTEND" ]]; then
    echo "SENTRY_DSN_URL variable is set, overriding default SENTRY_DSN_URL from build."
    echo "window.appConfig.sentry_dsn_url_frontend=\"$SENTRY_DSN_URL_FRONTEND\"" >>$OUTPUT
fi

if [[ ! -z "$SENTRY_ENVIRONMENT_TAG" ]]; then
    echo "window.appConfig.sentry_environment_tag=\"$SENTRY_ENVIRONMENT_TAG\"" >>$OUTPUT
fi

echo "Final config.js file"
cat $OUTPUT
