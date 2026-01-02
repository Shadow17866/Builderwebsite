#!/bin/bash
export LD_LIBRARY_PATH=/nix/var/nix/profiles/default/lib:/usr/lib/x86_64-linux-gnu:$LD_LIBRARY_PATH
exec /opt/venv/bin/python application.py
