package store

import (
	"errors"
	"os"
	"testing"
)

func TestTaskStruct(t *testing.T) {
	task := Task{
		ID:   1,
		Text: "buy milk",
		Done: false,
	}
	if task.ID != 1 {
		t.Errorf("expected ID 1, got %d", task.ID)
	}
	if task.Text != "buy milk" {
		t.Errorf("expected Text 'buy milk', got %q", task.Text)
	}
	if task.Done != false {
		t.Errorf("expected Done false, got %v", task.Done)
	}
}

func TestValidationError(t *testing.T) {
	err := &ValidationError{Message: "text cannot be empty"}
	if err.Error() != "text cannot be empty" {
		t.Errorf("expected error message 'text cannot be empty', got %q", err.Error())
	}
	// ValidationError should be a leaf error (no Unwrap)
	if errors.Unwrap(err) != nil {
		t.Error("ValidationError should not wrap another error")
	}
}

func TestStorageError(t *testing.T) {
	inner := errors.New("permission denied")
	err := &StorageError{
		Op:   "read",
		Path: "/path/to/file",
		Err:  inner,
	}
	if !errors.Is(err, inner) {
		t.Error("StorageError should wrap inner error for errors.Is")
	}
	var storageErr *StorageError
	if !errors.As(err, &storageErr) {
		t.Error("StorageError should be accessible via errors.As")
	}
	if storageErr.Op != "read" {
		t.Errorf("expected Op 'read', got %q", storageErr.Op)
	}
	if storageErr.Path != "/path/to/file" {
		t.Errorf("expected Path '/path/to/file', got %q", storageErr.Path)
	}
}

func TestNewTodoStore(t *testing.T) {
	store := NewTodoStore()
	if store == nil {
		t.Fatal("NewTodoStore returned nil")
	}
	if store.filePath != "tdo.json" {
		t.Errorf("expected filePath 'tdo.json', got %q", store.filePath)
	}
}

func TestNewTodoStoreWithPath(t *testing.T) {
	store := NewTodoStoreWithPath("/tmp/test.json")
	if store == nil {
		t.Fatal("NewTodoStoreWithPath returned nil")
	}
	if store.filePath != "/tmp/test.json" {
		t.Errorf("expected filePath '/tmp/test.json', got %q", store.filePath)
	}
}

func TestReadFileAutoCreates(t *testing.T) {
	dir := t.TempDir()
	path := dir + "/tdo.json"
	store := NewTodoStoreWithPath(path)
	tasks, err := store.readFile()
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if tasks == nil {
		t.Fatal("expected empty slice, got nil")
	}
	if len(tasks) != 0 {
		t.Errorf("expected 0 tasks, got %d", len(tasks))
	}
}

func TestReadFileCorruptedJSON(t *testing.T) {
	dir := t.TempDir()
	path := dir + "/tdo.json"
	if err := os.WriteFile(path, []byte("not valid json"), 0644); err != nil {
		t.Fatal(err)
	}
	store := NewTodoStoreWithPath(path)
	_, err := store.readFile()
	if err == nil {
		t.Fatal("expected error for corrupted JSON")
	}
	var storageErr *StorageError
	if !errors.As(err, &storageErr) {
		t.Fatalf("expected StorageError, got %T: %v", err, err)
	}
	if storageErr.Op != "read" {
		t.Errorf("expected Op 'read', got %q", storageErr.Op)
	}
}

func TestWriteFile(t *testing.T) {
	dir := t.TempDir()
	path := dir + "/tdo.json"
	store := NewTodoStoreWithPath(path)
	tasks := []Task{
		{ID: 1, Text: "buy milk", Done: false},
	}
	if err := store.writeFile(tasks); err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	data, err := os.ReadFile(path)
	if err != nil {
		t.Fatal(err)
	}
	expected := `[{"id":1,"text":"buy milk","done":false}]` + "\n"
	if string(data) != expected {
		t.Errorf("expected %q, got %q", expected, string(data))
	}
}

