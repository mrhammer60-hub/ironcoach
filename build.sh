#!/bin/bash
npx prisma@5.22.0 generate --schema=./packages/db/prisma/schema.prisma && cd packages/shared && npx tsc && cd ../../apps/web && npx next build
