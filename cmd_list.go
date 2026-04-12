package main

import (
	"fmt"
	"os"
	"text/tabwriter"
)

// listTasksCommand displays all tasks in a formatted list.
// Returns exit code: 0 on success, 1 on error.
func listTasksCommand() int {
	tasks, err := loadTasks()
	if err != nil {
		fmt.Fprintf(os.Stderr, "error: %v\n", err)
		return 1
	}

	// Empty list: exit 0 with no output
	if len(tasks) == 0 {
		return 0
	}

	// Use tabwriter for aligned output
	w := tabwriter.NewWriter(os.Stdout, 0, 0, 1, ' ', 0)
	
	for _, task := range tasks {
		status := "[ ]"
		if task.Done {
			status = "[x]"
		}
		fmt.Fprintf(w, "%s\t%d\t%s\n", status, task.ID, task.Text)
	}
	
	w.Flush()
	return 0
}
