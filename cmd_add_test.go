package main

import (
	"bytes"
	"os"
	"strings"
	"testing"
)

func TestAddCommandCreatesTask(t *testing.T) {
	storagePath, cleanup := setupTestStorage(t)
	defer cleanup()

	// Ensure file doesn't exist
	os.Remove(storagePath)

	// Capture stdout
	oldStdout := os.Stdout
	r, w, _ := os.Pipe()
	os.Stdout = w

	exitCode := addTaskCommand("buy milk")

	w.Close()
	os.Stdout = oldStdout

	var buf bytes.Buffer
	buf.ReadFrom(r)
	output := strings.TrimSpace(buf.String())

	if exitCode != 0 {
		t.Errorf("Expected exit code 0, got %d", exitCode)
	}

	if output != "1" {
		t.Errorf("Expected output '1', got '%s'", output)
	}

	// Verify task was created
	tasks, _ := loadTasks()
	if len(tasks) != 1 {
		t.Fatalf("Expected 1 task, got %d", len(tasks))
	}

	if tasks[0].ID != 1 || tasks[0].Text != "buy milk" || tasks[0].Done != false {
		t.Errorf("Task mismatch: got ID=%d, Text=%s, Done=%v", tasks[0].ID, tasks[0].Text, tasks[0].Done)
	}
}

func TestAddCommandGeneratesSequentialIDs(t *testing.T) {
	storagePath, cleanup := setupTestStorage(t)
	defer cleanup()
	defer os.Remove(storagePath)

	// Add first task
	addTaskCommand("first task")
	
	// Add second task
	exitCode := addTaskCommand("second task")
	
	if exitCode != 0 {
		t.Errorf("Expected exit code 0, got %d", exitCode)
	}

	// Verify both tasks exist with sequential IDs
	tasks, _ := loadTasks()
	if len(tasks) != 2 {
		t.Fatalf("Expected 2 tasks, got %d", len(tasks))
	}

	if tasks[0].ID != 1 || tasks[1].ID != 2 {
		t.Errorf("Expected IDs 1 and 2, got %d and %d", tasks[0].ID, tasks[1].ID)
	}

	if tasks[0].Text != "first task" || tasks[1].Text != "second task" {
		t.Errorf("Task text mismatch")
	}
}

func TestAddCommandRejectsEmptyText(t *testing.T) {
	storagePath, cleanup := setupTestStorage(t)
	defer cleanup()
	defer os.Remove(storagePath)

	// Capture stderr
	oldStderr := os.Stderr
	r, w, _ := os.Pipe()
	os.Stderr = w

	exitCode := addTaskCommand("")

	w.Close()
	os.Stderr = oldStderr

	var buf bytes.Buffer
	buf.ReadFrom(r)
	errOutput := strings.TrimSpace(buf.String())

	if exitCode != 1 {
		t.Errorf("Expected exit code 1, got %d", exitCode)
	}

	if !strings.Contains(errOutput, "task text required") {
		t.Errorf("Expected error message to contain 'task text required', got '%s'", errOutput)
	}

	// Verify no task was created
	tasks, _ := loadTasks()
	if len(tasks) != 0 {
		t.Errorf("Expected 0 tasks, got %d", len(tasks))
	}
}

func TestAddCommandRejectsWhitespaceOnlyText(t *testing.T) {
	storagePath, cleanup := setupTestStorage(t)
	defer cleanup()
	defer os.Remove(storagePath)

	// Capture stderr
	oldStderr := os.Stderr
	r, w, _ := os.Pipe()
	os.Stderr = w

	exitCode := addTaskCommand("   \t\n  ")

	w.Close()
	os.Stderr = oldStderr

	var buf bytes.Buffer
	buf.ReadFrom(r)
	errOutput := strings.TrimSpace(buf.String())

	if exitCode != 1 {
		t.Errorf("Expected exit code 1, got %d", exitCode)
	}

	if !strings.Contains(errOutput, "task text required") {
		t.Errorf("Expected error message to contain 'task text required', got '%s'", errOutput)
	}
}

func TestAddCommandPreservesExistingTasks(t *testing.T) {
	storagePath, cleanup := setupTestStorage(t)
	defer cleanup()
	defer os.Remove(storagePath)

	// Pre-populate with existing tasks
	existingTasks := []Task{
		{ID: 1, Text: "existing task", Done: false},
	}
	saveTasks(existingTasks)

	// Add new task
	addTaskCommand("new task")

	// Verify both tasks exist
	tasks, _ := loadTasks()
	if len(tasks) != 2 {
		t.Fatalf("Expected 2 tasks, got %d", len(tasks))
	}

	if tasks[0].Text != "existing task" || tasks[1].Text != "new task" {
		t.Errorf("Task preservation failed")
	}

	if tasks[1].ID != 2 {
		t.Errorf("Expected new task ID to be 2, got %d", tasks[1].ID)
	}
}


