const API_URL = 'http://localhost:3000';
let todos = []; // Global variable to store todos

// Helper function to set a cookie
function setCookie(name, value, days) {
  const expires = new Date(Date.now() + days * 864e5).toUTCString();
  document.cookie =
    name +
    '=' +
    encodeURIComponent(value) +
    '; expires=' +
    expires +
    '; path=/';
}

// Helper function to get a cookie
function getCookie(name) {
  return document.cookie.split('; ').reduce((r, v) => {
    const parts = v.split('=');
    return parts[0] === name ? decodeURIComponent(parts[1]) : r;
  }, '');
}

// Helper function to delete a cookie
function deleteCookie(name) {
  setCookie(name, '', -1);
}

// Helper function for making API requests
async function apiRequest(endpoint, method = 'GET', body = null) {
  const headers = {
    'Content-Type': 'application/json',
  };

  const token = getCookie('authToken');
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_URL}${endpoint}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : null,
  });

  if (!response.ok) {
    const errorBody = await response.text();
    console.error(`API error: ${response.status} ${errorBody}`);
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  if (response.status === 204) {
    return null; // No content
  }

  return response.json();
}

// Register user
document
  .getElementById('register-form')
  .addEventListener('submit', async (e) => {
    e.preventDefault();
    const username = document.getElementById('register-username').value;
    const password = document.getElementById('register-password').value;

    try {
      const data = await apiRequest('/register', 'POST', {
        username,
        password,
      });
      setCookie('authToken', data.token, 7);
      showTodoApp();
    } catch (error) {
      console.error('Registration error:', error);
      alert('Registration failed: ' + error.message);
    }
  });

// Login user
document.getElementById('login-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  const username = document.getElementById('login-username').value;
  const password = document.getElementById('login-password').value;

  try {
    const data = await apiRequest('/login', 'POST', { username, password });
    setCookie('authToken', data.token, 7);
    showTodoApp();
  } catch (error) {
    console.error('Login error:', error);
    alert('Login failed: ' + error.message);
  }
});

// Logout user
document.getElementById('logout-btn').addEventListener('click', async () => {
  try {
    await apiRequest('/logout', 'POST');
    deleteCookie('authToken');
    showAuthForms();
  } catch (error) {
    console.error('Logout error:', error);
    alert('Logout failed: ' + error.message);
  }
});

// Add todo
document.getElementById('todo-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  const title = document.getElementById('todo-title').value;
  const description = document.getElementById('todo-description').value;

  try {
    await apiRequest('/todos', 'POST', { title, description });
    document.getElementById('todo-form').reset();
    loadTodos();
  } catch (error) {
    console.error('Add todo error:', error);
    alert('Failed to add todo: ' + error.message);
  }
});

// Load and display todos
async function loadTodos() {
  try {
    todos = await apiRequest('/todos');
    console.log('Loaded todos:', todos);
    const todoList = document.getElementById('todo-list');
    todoList.innerHTML = '';

    todos.forEach((todo) => {
      console.log(`Adding todo with ID: ${todo.id}`);
      const li = document.createElement('li');
      li.innerHTML = `
        <h3 class="${todo.completed ? 'completed' : ''}">${todo.title}</h3>
        <p>${todo.description}</p>
        <button onclick="toggleTodo(${todo.id}, ${!todo.completed})">
          ${todo.completed ? 'Undo' : 'Complete'}
        </button>
        <button onclick="editTodo(${todo.id})">Edit</button>
        <button onclick="deleteTodo(${todo.id})">Delete</button>
      `;
      todoList.appendChild(li);
    });
  } catch (error) {
    console.error('Load todos error:', error);
    alert('Failed to load todos: ' + error.message);
  }
}


// Toggle todo completion status
async function toggleTodo(id, completed) {
  try {
    await apiRequest(`/todos/${id}`, 'PUT', { completed });
    loadTodos();
  } catch (error) {
    console.error('Toggle todo error:', error);
    alert('Failed to update todo: ' + error.message);
  }
}

// Delete todo
async function deleteTodo(id) {
  try {
    await apiRequest(`/todos/${id}`, 'DELETE');
    loadTodos();
  } catch (error) {
    console.error('Delete todo error:', error);
    alert('Failed to delete todo: ' + error.message);
  }
}

// Edit todo
function editTodo(id) {
  console.log('Editing todo with id:', id);
  console.log('Current todos:', todos);
  
  const todo = todos.find((t) => t.id === id);
  
  if (todo) {
    console.log('Found todo:', todo);
    document.getElementById('edit-todo-id').value = todo.id;
    document.getElementById('edit-todo-title').value = todo.title;
    document.getElementById('edit-todo-description').value = todo.description;
    document.getElementById('edit-todo-completed').checked = todo.completed;
    document.getElementById('edit-todo-form').style.display = 'block';
  } else {
    console.error('Todo not found for id:', id);
    console.log('Available todo IDs:', todos.map(t => t.id));
    alert('Failed to load todo for editing: Todo not found');
  }
}


// Handle edit form submission
document.getElementById('edit-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  const id = document.getElementById('edit-todo-id').value;
  const title = document.getElementById('edit-todo-title').value;
  const description = document.getElementById('edit-todo-description').value;
  const completed = document.getElementById('edit-todo-completed').checked;

  try {
    await apiRequest(`/todos/${id}`, 'PUT', { title, description, completed });
    document.getElementById('edit-todo-form').style.display = 'none';
    loadTodos();
  } catch (error) {
    console.error('Update todo error:', error);
    alert('Failed to update todo: ' + error.message);
  }
});

// Show todo app and hide auth forms
function showTodoApp() {
  document.getElementById('auth-forms').style.display = 'none';
  document.getElementById('todo-app').style.display = 'block';
  loadTodos();
}

// Show auth forms and hide todo app
function showAuthForms() {
  document.getElementById('auth-forms').style.display = 'block';
  document.getElementById('todo-app').style.display = 'none';
  document.getElementById('edit-todo-form').style.display = 'none'; // Hide edit form
  document.getElementById('edit-form').reset(); // Reset the form
}

// Check if user is already logged in on page load
window.addEventListener('load', () => {
  const token = getCookie('authToken');
  if (token) {
    showTodoApp();
  } else {
    showAuthForms();
  }
});
