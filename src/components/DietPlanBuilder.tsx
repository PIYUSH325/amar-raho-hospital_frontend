import React, { useState } from 'react';
import { DietPlanTask } from '../types';

interface DietPlanBuilderProps {
  checklist: DietPlanTask[];
  onChange: (updatedChecklist: DietPlanTask[]) => void;
}

const DietPlanBuilder: React.FC<DietPlanBuilderProps> = ({ checklist, onChange }) => {
  const [taskText, setTaskText] = useState('');
  const [taskType, setTaskType] = useState<'nutrition' | 'fitness' | 'general'>('nutrition');
  const [targetTime, setTargetTime] = useState('08:00');

  const handleAddTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!taskText.trim() || !targetTime) return;

    const newTask: DietPlanTask = {
      task: taskText.trim(),
      type: taskType,
      targetTime,
      isCompleted: false
    };

    onChange([...checklist, newTask]);
    setTaskText('');
  };

  const handleRemoveTask = (indexToRemove: number) => {
    const updated = checklist.filter((_, idx) => idx !== indexToRemove);
    onChange(updated);
  };

  return (
    <div className="card border-0 shadow-sm rounded-4 p-4 mb-4 text-start" style={{ background: '#f8fafc', border: '1px solid #e2e8f0' }}>
      <h6 className="fw-bold mb-3 text-dark d-flex align-items-center">
        <i className="fa fa-apple-alt text-success me-2 fs-5"></i>
        Nutrition & Fitness Planner (Daily To-Do)
      </h6>
      <p className="text-muted small mb-4">
        Design a structured diet and physical activity schedule. The patient will see these on their dashboard as an interactive checklist.
      </p>

      {/* Task input form */}
      <div className="row g-2 align-items-end mb-4 bg-white p-3 rounded-3 border">
        <div className="col-md-5">
          <label className="small text-muted fw-bold mb-1">Task Description</label>
          <input 
            type="text" 
            className="form-control form-control-sm" 
            placeholder="e.g. Drink 1L water, Walk 30 mins"
            value={taskText} 
            onChange={(e) => setTaskText(e.target.value)} 
          />
        </div>
        
        <div className="col-md-3">
          <label className="small text-muted fw-bold mb-1">Category Type</label>
          <select 
            className="form-select form-select-sm" 
            value={taskType} 
            onChange={(e) => setTaskType(e.target.value as any)}
          >
            <option value="nutrition">🍏 Nutrition (Diet)</option>
            <option value="fitness">🏃 Fitness (Exercise)</option>
            <option value="general">📋 General Habits</option>
          </select>
        </div>

        <div className="col-md-2">
          <label className="small text-muted fw-bold mb-1">Target Time</label>
          <input 
            type="time" 
            className="form-control form-control-sm" 
            value={targetTime}
            onChange={(e) => setTargetTime(e.target.value)}
          />
        </div>

        <div className="col-md-2 text-end">
          <button 
            type="button" 
            className="btn btn-primary btn-sm w-100 fw-bold rounded-pill"
            onClick={handleAddTask}
            disabled={!taskText.trim()}
          >
            <i className="fa fa-plus me-1"></i> Add Task
          </button>
        </div>
      </div>

      {/* Current tasks display checklist */}
      <label className="small text-muted fw-bold d-block mb-2">Planned Checklist Tasks ({checklist.length})</label>
      {checklist.length === 0 ? (
        <div className="text-muted small text-center py-4 bg-white border rounded-3">
          No tasks added yet. Create at least one task above.
        </div>
      ) : (
        <div className="list-group rounded-3 border bg-white">
          {checklist.map((item, index) => (
            <div key={index} className="list-group-item d-flex justify-content-between align-items-center py-2 px-3 border-0 border-bottom last-border-0">
              <div className="d-flex align-items-center gap-2">
                <span className={`badge ${
                  item.type === 'nutrition' ? 'bg-success-subtle text-success border border-success' :
                  item.type === 'fitness' ? 'bg-purple-subtle text-purple border border-purple' :
                  'bg-info-subtle text-info border border-info'
                }`} style={{ fontSize: '10px' }}>
                  {item.type === 'nutrition' ? '🍏 Nutrition' :
                   item.type === 'fitness' ? '🏃 Fitness' : '📋 General'}
                </span>
                <span className="small fw-semibold text-dark">{item.task}</span>
                <span className="text-muted small" style={{ fontSize: '11px' }}>
                  <i className="fa fa-clock ms-2 me-1"></i>by {item.targetTime}
                </span>
              </div>
              <button 
                type="button" 
                className="btn btn-link text-danger p-0 m-0"
                onClick={() => handleRemoveTask(index)}
                title="Remove task"
              >
                <i className="fa fa-times-circle fs-5"></i>
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default DietPlanBuilder;
