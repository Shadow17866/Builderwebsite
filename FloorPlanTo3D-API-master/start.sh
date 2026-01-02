#!/bin/bash
export LD_LIBRARY_PATH=/nix/var/nix/profiles/default/lib
exec /opt/venv/bin/python application.py
