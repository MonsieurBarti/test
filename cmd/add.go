package cmd

import (
	"fmt"
	"strings"

	"github.com/the-forge-flow/tttest/storage"
)

func init() {
	Register("add", "<text>  Add a new task", runAdd)
}

func runAdd(args []string) error {
	if len(args) < 1 {
		return fmt.Errorf("usage: tdo add <text>")
	}

	text := strings.Join(args, " ")

	store, err := storage.Load()
	if err != nil {
		return err
	}

	id := store.AddTask(text)

	if err := storage.Save(store); err != nil {
		return err
	}

	fmt.Println(id)
	return nil
}
