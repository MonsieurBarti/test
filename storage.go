package main

import (
	"encoding/json"
	"fmt"
	"os"
	"path/filepath"
)

// storageFilePath is the path to the JSON storage file
// This variable can be overridden for testing
var storageFilePath = getDefaultStoragePath()

// getDefaultStoragePath returns the default storage path in the user's home directory
func getDefaultStoragePath() string {
	homeDir, err := os.UserHomeDir()
	if err != nil {
		// Fallback to current directory if home dir can't be determined
		return ".tdo.json"
	}
	return filepath.Join(homeDir, ".tdo.json")
}

// loadTasks reads tasks from the storage file.
// If the file doesn't exist, it creates it with an empty tasks array.
// Returns an error if the file contains malformed JSON.
func loadTasks() ([]Task, error) {
	data, err := os.ReadFile(storageFilePath)
	if err != nil {
		if os.IsNotExist(err) {
			// File doesn't exist, create it with empty tasks
			if err := saveTasks([]Task{}); err != nil {
				return nil, fmt.Errorf("failed to create storage file: %w", err)
			}
			return []Task{}, nil
		}
		return nil, fmt.Errorf("failed to read storage file: %w", err)
	}

	// File exists, parse it
	var storage Storage
	if err := json.Unmarshal(data, &storage); err != nil {
		return nil, fmt.Errorf("corrupted storage file: %s", storageFilePath)
	}

	return storage.Tasks, nil
}

// saveTasks writes tasks to the storage file.
// Creates parent directories if needed.
func saveTasks(tasks []Task) error {
	storage := Storage{Tasks: tasks}
	
	data, err := json.MarshalIndent(storage, "", "  ")
	if err != nil {
		return fmt.Errorf("failed to marshal tasks: %w", err)
	}

	// Ensure parent directory exists
	dir := filepath.Dir(storageFilePath)
	if dir != "." && dir != "/" {
		if err := os.MkdirAll(dir, 0755); err != nil {
			return fmt.Errorf("failed to create directory: %w", err)
		}
	}

	if err := os.WriteFile(storageFilePath, data, 0644); err != nil {
		return fmt.Errorf("failed to write storage file: %w", err)
	}

	return nil
}
