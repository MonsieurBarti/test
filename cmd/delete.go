package cmd

import (
	"fmt"
	"strconv"

	"github.com/the-forge-flow/tttest/storage"
)

func init() {
	Register("delete", "<id>    Delete a task (soft delete)", runDelete)
}

func runDelete(args []string) error {
	if len(args) < 1 {
		return fmt.Errorf("usage: tdo delete <id>")
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

	// E07: Cannot delete already deleted task
	if task.Deleted {
		return fmt.Errorf("task %d is already deleted", id)
	}

	task.Deleted = true

	if err := storage.Save(store); err != nil {
		return err
	}

	return nil
}
