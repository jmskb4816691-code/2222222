
import React, { useState, useRef, useEffect } from 'react';
import { Task, User, Priority, TaskStatus, Role } from '../types';
import { X, Clock, User as UserIcon, CheckCircle, AlertCircle, Trash2, MessageSquare, Send } from 'lucide-react';

interface TaskDetailModalProps {
  task: Task;
  assignee?: User;
  currentUserRole: Role;
  onClose: () => void;
  onStatusChange: (taskId: string, newStatus: TaskStatus) => void;
  onDelete?: (taskId: string) => void;
  onAddFeedback: (taskId: string, content: string) => void;
}

export const TaskDetailModal: React.FC<TaskDetailModalProps> = ({ 
  task, 
  assignee, 
  currentUserRole, 
  onClose,
  onStatusChange,
  onDelete,
  onAddFeedback
}) => {
  const [feedbackInput, setFeedbackInput] = useState('');
  const feedbackListRef = useRef<HTMLDivElement>(null);

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

  const handleSendFeedback = () => {
    if (!feedbackInput.trim()) return;
    onAddFeedback(task.id, feedbackInput);
    setFeedbackInput('');
  };

  // Scroll to bottom of feedback list on load/update
  useEffect(() => {
    if (feedbackListRef.current) {
      feedbackListRef.current.scrollTop = feedbackListRef.current.scrollHeight;
    }
  }, [task.feedback]);

  const pInfo = getPriorityInfo(task.priority);
  const sInfo = getStatusInfo(task.status);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn" onClick={onClose}>
      <div 
        className="bg-white w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-slideUp"
        onClick={e => e.stopPropagation()}
      >
         {/* Header */}
         <div className="p-5 border-b border-slate-100 flex justify-between items-start bg-slate-50/50">
            <div>
                <h2 className="text-xl font-bold text-slate-900 leading-tight mb-2">{task.title}</h2>
                <div className="flex gap-2">
                    <span className={`text-xs font-bold px-2 py-1 rounded-full border ${pInfo.class}`}>
                    {pInfo.label}
                    </span>
                    <span className={`text-xs font-medium px-2 py-1 rounded-full ${sInfo.class}`}>
                    {sInfo.label}
                    </span>
                </div>
            </div>
            <button onClick={() => { onClose(); }} className="p-2 bg-slate-100 hover:bg-slate-200 rounded-full transition-colors">
              <X size={20} className="text-slate-500" />
            </button>
         </div>
         
         {/* Body */}
         <div className="flex-1 overflow-y-auto custom-scrollbar p-6 bg-white">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1">
                <AlertCircle size={12} /> 任务详情
            </h3>
            <div className="text-slate-700 text-base leading-relaxed whitespace-pre-wrap mb-6 bg-slate-50 p-4 rounded-xl border border-slate-100">
              {task.description || "无详细描述"}
            </div>
            
            <div className="grid grid-cols-2 gap-4 mb-8">
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                    <div className="text-xs text-slate-400 mb-1 flex items-center gap-1"><Clock size={12}/> 截止日期</div>
                    <div className="font-medium text-slate-800">{new Date(task.dueDate).toLocaleDateString('zh-CN')}</div>
                </div>
                {assignee && (
                    <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                         <div className="text-xs text-slate-400 mb-1 flex items-center gap-1"><UserIcon size={12}/> 执行人</div>
                         <div className="font-medium text-slate-800 flex items-center gap-2">
                            <img src={assignee.avatar} className="w-5 h-5 rounded-full" alt="" />
                            {assignee.name}
                         </div>
                    </div>
                )}
            </div>

            {/* Feedback Section */}
            <div>
               <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-1">
                  <MessageSquare size={12} /> 反馈与沟通
               </h3>
               <div className="bg-slate-50 rounded-xl border border-slate-100 overflow-hidden">
                  <div ref={feedbackListRef} className="max-h-[200px] overflow-y-auto p-4 space-y-3">
                     {(!task.feedback || task.feedback.length === 0) ? (
                        <p className="text-sm text-slate-400 text-center py-4">暂无反馈记录</p>
                     ) : (
                        task.feedback.map(fb => (
                          <div key={fb.id} className="bg-white p-3 rounded-lg border border-slate-100 shadow-sm">
                             <div className="flex justify-between items-center mb-1">
                                <span className="font-bold text-xs text-slate-700">{fb.userName}</span>
                                <span className="text-[10px] text-slate-400">{new Date(fb.timestamp).toLocaleTimeString()}</span>
                             </div>
                             <p className="text-sm text-slate-800">{fb.content}</p>
                          </div>
                        ))
                     )}
                  </div>
                  <div className="border-t border-slate-200 p-2 flex gap-2 items-center bg-white">
                     <input 
                       type="text" 
                       value={feedbackInput}
                       onChange={e => setFeedbackInput(e.target.value)}
                       onKeyDown={e => e.key === 'Enter' && handleSendFeedback()}
                       className="flex-1 bg-slate-100 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                       placeholder="输入反馈信息..."
                     />
                     <button 
                       onClick={handleSendFeedback}
                       disabled={!feedbackInput.trim()}
                       className="p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                     >
                       <Send size={16} />
                     </button>
                  </div>
               </div>
            </div>
         </div>

         {/* Footer Actions */}
         <div className="p-4 border-t border-slate-100 bg-slate-50 flex gap-3 z-10">
             {currentUserRole === Role.EMPLOYEE && task.status !== TaskStatus.COMPLETED ? (
                <button
                    onClick={() => {
                        onStatusChange(task.id, TaskStatus.COMPLETED);
                        onClose();
                    }}
                    className="flex-1 bg-blue-600 text-white py-3 rounded-xl font-bold text-lg hover:bg-blue-700 flex items-center justify-center gap-2 shadow-lg shadow-blue-200 transition-transform active:scale-95"
                >
                    <CheckCircle size={20} /> 确认完成任务
                </button>
             ) : (
                 <>
                    {currentUserRole === Role.ADMIN && onDelete && (
                        <button
                            onClick={() => {
                                onDelete(task.id);
                            }}
                            className="px-4 bg-red-50 text-red-600 py-3 rounded-xl font-bold hover:bg-red-100 flex items-center gap-2"
                        >
                            <Trash2 size={20} /> 删除
                        </button>
                    )}
                    <button
                        onClick={() => { onClose(); }}
                        className="flex-1 bg-white border border-slate-200 text-slate-700 py-3 rounded-xl font-bold hover:bg-slate-50"
                    >
                        关闭
                    </button>
                 </>
             )}
         </div>
      </div>
    </div>
  );
};
