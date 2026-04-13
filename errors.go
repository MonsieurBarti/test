package tdo

import "fmt"

// StorageCorruptedError is returned when the storage file contains invalid JSON.
type StorageCorruptedError struct {
	Path string
}

func (e StorageCorruptedError) Error() string {
	return fmt.Sprintf("storage file is corrupted: %s", e.Path)
}

// StorageSchemaError is returned when the storage file has valid JSON but wrong structure.
type StorageSchemaError struct {
	Path string
}

func (e StorageSchemaError) Error() string {
	return fmt.Sprintf("storage file has invalid schema: %s", e.Path)
}
