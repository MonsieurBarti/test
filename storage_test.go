package main

import (
	"encoding/json"
	"os"
	"path/filepath"
	"testing"
)

// setupTestStorage creates a temporary directory and returns the storage path
func setupTestStorage(t *testing.T) (string, func()) {
	t.Helper()
	tempDir := t.TempDir()
	storagePath := filepath.Join(tempDir, ".tdo.json")
	
	// Override storage path for testing
	originalPath := storageFilePath
	storageFilePath = storagePath
	
	cleanup := func() {
		storageFilePath = originalPath
	}
	
	return storagePath, cleanup
}

func TestLoadTasksCreatesFileIfMissing(t *testing.T) {
	storagePath, cleanup := setupTestStorage(t)
	defer cleanup()

	// Ensure file doesn't exist
	if _, err := os.Stat(storagePath); !os.IsNotExist(err) {
		os.Remove(storagePath)
	}

	tasks, err := loadTasks()
	if err != nil {
		t.Fatalf("Expected no error, got %v", err)
	}

	if len(tasks) != 0 {
		t.Errorf("Expected empty tasks, got %d", len(tasks))
	}

	// Verify file was created with correct structure
	data, err := os.ReadFile(storagePath)
	if err != nil {
		t.Fatalf("Expected file to exist, got error: %v", err)
	}

	var storage Storage
	if err := json.Unmarshal(data, &storage); err != nil {
		t.Fatalf("Expected valid JSON, got error: %v", err)
	}

	if len(storage.Tasks) != 0 {
		t.Errorf("Expected empty tasks array, got %d", len(storage.Tasks))
	}
}

func TestLoadTasksReturnsErrorForMalformedJSON(t *testing.T) {
	storagePath, cleanup := setupTestStorage(t)
	defer cleanup()

	// Write malformed JSON
	if err := os.WriteFile(storagePath, []byte("{not valid json}"), 0644); err != nil {
		t.Fatalf("Failed to write test file: %v", err)
	}

	_, err := loadTasks()
	if err == nil {
		t.Fatal("Expected error for malformed JSON, got nil")
	}

	// Verify file was not modified
	data, _ := os.ReadFile(storagePath)
	if string(data) != "{not valid json}" {
		t.Error("File was modified when it should not have been")
	}
}

func TestLoadTasksLoadsExistingTasks(t *testing.T) {
	storagePath, cleanup := setupTestStorage(t)
	defer cleanup()

	// Create existing storage with tasks
	storage := Storage{
		Tasks: []Task{
			{ID: 1, Text: "existing task", Done: false},
		},
	}
	data, _ := json.Marshal(storage)
	if err := os.WriteFile(storagePath, data, 0644); err != nil {
		t.Fatalf("Failed to write test file: %v", err)
	}

	tasks, err := loadTasks()
	if err != nil {
		t.Fatalf("Expected no error, got %v", err)
	}

	if len(tasks) != 1 {
		t.Errorf("Expected 1 task, got %d", len(tasks))
	}

	if tasks[0].ID != 1 || tasks[0].Text != "existing task" {
		t.Errorf("Expected task ID=1, text='existing task', got ID=%d, text=%s", tasks[0].ID, tasks[0].Text)
	}
}

func TestSaveTasksWritesCorrectJSON(t *testing.T) {
	storagePath, cleanup := setupTestStorage(t)
	defer cleanup()

	tasks := []Task{
		{ID: 1, Text: "task one", Done: false},
		{ID: 2, Text: "task two", Done: true},
	}

	if err := saveTasks(tasks); err != nil {
		t.Fatalf("Expected no error, got %v", err)
	}

	// Read and verify
	data, err := os.ReadFile(storagePath)
	if err != nil {
		t.Fatalf("Expected file to exist, got error: %v", err)
	}

	var storage Storage
	if err := json.Unmarshal(data, &storage); err != nil {
		t.Fatalf("Expected valid JSON, got error: %v", err)
	}

	if len(storage.Tasks) != 2 {
		t.Errorf("Expected 2 tasks, got %d", len(storage.Tasks))
	}

	if storage.Tasks[0].ID != 1 || storage.Tasks[0].Text != "task one" {
		t.Errorf("First task mismatch")
	}
	if storage.Tasks[1].ID != 2 || storage.Tasks[1].Text != "task two" {
		t.Errorf("Second task mismatch")
	}
}

func TestSaveTasksCreatesParentDirectory(t *testing.T) {
	tempDir := t.TempDir()
	deepPath := filepath.Join(tempDir, "subdir1", "subdir2", ".tdo.json")
	
	// Override storage path
	originalPath := storageFilePath
	storageFilePath = deepPath
	defer func() { storageFilePath = originalPath }()

	tasks := []Task{{ID: 1, Text: "test", Done: false}}

	if err := saveTasks(tasks); err != nil {
		t.Fatalf("Expected no error, got %v", err)
	}

	// Verify file exists
	if _, err := os.Stat(deepPath); os.IsNotExist(err) {
		t.Error("Expected file to be created in nested directory")
	}
}
