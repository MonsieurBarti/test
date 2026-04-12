package cmd

import (
	"fmt"
	"os"
)

// Command represents a CLI command.
type Command struct {
	Name  string
	Run   func(args []string) error
	Usage string
}

// Registry holds all available commands.
var registry = map[string]*Command{}

// Register adds a command to the registry.
func Register(name, usage string, run func(args []string) error) {
	registry[name] = &Command{
		Name:  name,
		Run:   run,
		Usage: usage,
	}
}

// Dispatch routes to the appropriate command.
func Dispatch(args []string) error {
	if len(args) < 1 {
		return fmt.Errorf("no command specified")
	}

	cmdName := args[0]
	cmd, ok := registry[cmdName]
	if !ok {
		return fmt.Errorf("unknown command: %s", cmdName)
	}

	return cmd.Run(args[1:])
}

// PrintUsage outputs help text to stderr.
func PrintUsage() {
	fmt.Fprintln(os.Stderr, "Usage: tdo <command> [args]")
	fmt.Fprintln(os.Stderr, "")
	fmt.Fprintln(os.Stderr, "Commands:")
	for name, cmd := range registry {
		fmt.Fprintf(os.Stderr, "  %-8s %s\n", name, cmd.Usage)
	}
}
