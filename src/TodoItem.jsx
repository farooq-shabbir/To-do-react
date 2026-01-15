import React, { useState } from 'react';

function TodoItem({ todo, editTodo, toggleComplete, deleteTodo }) {
  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState(todo.text);

  const handleEdit = () => {
    if (editText.trim() !== '') {
      editTodo(todo.id, editText);
      setIsEditing(false);
    }
  };

  const handleCancel = () => {
    setEditText(todo.text);
    setIsEditing(false);
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleEdit();
    } else if (e.key === 'Escape') {
      handleCancel();
    }
  };

  return (
    <div className={`todo-item ${todo.completed ? 'completed' : ''}`}>
      <input
        type="checkbox"
        checked={todo.completed}
        onChange={() => toggleComplete(todo.id)}
        className="checkbox"
      />
      
      {isEditing ? (
        <div className="edit-section">
          <input
            type="text"
            value={editText}
            onChange={(e) => setEditText(e.target.value)}
            onKeyDown={handleKeyPress}
            className="edit-input"
            autoFocus
          />
          <div className="edit-buttons">
            <button onClick={handleEdit} className="save-btn">✓</button>
            <button onClick={handleCancel} className="cancel-btn">✕</button>
          </div>
        </div>
      ) : (
        <>
          <span className="todo-text">{todo.text}</span>
          <div className="action-buttons">
            <button 
              onClick={() => setIsEditing(true)} 
              className="edit-btn"
              disabled={todo.completed}
            >
              ✏️
            </button>
            <button 
              onClick={() => deleteTodo(todo.id)} 
              className="delete-btn"
            >
              🗑️
            </button>
          </div>
        </>
      )}
    </div>
  );
}

export default TodoItem;
