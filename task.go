package main

import "time"

// Task represents a single todo item
type Task struct {
	ID        int       `json:"id"`
	Text      string    `json:"text"`
	Done      bool      `json:"done"`
	CreatedAt time.Time `json:"created_at"`
}

// Storage represents the root structure of the JSON storage file
type Storage struct {
	Tasks []Task `json:"tasks"`
}
