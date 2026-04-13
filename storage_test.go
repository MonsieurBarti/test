package tdo

import (
	"encoding/json"
	"os"
	"path/filepath"
	"testing"
	"time"
)

func TestLoadTodosReturnsEmptyForMissingFile(t *testing.T) {
	// AC2: loadTodos returns empty for missing file
	// Use a temp directory with no .tdo.json file
	tempDir := t.TempDir()

	// Point to non-existent file in temp dir
	originalHome := os.Getenv("HOME")
	t.Setenv("HOME", tempDir)
	defer os.Setenv("HOME", originalHome)

	todos, err := loadTodos()
	if err != nil {
		t.Errorf("expected no error for missing file, got %v", err)
	}
	if len(todos) != 0 {
		t.Errorf("expected empty slice, got %d todos", len(todos))
	}
}

func TestLoadTodosReturnsTodosForValidFile(t *testing.T) {
	// AC3: loadTodos returns todos for valid file
	tempDir := t.TempDir()
	t.Setenv("HOME", tempDir)

	// Create a valid JSON file
	tag := "work"
	now := time.Now().UTC()
	todos := []Todo{
		{
			ID:        1,
			Text:      "Test todo",
			Tag:       &tag,
			CreatedAt: now,
		},
	}
	data, err := json.Marshal(todos)
	if err != nil {
		t.Fatalf("failed to marshal test todos: %v", err)
	}
	err = os.WriteFile(filepath.Join(tempDir, ".tdo.json"), data, 0644)
	if err != nil {
		t.Fatalf("failed to write test file: %v", err)
	}

	loaded, err := loadTodos()
	if err != nil {
		t.Errorf("expected no error, got %v", err)
	}
	if len(loaded) != 1 {
		t.Fatalf("expected 1 todo, got %d", len(loaded))
	}
	if loaded[0].ID != 1 {
		t.Errorf("expected ID 1, got %d", loaded[0].ID)
	}
	if loaded[0].Text != "Test todo" {
		t.Errorf("expected Text 'Test todo', got %s", loaded[0].Text)
	}
	if loaded[0].Tag == nil || *loaded[0].Tag != "work" {
		t.Errorf("expected Tag 'work', got %v", loaded[0].Tag)
	}
}

func TestLoadTodosErrorsOnInvalidJSON(t *testing.T) {
	// AC4: loadTodos errors on invalid JSON
	tempDir := t.TempDir()
	t.Setenv("HOME", tempDir)

	// Write invalid JSON
	invalidJSON := []byte(`{this is not valid json}`)
	err := os.WriteFile(filepath.Join(tempDir, ".tdo.json"), invalidJSON, 0644)
	if err != nil {
		t.Fatalf("failed to write test file: %v", err)
	}

	_, err = loadTodos()
	if err == nil {
		t.Fatal("expected error for invalid JSON, got nil")
	}

	// Verify it's a StorageCorruptedError
	corruptedErr, ok := err.(StorageCorruptedError)
	if !ok {
		t.Errorf("expected StorageCorruptedError, got %T", err)
	}
	if corruptedErr.Path == "" {
		t.Error("expected Path to be set in StorageCorruptedError")
	}
}

func TestLoadTodosErrorsOnWrongSchemaNotArray(t *testing.T) {
	// AC5: loadTodos errors on wrong schema (object instead of array)
	tempDir := t.TempDir()
	t.Setenv("HOME", tempDir)

	// Valid JSON but wrong structure (object instead of array)
	wrongSchema := []byte(`{"id": 1, "text": "test"}`)
	err := os.WriteFile(filepath.Join(tempDir, ".tdo.json"), wrongSchema, 0644)
	if err != nil {
		t.Fatalf("failed to write test file: %v", err)
	}

	_, err = loadTodos()
	if err == nil {
		t.Fatal("expected error for wrong schema, got nil")
	}

	// Verify it's a StorageSchemaError
	schemaErr, ok := err.(StorageSchemaError)
	if !ok {
		t.Errorf("expected StorageSchemaError, got %T", err)
	}
	if schemaErr.Path == "" {
		t.Error("expected Path to be set in StorageSchemaError")
	}
}

func TestLoadTodosErrorsOnWrongSchemaMissingFields(t *testing.T) {
	// AC5: loadTodos errors on wrong schema (items missing required fields)
	tempDir := t.TempDir()
	t.Setenv("HOME", tempDir)

	// Array but items missing required fields
	wrongSchema := []byte(`[{"text": "test"}]`)
	err := os.WriteFile(filepath.Join(tempDir, ".tdo.json"), wrongSchema, 0644)
	if err != nil {
		t.Fatalf("failed to write test file: %v", err)
	}

	_, err = loadTodos()
	if err == nil {
		t.Fatal("expected error for wrong schema, got nil")
	}

	// Verify it's a StorageSchemaError
	_, ok := err.(StorageSchemaError)
	if !ok {
		t.Errorf("expected StorageSchemaError, got %T", err)
	}
}

