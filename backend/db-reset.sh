#!/usr/bin/env bash
rm -rf drizzle
docker compose rm chat-notif-postgres
sudo rm -rf ./postgres-data
docker compose up -d
bun drizzle-kit generate && bun drizzle-kit migrate