package main

import (
	"encoding/json"
	"testing"
	"time"
)

func TestTaskStruct(t *testing.T) {
	// Test that Task struct exists with correct fields
	createdAt := time.Date(2026, 4, 12, 10, 30, 0, 0, time.UTC)
	
	task := Task{
		ID:        1,
		Text:      "buy milk",
		Done:      false,
		CreatedAt: createdAt,
	}

	if task.ID != 1 {
		t.Errorf("Expected ID to be 1, got %d", task.ID)
	}
	if task.Text != "buy milk" {
		t.Errorf("Expected Text to be 'buy milk', got %s", task.Text)
	}
	if task.Done != false {
		t.Errorf("Expected Done to be false, got %v", task.Done)
	}
	if !task.CreatedAt.Equal(createdAt) {
		t.Errorf("Expected CreatedAt to be %v, got %v", createdAt, task.CreatedAt)
	}
}

func TestTaskJSONSerialization(t *testing.T) {
	// Test that Task serializes to correct JSON format
	createdAt := time.Date(2026, 4, 12, 10, 30, 0, 0, time.UTC)
	
	task := Task{
		ID:        1,
		Text:      "buy milk",
		Done:      false,
		CreatedAt: createdAt,
	}

	data, err := json.Marshal(task)
	if err != nil {
		t.Fatalf("Failed to marshal task: %v", err)
	}

	// Verify JSON contains expected fields
	var result map[string]interface{}
	if err := json.Unmarshal(data, &result); err != nil {
		t.Fatalf("Failed to unmarshal JSON: %v", err)
	}

	if result["id"] != float64(1) {
		t.Errorf("Expected id to be 1, got %v", result["id"])
	}
	if result["text"] != "buy milk" {
		t.Errorf("Expected text to be 'buy milk', got %v", result["text"])
	}
	if result["done"] != false {
		t.Errorf("Expected done to be false, got %v", result["done"])
	}
	if _, ok := result["created_at"]; !ok {
		t.Errorf("Expected created_at field to exist")
	}
}

func TestStorageStruct(t *testing.T) {
	// Test that Storage struct exists with tasks array
	storage := Storage{
		Tasks: []Task{
			{ID: 1, Text: "task 1", Done: false, CreatedAt: time.Now()},
			{ID: 2, Text: "task 2", Done: true, CreatedAt: time.Now()},
		},
	}

	if len(storage.Tasks) != 2 {
		t.Errorf("Expected 2 tasks, got %d", len(storage.Tasks))
	}

	// Test JSON serialization
	data, err := json.Marshal(storage)
	if err != nil {
		t.Fatalf("Failed to marshal storage: %v", err)
	}

	var result map[string]interface{}
	if err := json.Unmarshal(data, &result); err != nil {
		t.Fatalf("Failed to unmarshal JSON: %v", err)
	}

	tasks, ok := result["tasks"].([]interface{})
	if !ok {
		t.Fatalf("Expected tasks to be an array")
	}
	if len(tasks) != 2 {
		t.Errorf("Expected 2 tasks in JSON, got %d", len(tasks))
	}
}
