#!/usr/bin/env bash

set -e

sudo apt-get update
sudo apt-get install -y direnv

sh <(curl -L https://nixos.org/nix/install) --no-daemon --yes
mkdir ~/.config/nix
echo "experimental-features = nix-command flakes" >> ~/.config/nix/nix.conf

echo "export NIX_CONF_DIR=~/.config/nix" >> ~/.bashrc
echo ". ~/.nix-profile/etc/profile.d/nix.sh" >> ~/.bashrc
