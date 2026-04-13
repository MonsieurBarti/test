package store

import (
	"encoding/json"
	"fmt"
	"os"
)

// Task represents a single todo item.
type Task struct {
	ID   int    `json:"id"`
	Text string `json:"text"`
	Done bool   `json:"done"`
}

// ValidationError is returned when task text is invalid (empty or whitespace-only).
type ValidationError struct {
	Message string
}

func (e *ValidationError) Error() string {
	return e.Message
}

// StorageError is returned when file operations fail.
type StorageError struct {
	Op   string
	Path string
	Err  error
}

func (e *StorageError) Error() string {
	return fmt.Sprintf("%s %s: %v", e.Op, e.Path, e.Err)
}

func (e *StorageError) Unwrap() error {
	return e.Err
}

// TodoStore manages task persistence to a JSON file.
type TodoStore struct {
	filePath string
}

// NewTodoStore creates a store with the default file path "tdo.json".
func NewTodoStore() *TodoStore {
	return &TodoStore{filePath: "tdo.json"}
}

// NewTodoStoreWithPath creates a store with a custom file path (for testing).
func NewTodoStoreWithPath(path string) *TodoStore {
	return &TodoStore{filePath: path}
}

// readFile loads tasks from the JSON file.
// If the file doesn't exist, it returns an empty slice and creates the file.
// If the file contains invalid JSON, it returns a StorageError.
func (s *TodoStore) readFile() ([]Task, error) {
	data, err := os.ReadFile(s.filePath)
	if err != nil {
		if os.IsNotExist(err) {
			// Auto-create with empty array
			if writeErr := os.WriteFile(s.filePath, []byte("[]"), 0644); writeErr != nil {
				return nil, &StorageError{Op: "create", Path: s.filePath, Err: writeErr}
			}
			return []Task{}, nil
		}
		return nil, &StorageError{Op: "read", Path: s.filePath, Err: err}
	}
	var tasks []Task
	if err := json.Unmarshal(data, &tasks); err != nil {
		return nil, &StorageError{Op: "read", Path: s.filePath, Err: err}
	}
	if tasks == nil {
		tasks = []Task{}
	}
	return tasks, nil
}

// writeFile marshals and writes tasks to the JSON file.
func (s *TodoStore) writeFile(tasks []Task) error {
	data, err := json.Marshal(tasks)
	if err != nil {
		return &StorageError{Op: "marshal", Path: s.filePath, Err: err}
	}
	data = append(data, '\n')
	if err := os.WriteFile(s.filePath, data, 0644); err != nil {
		return &StorageError{Op: "write", Path: s.filePath, Err: err}
	}
	return nil
}
