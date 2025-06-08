#!/bin/bash

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPT_DIR/_helpers.sh"
source "$SCRIPT_DIR/_config.sh"

install_eza() {
  if [[ -f $HOME/.cargo/bin/eza ]]; then
    print_info "Eza is already installed ..."
  else
    print_info "Installing Eza ..."

    # shellcheck source=/dev/null
    source "$HOME/.cargo/env" || handle_error "Failed to source Cargo environment"

    cargo install eza >/dev/null 2>&1 || handle_error "Failed to install Eza"

    print_success "Eza installed successfully."
  fi
}

install_eza