func TestSaveTodosCreatesFileAtomically(t *testing.T) {
	// AC6: saveTodos creates file atomically
	tempDir := t.TempDir()
	t.Setenv("HOME", tempDir)

	tag := "work"
	now := time.Now().UTC()
	todos := []Todo{
		{
			ID:        1,
			Text:      "Test todo",
			Tag:       &tag,
			CreatedAt: now,
		},
	}

	err := saveTodos(todos)
	if err != nil {
		t.Fatalf("expected no error, got %v", err)
	}

	// Verify file exists
	path := filepath.Join(tempDir, ".tdo.json")
	if _, err := os.Stat(path); os.IsNotExist(err) {
		t.Fatal("expected file to be created")
	}

	// Verify content
	data, err := os.ReadFile(path)
	if err != nil {
		t.Fatalf("failed to read file: %v", err)
	}

	var loaded []Todo
	if err := json.Unmarshal(data, &loaded); err != nil {
		t.Fatalf("failed to unmarshal: %v", err)
	}

	if len(loaded) != 1 {
		t.Errorf("expected 1 todo, got %d", len(loaded))
	}
	if loaded[0].ID != 1 {
		t.Errorf("expected ID 1, got %d", loaded[0].ID)
	}
}

func TestSaveTodosOverwritesAtomically(t *testing.T) {
	// AC7: saveTodos overwrites atomically
	tempDir := t.TempDir()
	t.Setenv("HOME", tempDir)

	// Create initial file
	initialPath := filepath.Join(tempDir, ".tdo.json")
	initialData := []byte(`[{"id": 1, "text": "old", "createdAt": "2024-01-01T00:00:00Z"}]`)
	if err := os.WriteFile(initialPath, initialData, 0644); err != nil {
		t.Fatalf("failed to create initial file: %v", err)
	}

	// Overwrite with new data
	tag := "work"
	now := time.Now().UTC()
	todos := []Todo{
		{
			ID:        2,
			Text:      "New todo",
			Tag:       &tag,
			CreatedAt: now,
		},
	}

	err := saveTodos(todos)
	if err != nil {
		t.Fatalf("expected no error, got %v", err)
	}

	// Verify file was replaced
	data, err := os.ReadFile(initialPath)
	if err != nil {
		t.Fatalf("failed to read file: %v", err)
	}

	var loaded []Todo
	if err := json.Unmarshal(data, &loaded); err != nil {
		t.Fatalf("failed to unmarshal: %v", err)
	}

	if len(loaded) != 1 {
		t.Errorf("expected 1 todo, got %d", len(loaded))
	}
	if loaded[0].ID != 2 {
		t.Errorf("expected ID 2, got %d", loaded[0].ID)
	}
	if loaded[0].Text != "New todo" {
		t.Errorf("expected Text 'New todo', got %s", loaded[0].Text)
	}
}

func TestRoundTripIntegrity(t *testing.T) {
	// AC8: Round-trip integrity - saveTodos followed by loadTodos returns identical []Todo
	tempDir := t.TempDir()
	t.Setenv("HOME", tempDir)

	tag := "work"
	doneAt := time.Now().UTC()
	now := time.Now().UTC()
	original := []Todo{
		{
			ID:        1,
			Text:      "First todo",
			Tag:       &tag,
			CreatedAt: now,
		},
		{
			ID:        2,
			Text:      "Second todo",
			CreatedAt: now,
			DoneAt:    &doneAt,
		},
		{
			ID:        3,
			Text:      "Third todo",
			CreatedAt: now,
		},
	}

	// Save
	if err := saveTodos(original); err != nil {
		t.Fatalf("saveTodos failed: %v", err)
	}

	// Load
	loaded, err := loadTodos()
	if err != nil {
		t.Fatalf("loadTodos failed: %v", err)
	}

	// Verify count
	if len(loaded) != len(original) {
		t.Fatalf("expected %d todos, got %d", len(original), len(loaded))
	}

	// Verify each todo matches
	for i, orig := range original {
		got := loaded[i]
		if got.ID != orig.ID {
			t.Errorf("todo[%d]: expected ID %d, got %d", i, orig.ID, got.ID)
		}
		if got.Text != orig.Text {
			t.Errorf("todo[%d]: expected Text %q, got %q", i, orig.Text, got.Text)
		}
		// Check Tag
		if (orig.Tag == nil) != (got.Tag == nil) {
			t.Errorf("todo[%d]: Tag nil mismatch", i)
		} else if orig.Tag != nil && *got.Tag != *orig.Tag {
			t.Errorf("todo[%d]: expected Tag %q, got %q", i, *orig.Tag, *got.Tag)
		}
		// Check CreatedAt
		if !got.CreatedAt.Equal(orig.CreatedAt) {
			t.Errorf("todo[%d]: CreatedAt mismatch", i)
		}
		// Check DoneAt
		if (orig.DoneAt == nil) != (got.DoneAt == nil) {
			t.Errorf("todo[%d]: DoneAt nil mismatch", i)
		} else if orig.DoneAt != nil && !got.DoneAt.Equal(*orig.DoneAt) {
			t.Errorf("todo[%d]: DoneAt mismatch", i)
		}
	}
}
