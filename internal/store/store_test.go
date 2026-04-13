package store

import (
	"errors"
	"testing"
)

func TestTaskStruct(t *testing.T) {
	task := Task{
		ID:   1,
		Text: "buy milk",
		Done: false,
	}
	if task.ID != 1 {
		t.Errorf("expected ID 1, got %d", task.ID)
	}
	if task.Text != "buy milk" {
		t.Errorf("expected Text 'buy milk', got %q", task.Text)
	}
	if task.Done != false {
		t.Errorf("expected Done false, got %v", task.Done)
	}
}

func TestValidationError(t *testing.T) {
	err := &ValidationError{Message: "text cannot be empty"}
	if err.Error() != "text cannot be empty" {
		t.Errorf("expected error message 'text cannot be empty', got %q", err.Error())
	}
	// ValidationError should be a leaf error (no Unwrap)
	if errors.Unwrap(err) != nil {
		t.Error("ValidationError should not wrap another error")
	}
}

func TestStorageError(t *testing.T) {
	inner := errors.New("permission denied")
	err := &StorageError{
		Op:   "read",
		Path: "/path/to/file",
		Err:  inner,
	}
	if !errors.Is(err, inner) {
		t.Error("StorageError should wrap inner error for errors.Is")
	}
	var storageErr *StorageError
	if !errors.As(err, &storageErr) {
		t.Error("StorageError should be accessible via errors.As")
	}
	if storageErr.Op != "read" {
		t.Errorf("expected Op 'read', got %q", storageErr.Op)
	}
	if storageErr.Path != "/path/to/file" {
		t.Errorf("expected Path '/path/to/file', got %q", storageErr.Path)
	}
}
