package main

import (
	"bytes"
	"os"
	"strings"
	"testing"
)

func TestMainAddCommand(t *testing.T) {
	_, cleanup := setupTestStorage(t)
	defer cleanup()

	// Simulate: tdo add "buy milk"
	os.Args = []string{"tdo", "add", "buy milk"}

	// Capture stdout and handle exit
	oldStdout := os.Stdout
	r, w, _ := os.Pipe()
	os.Stdout = w

	exitCode := runCLI()

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
}

func TestMainListCommand(t *testing.T) {
	_, cleanup := setupTestStorage(t)
	defer cleanup()

	// Setup: add a task first
	addTaskCommand("test task")

	// Capture stdout
	oldStdout := os.Stdout
	r, w, _ := os.Pipe()
	os.Stdout = w

	// Simulate: tdo list
	os.Args = []string{"tdo", "list"}
	exitCode := runCLI()

	w.Close()
	os.Stdout = oldStdout

	var buf bytes.Buffer
	buf.ReadFrom(r)
	output := strings.TrimSpace(buf.String())

	if exitCode != 0 {
		t.Errorf("Expected exit code 0, got %d", exitCode)
	}

	if !strings.Contains(output, "test task") {
		t.Errorf("Expected output to contain 'test task', got:\n%s", output)
	}
}

func TestMainNoArgsShowsUsage(t *testing.T) {
	// Simulate: tdo (no args)
	os.Args = []string{"tdo"}

	// Capture stdout
	oldStdout := os.Stdout
	r, w, _ := os.Pipe()
	os.Stdout = w

	exitCode := runCLI()

	w.Close()
	os.Stdout = oldStdout

	var buf bytes.Buffer
	buf.ReadFrom(r)
	output := strings.TrimSpace(buf.String())

	// No args should show usage and exit 0 or 1
	// Let's accept either exit code, but output should contain usage info
	_ = exitCode // could be 0 or 1 depending on implementation
	
	if !strings.Contains(strings.ToLower(output), "usage") {
		t.Errorf("Expected usage info in output, got:\n%s", output)
	}
}

func TestMainUnknownCommand(t *testing.T) {
	// Simulate: tdo unknown
	os.Args = []string{"tdo", "unknown"}

	// Capture stderr
	oldStderr := os.Stderr
	r, w, _ := os.Pipe()
	os.Stderr = w

	exitCode := runCLI()

	w.Close()
	os.Stderr = oldStderr

	var buf bytes.Buffer
	buf.ReadFrom(r)
	errOutput := strings.TrimSpace(buf.String())

	if exitCode != 1 {
		t.Errorf("Expected exit code 1 for unknown command, got %d", exitCode)
	}

	if !strings.Contains(strings.ToLower(errOutput), "unknown") {
		t.Errorf("Expected error about unknown command, got:\n%s", errOutput)
	}
}

func TestMainAddWithoutArgs(t *testing.T) {
	_, cleanup := setupTestStorage(t)
	defer cleanup()

	// Simulate: tdo add (no text)
	os.Args = []string{"tdo", "add"}

	// Capture stderr
	oldStderr := os.Stderr
	r, w, _ := os.Pipe()
	os.Stderr = w

	exitCode := runCLI()

	w.Close()
	os.Stderr = oldStderr

	var buf bytes.Buffer
	buf.ReadFrom(r)
	errOutput := strings.TrimSpace(buf.String())

	if exitCode != 1 {
		t.Errorf("Expected exit code 1, got %d", exitCode)
	}

	// Should contain error about missing text
	if !strings.Contains(strings.ToLower(errOutput), "required") && !strings.Contains(strings.ToLower(errOutput), "usage") {
		t.Errorf("Expected error about required text or usage, got:\n%s", errOutput)
	}
}
