package main

import (
	"fmt"
	"os"
)

func main() {
	if len(os.Args) < 2 {
		fmt.Fprintln(os.Stderr, "Usage: tdo <command> [args]")
		fmt.Fprintln(os.Stderr, "Commands: add, list, done, delete")
		os.Exit(1)
	}

	// Placeholder - commands will be implemented in subsequent tasks
	fmt.Println("tdo CLI initialized")
}
