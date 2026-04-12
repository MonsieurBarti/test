package main

import (
	"fmt"
	"os"
	"strings"
	"time"
)

// addTaskCommand creates a new task with the given text.
// Returns exit code: 0 on success, 1 on error.
// On success, prints the new task ID to stdout.
// On error, prints message to stderr.
func addTaskCommand(text string) int {
	// Validate input
	trimmed := strings.TrimSpace(text)
	if trimmed == "" {
		fmt.Fprintln(os.Stderr, "task text required")
		return 1
	}

	// Load existing tasks
	tasks, err := loadTasks()
	if err != nil {
		fmt.Fprintf(os.Stderr, "error: %v\n", err)
		return 1
	}

	// Generate new ID (max + 1)
	maxID := 0
	for _, task := range tasks {
		if task.ID > maxID {
			maxID = task.ID
		}
	}
	newID := maxID + 1

	// Create new task
	newTask := Task{
		ID:        newID,
		Text:      trimmed,
		Done:      false,
		CreatedAt: time.Now().UTC(),
	}

	// Append and save
	tasks = append(tasks, newTask)
	if err := saveTasks(tasks); err != nil {
		fmt.Fprintf(os.Stderr, "error: %v\n", err)
		return 1
	}

	// Print the ID
	fmt.Println(newID)
	return 0
}
