package tdo

import "time"

// Todo represents a single todo item.
type Todo struct {
	ID        int        `json:"id"`
	Text      string     `json:"text"`
	Tag       *string    `json:"tag,omitempty"`
	CreatedAt time.Time  `json:"createdAt"`
	DoneAt    *time.Time `json:"doneAt,omitempty"`
}
