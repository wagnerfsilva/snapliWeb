#!/bin/sh
# Start script for Railway deployment
PORT=${PORT:-4173}
exec npx serve -s dist -l $PORT
