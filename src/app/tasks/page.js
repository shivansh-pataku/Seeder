"use client";
import React, { useEffect, useState } from 'react';
import TaskCard from '../Components/TaskCard';
import TaskEditor from '../Components/TaskEditor';
import styles from "../Styles/fetchdata.module.css";

export default function TasksPage() {
  const [tasks, setTasks] = useState([]); 
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedTask, setSelectedTask] = useState(null);
  const [isCreatingNew, setIsCreatingNew] = useState(false);
  const [saveStatus, setSaveStatus] = useState(''); // 'saving', 'saved', 'error'

///// Fetch tasks from databse through api ////////////////////////////////////////////////////////////////////////////////
  useEffect(() => {
    async function fetchTasks() {
      setLoading(true);

      try {
        const res = await fetch('/api/tasks');
        if (!res.ok) throw new Error('Failed to fetch tasks');
        const data = await res.json();
        setTasks(data.tasks || []);
        setError(null);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);

      }
    }
    fetchTasks();
  }, []);

///// Auto-save function for NEW tasks ////////////////////////////////////////////////////////////////////////////////

  const handleAutoSaveNew = async (taskData) => {
    if (!taskData.description || taskData.description.trim() === '') {
      setSaveStatus('pending');
      return;
    }

    setSaveStatus('saving');
    
    try {
      const response = await fetch('/api/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: taskData.title || 'Untitled',
          description: taskData.description.trim(),
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to save task');
      }

      const data = await response.json();
      
      // Add the new task to the tasks array
      setTasks(prevTasks => [data.task, ...prevTasks]);
      
      // Update selected task with the real ID from database
      setSelectedTask(data.task);
      setIsCreatingNew(false);
      setSaveStatus('saved');
      
      // Clear save status after 2 seconds
      setTimeout(() => setSaveStatus(''), 2000);
      
    } catch (err) {
      setError(err.message);
      setSaveStatus('error');
      console.error('Error saving new task:', err);
    }
  };

///// Auto-save function for EXISTING tasks ////////////////////////////////////////////////////////////////////////////////

  const handleAutoSaveExisting = async (taskData) => {
    if (!taskData.description || taskData.description.trim() === '') {
      setSaveStatus('pending');
      return;
    }

    setSaveStatus('saving');
    
    try {
      const response = await fetch('/api/tasks', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: taskData.id,
          title: taskData.title || 'Untitled',
          description: taskData.description.trim(),
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to update task');
      }

      const data = await response.json();
      
      // Update the task in the tasks array
      setTasks(prevTasks => 
        prevTasks.map(task => 
          task.id === data.task.id ? data.task : task
        )
      );
      
      // Update selected task
      setSelectedTask(data.task);
      setSaveStatus('saved');
      
      // Clear save status after 2 seconds
      setTimeout(() => setSaveStatus(''), 2000);
      
    } catch (err) {
      setError(err.message);
      setSaveStatus('error');
      console.error('Error updating task:', err);
    }
  };

  const handleTaskSave = (updatedTask) => {
    if (isCreatingNew) {
      // Handle new task creation with auto-save
      handleAutoSaveNew(updatedTask);
    } else {
      // Handle existing task update with auto-save
      handleAutoSaveExisting(updatedTask);
    }
  };

  const handleNewTask = () => {
    // Create a new task template
    const newTask = {
      id: 'temp_' + Date.now(), // Temporary ID until saved
      title: '',
      description: '',
      status: false,
      created_at: new Date().toISOString(),
    };
    
    setSelectedTask(newTask);
    setIsCreatingNew(true);
    setSaveStatus('');
    setError(null);
  };

///// Auto-save function for NEW tasks ////////////////////////////////////////////////////////////////////////////////

const handleDeleteTask = async (taskId) => {
    // Show confirmation dialog
    const confirmed = window.confirm('Are you sure you want to delete this task? This action cannot be undone.');

    if (!confirmed) return;

    setSaveStatus('deleting');
    
    try {
      const response = await fetch(`/api/fetch_data?id=${taskId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to delete task');
      }

      // Remove task from tasks array
      setTasks(prevTasks => prevTasks.filter(task => task.id !== taskId));
      
      // Clear selected task if it was the deleted one
      if (selectedTask && selectedTask.id === taskId) {
        setSelectedTask(null);
        setIsCreatingNew(false);
      }
      
      setSaveStatus('deleted');
      
      // Clear status after 2 seconds
      setTimeout(() => setSaveStatus(''), 2000);
      
    } catch (err) {
      setError(err.message);
      setSaveStatus('error');
      console.error('Error deleting task:', err);
    }
  };

  ///// Status toggle function ////////////////////////////////////////////////////////////////////////////////
  const handleStatusToggle = async (taskId, currentStatus) => {
    const newStatus = !currentStatus; // Toggle the status
    
    try {
      const response = await fetch('/api/tasks', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: taskId,
          status: newStatus
        }),
      });

      if (!response.ok) {
        let errorMessage = 'Failed to update status';
        try {
          const errorData = await response.json();
          errorMessage = errorData.message || errorMessage;
        } catch (jsonError) {
          errorMessage = `Status update failed: ${response.status} ${response.statusText}`;
        }
        throw new Error(errorMessage);
      }

      const data = await response.json();
      
      // Update the task in the tasks array
      setTasks(prevTasks => 
        prevTasks.map(task => 
          task.id === taskId ? { ...task, status: newStatus } : task
        )
      );
      
      // Update selected task if it's the one being updated
      if (selectedTask && selectedTask.id === taskId) {
        setSelectedTask(prevTask => ({ ...prevTask, status: newStatus }));
      }
      
    } catch (err) {
      setError(err.message);
      console.error('Error updating task status:', err);
    }
  };


///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
  return (
    <div className={styles.tasksMajor}>
      <div className={styles.tasks_list}>
        <div className={styles.tasks_bar}>
          <h2 className={styles.b1}>Seeds</h2> 
          <h2 className={styles.b2} onClick={handleNewTask}>Sow One</h2>
        </div>
        
        {/* Auto-save Status Indicator */}
        {saveStatus && (
          <div className={`${styles.saveStatus} ${styles[saveStatus]}`}>
            {saveStatus === 'saving' && 'Auto-saving...'}
            {saveStatus === 'saved' && 'Saved automatically!'}
            {saveStatus === 'deleting' && 'Deleting...'}
            {saveStatus === 'deleted' && 'Seed removed!'}
            {saveStatus === 'pending' && 'Add description to auto-save'}
            {saveStatus === 'error' && 'Failed'}
          </div>
        )}
        
        {error && <p style={{ color: 'red' }}>{error}</p>}
        {loading && !error && <p>Loading tasks...</p>}
        {!loading && tasks.length === 0 && !error && <p>No tasks found.</p>}
        
        <div className={styles.tasksContainer}>
          {tasks.map((task) => (
            <TaskCard 
              key={task.id} 
              task={task} 
              onClick={() => {
                setSelectedTask(task);
                setIsCreatingNew(false);
                setSaveStatus('');
              }}
              onStatusToggle={handleStatusToggle}
            />
          ))}
        </div>
      </div>
      
      <div className={styles.task_editor_box}>
        <TaskEditor 
          task={selectedTask} 
          onSave={handleTaskSave}
          onDelete={handleDeleteTask}
          isCreating={isCreatingNew}
          saveStatus={saveStatus}
        />
      </div>
    </div>
  );
}