package tdo

import (
	"encoding/json"
	"os"
	"path/filepath"
)

// loadTodos reads todos from ~/.tdo.json.
// Returns an empty slice if the file doesn't exist.
// Returns StorageCorruptedError if the file has invalid JSON.
// Returns StorageSchemaError if the JSON has wrong structure.
func loadTodos() ([]Todo, error) {
	homeDir, err := os.UserHomeDir()
	if err != nil {
		return nil, err
	}

	path := filepath.Join(homeDir, ".tdo.json")

	data, err := os.ReadFile(path)
	if err != nil {
		if os.IsNotExist(err) {
			return []Todo{}, nil
		}
		return nil, err
	}

	// First, check if the JSON is syntactically valid
	var rawMsg json.RawMessage
	if err := json.Unmarshal(data, &rawMsg); err != nil {
		return nil, StorageCorruptedError{Path: path}
	}

	// Now check if it's an array of objects with required fields
	var raw []map[string]interface{}
	if err := json.Unmarshal(data, &raw); err != nil {
		return nil, StorageSchemaError{Path: path}
	}

	// Verify each item has required 'id' field
	for _, item := range raw {
		if _, ok := item["id"]; !ok {
			return nil, StorageSchemaError{Path: path}
		}
	}

	// Finally, unmarshal to the actual type
	var todos []Todo
	if err := json.Unmarshal(data, &todos); err != nil {
		return nil, StorageSchemaError{Path: path}
	}

	return todos, nil
}