func TestCreateTask(t *testing.T) {
	dir := t.TempDir()
	path := dir + "/tdo.json"
	store := NewTodoStoreWithPath(path)

	// Test happy path
	task, err := store.CreateTask("buy milk")
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if task.ID != 1 {
		t.Errorf("expected ID 1, got %d", task.ID)
	}
	if task.Text != "buy milk" {
		t.Errorf("expected Text 'buy milk', got %q", task.Text)
	}
	if task.Done != false {
		t.Errorf("expected Done false, got %v", task.Done)
	}

	// Verify persistence
	tasks, err := store.readFile()
	if err != nil {
		t.Fatal(err)
	}
	if len(tasks) != 1 {
		t.Fatalf("expected 1 task, got %d", len(tasks))
	}
}

func TestCreateTaskTrim(t *testing.T) {
	dir := t.TempDir()
	path := dir + "/tdo.json"
	store := NewTodoStoreWithPath(path)

	task, err := store.CreateTask("  buy milk  ")
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if task.Text != "buy milk" {
		t.Errorf("expected trimmed text 'buy milk', got %q", task.Text)
	}
}

func TestCreateTaskValidation(t *testing.T) {
	dir := t.TempDir()
	path := dir + "/tdo.json"
	store := NewTodoStoreWithPath(path)

	// Empty text
	_, err := store.CreateTask("")
	if err == nil {
		t.Fatal("expected error for empty text")
	}
	var valErr *ValidationError
	if !errors.As(err, &valErr) {
		t.Fatalf("expected ValidationError, got %T: %v", err, err)
	}

	// Whitespace-only text
	_, err = store.CreateTask("   ")
	if err == nil {
		t.Fatal("expected error for whitespace-only text")
	}
	if !errors.As(err, &valErr) {
		t.Fatalf("expected ValidationError, got %T: %v", err, err)
	}
}

func TestCreateTaskSequentialID(t *testing.T) {
	dir := t.TempDir()
	path := dir + "/tdo.json"
	store := NewTodoStoreWithPath(path)

	task1, _ := store.CreateTask("first")
	task2, _ := store.CreateTask("second")
	task3, _ := store.CreateTask("third")

	if task1.ID != 1 {
		t.Errorf("expected ID 1, got %d", task1.ID)
	}
	if task2.ID != 2 {
		t.Errorf("expected ID 2, got %d", task2.ID)
	}
	if task3.ID != 3 {
		t.Errorf("expected ID 3, got %d", task3.ID)
	}
}

func TestGetTask(t *testing.T) {
	dir := t.TempDir()
	path := dir + "/tdo.json"
	store := NewTodoStoreWithPath(path)

	store.CreateTask("first")
	store.CreateTask("second")

	task := store.GetTask(1)
	if task == nil {
		t.Fatal("expected task, got nil")
	}
	if task.ID != 1 {
		t.Errorf("expected ID 1, got %d", task.ID)
	}
	if task.Text != "first" {
		t.Errorf("expected Text 'first', got %q", task.Text)
	}

	task2 := store.GetTask(2)
	if task2 == nil {
		t.Fatal("expected task, got nil")
	}
	if task2.ID != 2 {
		t.Errorf("expected ID 2, got %d", task2.ID)
	}

	// Non-existent task
	nilTask := store.GetTask(999)
	if nilTask != nil {
		t.Errorf("expected nil for non-existent task, got %v", nilTask)
	}
}

func TestListTasks(t *testing.T) {
	dir := t.TempDir()
	path := dir + "/tdo.json"
	store := NewTodoStoreWithPath(path)

	// Empty list
	tasks := store.ListTasks()
	if tasks == nil {
		t.Fatal("expected empty slice, got nil")
	}
	if len(tasks) != 0 {
		t.Errorf("expected 0 tasks, got %d", len(tasks))
	}

	// Add tasks
	store.CreateTask("third")
	store.CreateTask("first")
	store.CreateTask("second")

	// List should be sorted by ID
	tasks = store.ListTasks()
	if len(tasks) != 3 {
		t.Fatalf("expected 3 tasks, got %d", len(tasks))
	}
	if tasks[0].Text != "third" {
		t.Errorf("expected first task 'third', got %q", tasks[0].Text)
	}
	if tasks[1].Text != "first" {
		t.Errorf("expected second task 'first', got %q", tasks[1].Text)
	}
	if tasks[2].Text != "second" {
		t.Errorf("expected third task 'second', got %q", tasks[2].Text)
	}
}

