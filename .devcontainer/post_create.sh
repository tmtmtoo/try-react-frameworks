#!/usr/bin/env bash

set -e

sudo apt-get update
sudo apt-get install -y direnv
direnv allow

sh <(curl -L https://nixos.org/nix/install) --no-daemon --yes
echo ". ~/.nix-profile/etc/profile.d/nix.sh" >> ~/.bashrc

# echo "nix develop --extra-experimental-features nix-command --extra-experimental-features flakes" >> ~/.bashrc
