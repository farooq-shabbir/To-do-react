import React from 'react';
import TodoItem from './TodoItem';

function TodoList({ todos, editTodo, toggleComplete, deleteTodo }) {
  if (todos.length === 0) {
    return <p className="empty-message">No tasks yet. Add one to get started!</p>;
  }

  return (
    <div className="todo-list">
      {todos.map(todo => (
        <TodoItem
          key={todo.id}
          todo={todo}
          editTodo={editTodo}
          toggleComplete={toggleComplete}
          deleteTodo={deleteTodo}
        />
      ))}
    </div>
  );
}

export default TodoList;
