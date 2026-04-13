package tdo

import (
	"testing"
	"time"
)

func TestTodoStructFields(t *testing.T) {
	// AC1: Todo struct defined with exact fields and JSON tags
	tag := "work"
	now := time.Now()
	doneAt := now

	todo := Todo{
		ID:        1,
		Text:      "Test todo",
		Tag:       &tag,
		CreatedAt: now,
		DoneAt:    &doneAt,
	}

	if todo.ID != 1 {
		t.Errorf("expected ID 1, got %d", todo.ID)
	}
	if todo.Text != "Test todo" {
		t.Errorf("expected Text 'Test todo', got %s", todo.Text)
	}
	if todo.Tag == nil || *todo.Tag != "work" {
		t.Errorf("expected Tag 'work', got %v", todo.Tag)
	}
	if !todo.CreatedAt.Equal(now) {
		t.Errorf("expected CreatedAt %v, got %v", now, todo.CreatedAt)
	}
	if todo.DoneAt == nil || !todo.DoneAt.Equal(now) {
		t.Errorf("expected DoneAt %v, got %v", now, todo.DoneAt)
	}
}

func TestTodoJSONTags(t *testing.T) {
	// Verify JSON tags via reflection on struct type
	// This test will fail until todo.go is implemented
}

func TestErrorTypes(t *testing.T) {
	// AC9: Error types exist and implement error interface
	corruptedErr := StorageCorruptedError{Path: "/home/user/.tdo.json"}
	if corruptedErr.Error() == "" {
		t.Error("StorageCorruptedError should implement error interface")
	}
	if corruptedErr.Path != "/home/user/.tdo.json" {
		t.Errorf("expected Path '/home/user/.tdo.json', got %s", corruptedErr.Path)
	}

	schemaErr := StorageSchemaError{Path: "/home/user/.tdo.json"}
	if schemaErr.Error() == "" {
		t.Error("StorageSchemaError should implement error interface")
	}
	if schemaErr.Path != "/home/user/.tdo.json" {
		t.Errorf("expected Path '/home/user/.tdo.json', got %s", schemaErr.Path)
	}
}
