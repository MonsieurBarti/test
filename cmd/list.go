package cmd

import (
	"fmt"

	"github.com/the-forge-flow/tttest/storage"
)

func init() {
	Register("list", "          List all tasks", runList)
}

func runList(args []string) error {
	store, err := storage.Load()
	if err != nil {
		return err
	}

	tasks := store.ActiveTasks()
	if len(tasks) == 0 {
		// No output for empty list (silent success)
		return nil
	}

	for _, t := range tasks {
		status := "[ ]"
		if t.Done {
			status = "[✓]"
		}
		fmt.Printf("%s %d: %s\n", status, t.Id, t.Text)
	}

	return nil
}
