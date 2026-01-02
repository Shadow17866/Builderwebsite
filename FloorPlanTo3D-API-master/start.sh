#!/bin/bash
export LD_LIBRARY_PATH=/nix/var/nix/profiles/default/lib
exec /opt/venv/bin/gunicorn --bind 0.0.0.0:8080 --workers 1 --timeout 300 application:application
