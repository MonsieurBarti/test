package main

import (
	"flag"
	"fmt"
	"os"
)

// runCLI parses command-line arguments and dispatches to the appropriate command.
// Returns exit code for the program.
func runCLI() int {
	if len(os.Args) < 2 {
		printUsage()
		return 0
	}

	command := os.Args[1]

	switch command {
	case "add":
		return handleAdd()
	case "list":
		return handleList()
	case "help", "-h", "--help":
		printUsage()
		return 0
	default:
		fmt.Fprintf(os.Stderr, "unknown command: %s\n", command)
		printUsage()
		return 1
	}
}

// handleAdd processes the add subcommand
func handleAdd() int {
	// Create a new flag set for add command
	addFlags := flag.NewFlagSet("add", flag.ContinueOnError)
	addFlags.SetOutput(os.Stderr)
	
	if err := addFlags.Parse(os.Args[2:]); err != nil {
		return 1
	}

	args := addFlags.Args()
	if len(args) == 0 {
		fmt.Fprintln(os.Stderr, "usage: tdo add <task text>")
		return 1
	}

	// Combine all remaining args as the task text
	text := args[0]
	return addTaskCommand(text)
}

// handleList processes the list subcommand
func handleList() int {
	// Create a new flag set for list command
	listFlags := flag.NewFlagSet("list", flag.ContinueOnError)
	listFlags.SetOutput(os.Stderr)
	
	if err := listFlags.Parse(os.Args[2:]); err != nil {
		return 1
	}

	return listTasksCommand()
}

// printUsage displays help information
func printUsage() {
	fmt.Println("usage: tdo <command> [arguments]")
	fmt.Println()
	fmt.Println("commands:")
	fmt.Println("  add <text>    Add a new task")
	fmt.Println("  list          List all tasks")
	fmt.Println("  help          Show this help message")
}

func main() {
	os.Exit(runCLI())
}
