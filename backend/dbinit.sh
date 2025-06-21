#!/bin/sh
set -e

python create_tables.py --force
python populate.py --force