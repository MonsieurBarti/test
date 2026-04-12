package cmd

import (
	"fmt"
	"strconv"

	"github.com/the-forge-flow/tttest/storage"
)

func init() {
	Register("done", "<id>      Mark a task as complete", runDone)
}

func runDone(args []string) error {
	if len(args) < 1 {
		return fmt.Errorf("usage: tdo done <id>")
	}

	id, err := strconv.Atoi(args[0])
	if err != nil {
		return fmt.Errorf("invalid task ID: %s", args[0])
	}

	store, err := storage.Load()
	if err != nil {
		return err
	}

	task := store.FindTask(id)
	if task == nil {
		return fmt.Errorf("task %d not found", id)
	}

	// E08: Cannot mark deleted task as done
	if task.Deleted {
		return fmt.Errorf("task %d is deleted", id)
	}

	task.Done = true

	if err := storage.Save(store); err != nil {
		return err
	}

	return nil
}
