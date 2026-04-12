package storage

import (
	"fmt"
	"os"
	"path/filepath"
)

// WriteAtomic writes data to a temp file in the same directory, fsyncs,
// then renames to the target path. This ensures atomic updates.
// Implements the pattern validated in RESEARCH.md.
func WriteAtomic(path string, data []byte) error {
	dir := filepath.Dir(path)

	// Create temp file in same directory (R4: avoid cross-device rename issues)
	tmp, err := os.CreateTemp(dir, ".tasks.json.tmp.*")
	if err != nil {
		return fmt.Errorf("cannot create temp file: %w", err)
	}
	tmpPath := tmp.Name()

	// Clean up temp file on error
	defer func() {
		if err != nil {
			os.Remove(tmpPath)
		}
	}()

	// Write data
	if _, err = tmp.Write(data); err != nil {
		tmp.Close()
		return fmt.Errorf("cannot write to temp file: %w", err)
	}

	// Sync to disk (ensures data is persisted before rename)
	if err = tmp.Sync(); err != nil {
		tmp.Close()
		return fmt.Errorf("cannot sync temp file: %w", err)
	}

	// Close before rename
	if err = tmp.Close(); err != nil {
		return fmt.Errorf("cannot close temp file: %w", err)
	}

	// Atomic rename
	if err = os.Rename(tmpPath, path); err != nil {
		return fmt.Errorf("cannot rename temp file: %w", err)
	}

	return nil
}
