package store

import "fmt"

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
