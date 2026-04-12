package main

import (
	"bytes"
	"os"
	"strings"
	"testing"
)

func TestListCommandEmptyList(t *testing.T) {
	_, cleanup := setupTestStorage(t)
	defer cleanup()

	// Ensure no tasks
	saveTasks([]Task{})

	// Capture stdout and stderr
	oldStdout := os.Stdout
	oldStderr := os.Stderr
	r, w, _ := os.Pipe()
	os.Stdout = w
	os.Stderr = w

	exitCode := listTasksCommand()

	w.Close()
	os.Stdout = oldStdout
	os.Stderr = oldStderr

	var buf bytes.Buffer
	buf.ReadFrom(r)
	output := buf.String()

	if exitCode != 0 {
		t.Errorf("Expected exit code 0, got %d", exitCode)
	}

	// Empty list should have no output or just whitespace
	// (spec allows empty output or brief message)
	// We'll accept either
	_ = output // output can be empty or a message
}

func TestListCommandDisplaysPendingTask(t *testing.T) {
	_, cleanup := setupTestStorage(t)
	defer cleanup()

	// Add a pending task
	tasks := []Task{
		{ID: 1, Text: "buy milk", Done: false},
	}
	saveTasks(tasks)

	// Capture stdout
	oldStdout := os.Stdout
	r, w, _ := os.Pipe()
	os.Stdout = w

	exitCode := listTasksCommand()

	w.Close()
	os.Stdout = oldStdout

	var buf bytes.Buffer
	buf.ReadFrom(r)
	output := strings.TrimSpace(buf.String())

	if exitCode != 0 {
		t.Errorf("Expected exit code 0, got %d", exitCode)
	}

	// Should show: "[ ] 1 buy milk"
	if !strings.Contains(output, "[ ]") {
		t.Errorf("Expected output to contain '[ ]' for pending task, got:\n%s", output)
	}
	if !strings.Contains(output, "buy milk") {
		t.Errorf("Expected output to contain 'buy milk', got:\n%s", output)
	}
	if !strings.Contains(output, "1") {
		t.Errorf("Expected output to contain task ID '1', got:\n%s", output)
	}
}

func TestListCommandDisplaysDoneTask(t *testing.T) {
	_, cleanup := setupTestStorage(t)
	defer cleanup()

	// Add a done task
	tasks := []Task{
		{ID: 1, Text: "call dentist", Done: true},
	}
	saveTasks(tasks)

	// Capture stdout
	oldStdout := os.Stdout
	r, w, _ := os.Pipe()
	os.Stdout = w

	exitCode := listTasksCommand()

	w.Close()
	os.Stdout = oldStdout

	var buf bytes.Buffer
	buf.ReadFrom(r)
	output := strings.TrimSpace(buf.String())

	if exitCode != 0 {
		t.Errorf("Expected exit code 0, got %d", exitCode)
	}

	// Should show: "[x] 1 call dentist"
	if !strings.Contains(output, "[x]") {
		t.Errorf("Expected output to contain '[x]' for done task, got:\n%s", output)
	}
}

func TestListCommandDisplaysMultipleTasks(t *testing.T) {
	_, cleanup := setupTestStorage(t)
	defer cleanup()

	// Add multiple tasks
	tasks := []Task{
		{ID: 1, Text: "buy milk", Done: false},
		{ID: 2, Text: "call dentist", Done: true},
		{ID: 3, Text: "write spec", Done: false},
	}
	saveTasks(tasks)

	// Capture stdout
	oldStdout := os.Stdout
	r, w, _ := os.Pipe()
	os.Stdout = w

	exitCode := listTasksCommand()

	w.Close()
	os.Stdout = oldStdout

	var buf bytes.Buffer
	buf.ReadFrom(r)
	output := buf.String()

	if exitCode != 0 {
		t.Errorf("Expected exit code 0, got %d", exitCode)
	}

	// Verify all tasks appear
	lines := strings.Split(strings.TrimSpace(output), "\n")
	if len(lines) != 3 {
		t.Errorf("Expected 3 output lines, got %d:\n%s", len(lines), output)
	}

	// Check first line format
	if !strings.Contains(lines[0], "[ ]") || !strings.Contains(lines[0], "buy milk") {
		t.Errorf("First line format incorrect: %s", lines[0])
	}
	// Check second line format
	if !strings.Contains(lines[1], "[x]") || !strings.Contains(lines[1], "call dentist") {
		t.Errorf("Second line format incorrect: %s", lines[1])
	}
	// Check third line format
	if !strings.Contains(lines[2], "[ ]") || !strings.Contains(lines[2], "write spec") {
		t.Errorf("Third line format incorrect: %s", lines[2])
	}
}

func TestListCommandReturnsErrorForCorruptedStorage(t *testing.T) {
	storagePath, cleanup := setupTestStorage(t)
	defer cleanup()

	// Write malformed JSON
	os.WriteFile(storagePath, []byte("{not valid}"), 0644)

	// Capture stderr
	oldStderr := os.Stderr
	r, w, _ := os.Pipe()
	os.Stderr = w

	exitCode := listTasksCommand()

	w.Close()
	os.Stderr = oldStderr

	var buf bytes.Buffer
	buf.ReadFrom(r)
	errOutput := strings.TrimSpace(buf.String())

	if exitCode != 1 {
		t.Errorf("Expected exit code 1 for corrupted storage, got %d", exitCode)
	}

	if !strings.Contains(errOutput, "corrupted storage file") {
		t.Errorf("Expected error about corrupted storage, got: %s", errOutput)
	}
}
