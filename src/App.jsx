import React, { useState } from 'react';
import TodoList from './TodoList';

function App() {
  const [todos, setTodos] = useState([]);
  const [inputValue, setInputValue] = useState('');

  // CREATE - Add a new todo
  const addTodo = () => {
    if (inputValue.trim() !== '') {
      const newTodo = {
        id: Date.now(),
        text: inputValue,
        completed: false
      };
      setTodos([...todos, newTodo]);
      setInputValue('');
    }
  };

  // UPDATE - Edit a todo
  const editTodo = (id, newText) => {
    setTodos(todos.map(todo => 
      todo.id === id ? { ...todo, text: newText } : todo
    ));
  };

  // UPDATE - Toggle completion status
  const toggleComplete = (id) => {
    setTodos(todos.map(todo => 
      todo.id === id ? { ...todo, completed: !todo.completed } : todo
    ));
  };

  // DELETE - Remove a todo
  const deleteTodo = (id) => {
    setTodos(todos.filter(todo => todo.id !== id));
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      addTodo();
    }
  };

  return (
    <div className="app">
      <div className="container">
        <h1>📝 My Todo List</h1>
        
        <div className="input-section">
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Add a new task..."
            className="todo-input"
          />
          <button onClick={addTodo} className="add-btn">
            Add
          </button>
        </div>

        <TodoList 
          todos={todos}
          editTodo={editTodo}
          toggleComplete={toggleComplete}
          deleteTodo={deleteTodo}
        />

        <div className="stats">
          <p>Total: {todos.length} | Completed: {todos.filter(t => t.completed).length}</p>
        </div>
      </div>
    </div>
  );
}

export default App;
