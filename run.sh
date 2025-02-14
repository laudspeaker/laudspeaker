#!/bin/bash

# Start docker compose in detached mode
docker compose up -d

# Wait for 5 seconds
sleep 5

# Run migrations
npm run migrations

# Wait for 5 seconds
sleep 5

# Start the application using nf (foreman)
npx nf start
