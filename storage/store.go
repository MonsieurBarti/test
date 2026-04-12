package storage

import (
	"encoding/json"
	"errors"
	"fmt"
	"os"
)

// Load reads the store from disk, creating an empty store if the file
// doesn't exist. Returns E03 error if JSON is corrupt.
func Load() (*Store, error) {
	path, err := TasksPath()
	if err != nil {
		return nil, err
	}

	data, err := os.ReadFile(path)
	if err != nil {
		if errors.Is(err, os.ErrNotExist) {
			// E02: Missing tasks.json - return empty store
			return NewStore(), nil
		}
		return nil, fmt.Errorf("cannot read data file: %w", err)
	}

	var store Store
	if err := json.Unmarshal(data, &store); err != nil {
		return nil, fmt.Errorf("corrupted data file: %s", path)
	}

	return &store, nil
}

// Save writes the store to disk atomically.
// Creates the data directory if needed (E01). Returns E04 on write errors.
func Save(store *Store) error {
	// Get paths
	path, err := TasksPath()
	if err != nil {
		return err
	}

	// E01: Ensure data directory exists
	dir := os.ExpandEnv("${XDG_DATA_HOME}")
	if dir == "" {
		home, _ := os.UserHomeDir()
		dir = fmt.Sprintf("%s/.local/share", home)
	}
	dir = fmt.Sprintf("%s/tdo", dir)

	// Actually get the directory from TasksPath logic
	dataDir, _ := DataDir()
	if err := os.MkdirAll(dataDir, 0755); err != nil {
		return fmt.Errorf("cannot create data directory: %w", err)
	}

	// Marshal to pretty-printed JSON
	data, err := json.MarshalIndent(store, "", "  ")
	if err != nil {
		return fmt.Errorf("cannot marshal store: %w", err)
	}
	data = append(data, '\n')

	// Atomic write (E04 handled in WriteAtomic)
	if err := WriteAtomic(path, data); err != nil {
		return fmt.Errorf("cannot write to %s: %w", path, err)
	}

	return nil
}
