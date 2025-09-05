// src/app/components/TaskCard.js
import styles from "../Styles/taskcard.module.css"

export default function TaskCard({ task, onClick, onStatusToggle }) {
  // Convert database value (0/1) to boolean
  const isCompleted = task.status === 1 || task.status === true;

  const handleStatusClick = (e) => {
    e.stopPropagation(); // Prevent triggering the card onClick
    onStatusToggle(task.id, isCompleted);
  };

  const handleCardClick = () => {
    onClick();
  };

  return (
    <div onClick={handleCardClick} className={styles["taskCard"]}>
      <div className={styles["tcareaA"]}>
        {/* <h1 className={styles["taskTitle"]}>{task.id}. {task.title}</h1> */}
        <h1 className={styles["taskTitle"]}>{task.title}</h1>
        <button 
          className={`${styles["taskButton"]} ${isCompleted ? styles["completed"] : styles["active"]}`}
          onClick={handleStatusClick}
          title={`Mark as ${isCompleted ? 'Active' : 'Done'}`}
        >
          {/* {isCompleted ? "🌸 Bloomed" : "🌱 Growing"} */}{isCompleted ? "#done" : "#active"}
        </button>
      </div>
      <div className={styles["tcareaB"]}>
        <p className={styles["taskDescription"]}>{task.description}</p>
        <span className={styles["taskDate"]}>{new Date(task.created_at).toLocaleDateString()}</span>
      </div>
    </div> 
  );
}