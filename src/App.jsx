import './App.css'
import { useEffect, useMemo, useState } from 'react'

const API_BASE = '/todos'

function formatDate(value) {
  if (!value) return '-'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '-'
  return date.toLocaleDateString()
}

function App() {
  const [todos, setTodos] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const [newTitle, setNewTitle] = useState('')
  const [newDueDate, setNewDueDate] = useState('')

  const [editingId, setEditingId] = useState('')
  const [editingTitle, setEditingTitle] = useState('')
  const [editingDueDate, setEditingDueDate] = useState('')

  const doneCount = useMemo(
    () => todos.filter((todo) => todo.done).length,
    [todos],
  )

  async function fetchTodos() {
    setLoading(true)
    setError('')
    try {
      const res = await fetch(API_BASE)
      const json = await res.json()
      if (!res.ok || !json.ok) {
        throw new Error(json.message || '목록 조회에 실패했습니다.')
      }
      setTodos(json.data ?? [])
    } catch (err) {
      setError(err.message || '네트워크 오류가 발생했습니다.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchTodos()
  }, [])

  async function handleAddTodo(e) {
    e.preventDefault()
    const title = newTitle.trim()
    if (!title) return

    try {
      const res = await fetch(API_BASE, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          dueDate: newDueDate || null,
        }),
      })
      const json = await res.json()
      if (!res.ok || !json.ok) {
        throw new Error(json.message || '추가에 실패했습니다.')
      }
      setTodos((prev) => [json.data, ...prev])
      setNewTitle('')
      setNewDueDate('')
      setError('')
    } catch (err) {
      setError(err.message || '네트워크 오류가 발생했습니다.')
    }
  }

  function startEdit(todo) {
    setEditingId(todo._id)
    setEditingTitle(todo.title)
    setEditingDueDate(todo.dueDate ? todo.dueDate.slice(0, 10) : '')
  }

  function cancelEdit() {
    setEditingId('')
    setEditingTitle('')
    setEditingDueDate('')
  }

  async function saveEdit(todoId) {
    const title = editingTitle.trim()
    if (!title) {
      setError('수정 제목은 비워둘 수 없습니다.')
      return
    }

    try {
      const res = await fetch(`${API_BASE}/${todoId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          dueDate: editingDueDate || null,
        }),
      })
      const json = await res.json()
      if (!res.ok || !json.ok) {
        throw new Error(json.message || '수정에 실패했습니다.')
      }
      setTodos((prev) =>
        prev.map((todo) => (todo._id === todoId ? json.data : todo)),
      )
      setError('')
      cancelEdit()
    } catch (err) {
      setError(err.message || '네트워크 오류가 발생했습니다.')
    }
  }

  async function toggleDone(todo) {
    try {
      const res = await fetch(`${API_BASE}/${todo._id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ done: !todo.done }),
      })
      const json = await res.json()
      if (!res.ok || !json.ok) {
        throw new Error(json.message || '상태 변경에 실패했습니다.')
      }
      setTodos((prev) =>
        prev.map((item) => (item._id === todo._id ? json.data : item)),
      )
      setError('')
    } catch (err) {
      setError(err.message || '네트워크 오류가 발생했습니다.')
    }
  }

  async function deleteTodo(todoId) {
    try {
      const res = await fetch(`${API_BASE}/${todoId}`, { method: 'DELETE' })
      const json = await res.json()
      if (!res.ok || !json.ok) {
        throw new Error(json.message || '삭제에 실패했습니다.')
      }
      setTodos((prev) => prev.filter((todo) => todo._id !== todoId))
      if (editingId === todoId) cancelEdit()
      setError('')
    } catch (err) {
      setError(err.message || '네트워크 오류가 발생했습니다.')
    }
  }

  return (
    <main className="app">
      <h1>할일 앱</h1>
      <p className="summary">
        총 {todos.length}개 / 완료 {doneCount}개
      </p>

      <form className="todo-form" onSubmit={handleAddTodo}>
        <input
          type="text"
          placeholder="할일 제목"
          value={newTitle}
          onChange={(e) => setNewTitle(e.target.value)}
        />
        <input
          type="date"
          value={newDueDate}
          onChange={(e) => setNewDueDate(e.target.value)}
        />
        <button type="submit">추가</button>
      </form>

      {error && <p className="error">{error}</p>}
      {loading && <p>불러오는 중...</p>}

      {!loading && (
        <ul className="todo-list">
          {todos.map((todo) => {
            const isEditing = editingId === todo._id
            return (
              <li key={todo._id} className="todo-item">
                <input
                  type="checkbox"
                  checked={todo.done}
                  onChange={() => toggleDone(todo)}
                />

                {isEditing ? (
                  <>
                    <input
                      type="text"
                      value={editingTitle}
                      onChange={(e) => setEditingTitle(e.target.value)}
                    />
                    <input
                      type="date"
                      value={editingDueDate}
                      onChange={(e) => setEditingDueDate(e.target.value)}
                    />
                    <button onClick={() => saveEdit(todo._id)}>저장</button>
                    <button type="button" onClick={cancelEdit}>
                      취소
                    </button>
                  </>
                ) : (
                  <>
                    <div className="todo-content">
                      <span className={todo.done ? 'done' : ''}>{todo.title}</span>
                      <small>마감일: {formatDate(todo.dueDate)}</small>
                    </div>
                    <button onClick={() => startEdit(todo)}>수정</button>
                    <button onClick={() => deleteTodo(todo._id)}>삭제</button>
                  </>
                )}
              </li>
            )
          })}
        </ul>
      )}
    </main>
  )
}

export default App
