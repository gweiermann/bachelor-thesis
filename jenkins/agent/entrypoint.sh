#!/bin/bash
dockerd &
exec "$@"