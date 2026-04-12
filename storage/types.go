package storage

// Task represents a single todo item.
// Deleted tasks are soft-deleted (preserved in storage, filtered from display).
type Task struct {
	Id      int    `json:"id"`
	Text    string `json:"text"`
	Done    bool   `json:"done"`
	Deleted bool   `json:"deleted"`
}

// Store is the top-level JSON structure.
type Store struct {
	NextId int    `json:"next_id"`
	Tasks  []Task `json:"tasks"`
}

// NewStore creates an empty store with next_id initialized to 1.
func NewStore() *Store {
	return &Store{
		NextId: 1,
		Tasks:  []Task{},
	}
}

// FindTask returns a pointer to the task with the given ID, or nil if not found.
// Does not filter deleted tasks - caller decides handling.
func (s *Store) FindTask(id int) *Task {
	for i := range s.Tasks {
		if s.Tasks[i].Id == id {
			return &s.Tasks[i]
		}
	}
	return nil
}

// ActiveTasks returns all non-deleted tasks in insertion order.
func (s *Store) ActiveTasks() []Task {
	var active []Task
	for _, t := range s.Tasks {
		if !t.Deleted {
			active = append(active, t)
		}
	}
	return active
}

// AddTask creates a new task with the next available ID.
func (s *Store) AddTask(text string) int {
	id := s.NextId
	s.Tasks = append(s.Tasks, Task{
		Id:      id,
		Text:    text,
		Done:    false,
		Deleted: false,
	})
	s.NextId++
	return id
}
