
import React from 'react';
import { Task, Priority, TaskStatus, User, Role } from '../types';
import { Clock, CheckCircle, User as UserIcon, Trash2, MessageSquare } from 'lucide-react';

interface TaskCardProps {
  task: Task;
  assignee?: User;
  currentUserRole: Role;
  onStatusChange: (taskId: string, newStatus: TaskStatus) => void;
  onClick: (task: Task) => void;
  onDelete?: (taskId: string) => void;
}

export const TaskCard: React.FC<TaskCardProps> = ({ 
  task, 
  assignee, 
  currentUserRole, 
  onStatusChange, 
  onClick,
  onDelete 
}) => {
  const getPriorityInfo = (p: Priority) => {
    switch (p) {
      case Priority.HIGH: return { label: '高优先级', class: 'bg-red-100 text-red-700 border-red-200' };
      case Priority.MEDIUM: return { label: '中优先级', class: 'bg-amber-100 text-amber-700 border-amber-200' };
      case Priority.LOW: return { label: '低优先级', class: 'bg-emerald-100 text-emerald-700 border-emerald-200' };
    }
  };

  const getStatusInfo = (s: TaskStatus) => {
    switch (s) {
      case TaskStatus.PENDING: return { label: '待处理', class: 'bg-slate-100 text-slate-600' };
      case TaskStatus.IN_PROGRESS: return { label: '进行中', class: 'bg-blue-100 text-blue-600' };
      case TaskStatus.COMPLETED: return { label: '已完成', class: 'bg-green-100 text-green-600' };
    }
  };

  const pInfo = getPriorityInfo(task.priority);
  const sInfo = getStatusInfo(task.status);
  const feedbackCount = task.feedback ? task.feedback.length : 0;

  return (
    <div 
      onClick={() => { onClick(task); }}
      className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 mb-3 transition-all active:scale-[0.98] cursor-pointer hover:shadow-md relative group"
    >
      <div className="flex justify-between items-start mb-2">
        <span className={`text-xs font-bold px-2 py-1 rounded-full border ${pInfo.class}`}>
          {pInfo.label}
        </span>
        <div className="flex items-center gap-2">
           <span className={`text-xs font-medium px-2 py-1 rounded-full ${sInfo.class}`}>
             {sInfo.label}
           </span>
           {currentUserRole === Role.ADMIN && onDelete && (
             <button 
                onClick={(e) => {
                   e.stopPropagation();
                   onDelete(task.id);
                }}
                className="p-1 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
             >
                <Trash2 size={16} />
             </button>
           )}
        </div>
      </div>

      <h3 className="text-lg font-bold text-slate-800 mb-1 leading-tight">{task.title}</h3>
      <p className="text-sm text-slate-500 mb-4 line-clamp-2">{task.description}</p>

      <div className="flex items-center justify-between text-xs text-slate-400 mb-4">
        <div className="flex gap-4">
          <div className="flex items-center gap-1">
            <Clock size={14} />
            <span>{new Date(task.dueDate).toLocaleDateString('zh-CN')}</span>
          </div>
          {assignee && (
            <div className="flex items-center gap-1">
              <UserIcon size={14} />
              <span>{assignee.name}</span>
            </div>
          )}
        </div>
        
        {feedbackCount > 0 && (
          <div className="flex items-center gap-1 text-blue-500 bg-blue-50 px-2 py-0.5 rounded-md">
            <MessageSquare size={12} />
            <span>{feedbackCount}</span>
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex gap-2">
        {currentUserRole === Role.EMPLOYEE && task.status !== TaskStatus.COMPLETED && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onStatusChange(task.id, TaskStatus.COMPLETED);
            }}
            className="flex-1 bg-blue-600 text-white py-2 rounded-lg font-medium text-sm hover:bg-blue-700 flex items-center justify-center gap-2"
          >
            <CheckCircle size={16} /> 完成任务
          </button>
        )}
        
        {currentUserRole === Role.ADMIN && (
             <div className="w-full bg-slate-50 text-slate-400 text-center py-2 text-xs rounded-lg border border-dashed border-slate-200">
                点击查看详情与反馈
             </div>
        )}
      </div>
    </div>
  );
};