func TestUpdateTask(t *testing.T) {
	dir := t.TempDir()
	path := dir + "/tdo.json"
	store := NewTodoStoreWithPath(path)

	task, _ := store.CreateTask("buy milk")

	// Update the task
	task.Text = "buy almond milk"
	task.Done = true
	err := store.UpdateTask(task)
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}

	// Verify persistence
	updated := store.GetTask(1)
	if updated == nil {
		t.Fatal("task not found")
	}
	if updated.Text != "buy almond milk" {
		t.Errorf("expected Text 'buy almond milk', got %q", updated.Text)
	}
	if updated.Done != true {
		t.Errorf("expected Done true, got %v", updated.Done)
	}
}

func TestUpdateTaskNotFound(t *testing.T) {
	dir := t.TempDir()
	path := dir + "/tdo.json"
	store := NewTodoStoreWithPath(path)

	// Update non-existent task
	err := store.UpdateTask(Task{ID: 999, Text: "not found", Done: false})
	if err == nil {
		t.Fatal("expected error for non-existent task")
	}
	var storageErr *StorageError
	if !errors.As(err, &storageErr) {
		t.Fatalf("expected StorageError, got %T: %v", err, err)
	}
	if storageErr.Op != "update" {
		t.Errorf("expected Op 'update', got %q", storageErr.Op)
	}
}

func TestDeleteTask(t *testing.T) {
	dir := t.TempDir()
	path := dir + "/tdo.json"
	store := NewTodoStoreWithPath(path)

	store.CreateTask("first")
	store.CreateTask("second")

	// Delete existing task
	deleted := store.DeleteTask(1)
	if !deleted {
		t.Error("expected true for existing task")
	}

	// Verify persistence
	tasks := store.ListTasks()
	if len(tasks) != 1 {
		t.Fatalf("expected 1 task, got %d", len(tasks))
	}
	if tasks[0].ID != 2 {
		t.Errorf("expected remaining task ID 2, got %d", tasks[0].ID)
	}

	// Delete non-existent task
	deleted = store.DeleteTask(999)
	if deleted {
		t.Error("expected false for non-existent task")
	}
}

func TestPersistenceAcrossOperations(t *testing.T) {
	dir := t.TempDir()
	path := dir + "/tdo.json"
	store := NewTodoStoreWithPath(path)

	// Create
	store.CreateTask("task one")
	store.CreateTask("task two")

	// Create new store instance (simulates restart)
	store2 := NewTodoStoreWithPath(path)
	tasks := store2.ListTasks()
	if len(tasks) != 2 {
		t.Fatalf("expected 2 tasks after restart, got %d", len(tasks))
	}

	// Update
	task := tasks[0]
	task.Done = true
	store2.UpdateTask(task)

	// Verify with third instance
	store3 := NewTodoStoreWithPath(path)
	updated := store3.GetTask(task.ID)
	if updated == nil || !updated.Done {
		t.Error("expected task to be done after update")
	}
}

func TestListTasksEmptySliceNotNul(t *testing.T) {
	dir := t.TempDir()
	path := dir + "/tdo.json"
	store := NewTodoStoreWithPath(path)

	tasks := store.ListTasks()
	if tasks == nil {
		t.Fatal("expected empty slice, not nil")
	}
	if len(tasks) != 0 {
		t.Errorf("expected 0 tasks, got %d", len(tasks))
	}
}

func TestIDDoesNotReuseAfterDelete(t *testing.T) {
	dir := t.TempDir()
	path := dir + "/tdo.json"
	store := NewTodoStoreWithPath(path)

	store.CreateTask("first")  // ID 1
	store.CreateTask("second") // ID 2
	store.DeleteTask(1)        // Delete ID 1

	task, _ := store.CreateTask("third") // Should be ID 3, not 1
	if task.ID != 3 {
		t.Errorf("expected ID 3, got %d (should not reuse deleted IDs)", task.ID)
	}
}
