package storage

import (
	"fmt"
	"os"
	"path/filepath"
)

// DataDir returns the XDG-compliant data directory for tdo.
// Uses XDG_DATA_HOME if set, otherwise falls back to ~/.local/share/tdo.
// Validates that the path is a directory (not a file).
func DataDir() (string, error) {
	var baseDir string

	// Check XDG_DATA_HOME first
	if xdgData := os.Getenv("XDG_DATA_HOME"); xdgData != "" {
		baseDir = filepath.Join(xdgData, "tdo")
	} else {
		// Fall back to ~/.local/share/tdo
		home, err := os.UserHomeDir()
		if err != nil {
			return "", fmt.Errorf("cannot determine home directory: %w", err)
		}
		baseDir = filepath.Join(home, ".local", "share", "tdo")
	}

	// Validate path is not a file (E06)
	info, err := os.Stat(baseDir)
	if err == nil && !info.IsDir() {
		return "", fmt.Errorf("invalid data path: %s is a file", baseDir)
	}

	return baseDir, nil
}

// TasksPath returns the full path to tasks.json.
func TasksPath() (string, error) {
	dir, err := DataDir()
	if err != nil {
		return "", err
	}
	return filepath.Join(dir, "tasks.json"), nil
}
