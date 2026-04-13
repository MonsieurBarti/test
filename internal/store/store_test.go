package store

import (
	"errors"
	"os"
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

func TestNewTodoStore(t *testing.T) {
	store := NewTodoStore()
	if store == nil {
		t.Fatal("NewTodoStore returned nil")
	}
	if store.filePath != "tdo.json" {
		t.Errorf("expected filePath 'tdo.json', got %q", store.filePath)
	}
}

func TestNewTodoStoreWithPath(t *testing.T) {
	store := NewTodoStoreWithPath("/tmp/test.json")
	if store == nil {
		t.Fatal("NewTodoStoreWithPath returned nil")
	}
	if store.filePath != "/tmp/test.json" {
		t.Errorf("expected filePath '/tmp/test.json', got %q", store.filePath)
	}
}

func TestReadFileAutoCreates(t *testing.T) {
	dir := t.TempDir()
	path := dir + "/tdo.json"
	store := NewTodoStoreWithPath(path)
	tasks, err := store.readFile()
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if tasks == nil {
		t.Fatal("expected empty slice, got nil")
	}
	if len(tasks) != 0 {
		t.Errorf("expected 0 tasks, got %d", len(tasks))
	}
}

func TestReadFileCorruptedJSON(t *testing.T) {
	dir := t.TempDir()
	path := dir + "/tdo.json"
	if err := os.WriteFile(path, []byte("not valid json"), 0644); err != nil {
		t.Fatal(err)
	}
	store := NewTodoStoreWithPath(path)
	_, err := store.readFile()
	if err == nil {
		t.Fatal("expected error for corrupted JSON")
	}
	var storageErr *StorageError
	if !errors.As(err, &storageErr) {
		t.Fatalf("expected StorageError, got %T: %v", err, err)
	}
	if storageErr.Op != "read" {
		t.Errorf("expected Op 'read', got %q", storageErr.Op)
	}
}

func TestWriteFile(t *testing.T) {
	dir := t.TempDir()
	path := dir + "/tdo.json"
	store := NewTodoStoreWithPath(path)
	tasks := []Task{
		{ID: 1, Text: "buy milk", Done: false},
	}
	if err := store.writeFile(tasks); err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	data, err := os.ReadFile(path)
	if err != nil {
		t.Fatal(err)
	}
	expected := `[{"id":1,"text":"buy milk","done":false}]` + "\n"
	if string(data) != expected {
		t.Errorf("expected %q, got %q", expected, string(data))
	}
}
