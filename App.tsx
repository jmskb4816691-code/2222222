
import React, { useState, useEffect } from 'react';
import { User, Task, Role, Priority, TaskStatus, AppNotification, TaskFeedback } from './types';
import { TaskCard } from './components/TaskCard';
import { TaskDetailModal } from './components/TaskDetailModal';
import { Toast } from './components/Toast';
import { refineTaskDescription } from './services/geminiService';
import { 
  LayoutDashboard, 
  Plus, 
  LogOut, 
  Users, 
  Bell, 
  Sparkles, 
  Filter,
  UserPlus,
  Briefcase,
  Trash2,
  Lock,
  ChevronLeft,
  AlertTriangle
} from 'lucide-react';

// --- Mock Data (Initial State) ---
const INITIAL_USERS: User[] = [
  { id: 'u1', name: '管理员 (Admin)', role: Role.ADMIN, avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Admin', password: 'admin' },
  { id: 'u2', name: '李明 (员工)', role: Role.EMPLOYEE, avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=LiMing', password: '123' },
];

const INITIAL_TASKS: Task[] = [
  {
    id: 't1',
    title: '组装 402 号单元',
    description: '完成发动机缸体的最终组装并验证扭矩规格。需要检查以下几点：\n1. 螺栓扭矩是否达标\n2. 密封圈是否完好\n3. 表面无划痕',
    priority: Priority.HIGH,
    assignedToId: 'u2',
    createdBy: 'u1',
    dueDate: '2023-11-20',
    status: TaskStatus.IN_PROGRESS,
    createdAt: Date.now(),
    feedback: []
  },
];

// --- Main Component ---
export default function App() {
  // State initialization with LocalStorage check
  const [users, setUsers] = useState<User[]>(() => {
    const saved = localStorage.getItem('prodtask_users');
    let loadedUsers: User[] = saved ? JSON.parse(saved) : INITIAL_USERS;
    return loadedUsers.map(u => ({...u, password: u.password || '123456'}));
  });

  const [tasks, setTasks] = useState<Task[]>(() => {
    const saved = localStorage.getItem('prodtask_tasks');
    return saved ? JSON.parse(saved) : INITIAL_TASKS;
  });

  const [notifications, setNotifications] = useState<AppNotification[]>(() => {
    const saved = localStorage.getItem('prodtask_notifications');
    return saved ? JSON.parse(saved) : [];
  });

  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [view, setView] = useState<'dashboard' | 'create_task' | 'manage_team'>('dashboard');
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [userToDelete, setUserToDelete] = useState<string | null>(null);
  const [taskToDelete, setTaskToDelete] = useState<string | null>(null);
  
  // Notification Center
  const [showNotifications, setShowNotifications] = useState(false);
  
  // Login State
  const [loginStep, setLoginStep] = useState<'user_select' | 'password'>('user_select');
  const [selectedLoginUser, setSelectedLoginUser] = useState<User | null>(null);
  const [loginPassword, setLoginPassword] = useState('');

  // Create Task Form State
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskDesc, setNewTaskDesc] = useState('');
  const [newTaskPriority, setNewTaskPriority] = useState<Priority>(Priority.MEDIUM);
  const [newTaskAssignee, setNewTaskAssignee] = useState<string>('');
  const [newTaskDue, setNewTaskDue] = useState('');
  const [isGeneratingAI, setIsGeneratingAI] = useState(false);

  // Add User Form State
  const [newUserName, setNewUserName] = useState('');
  const [newUserPassword, setNewUserPassword] = useState('');

  // Handlers defined before use
  const initiateLogin = (user: User) => {
    setSelectedLoginUser(user);
    setLoginStep('password');
    setLoginPassword('');
  };

  // Persist data
  useEffect(() => { localStorage.setItem('prodtask_users', JSON.stringify(users)); }, [users]);
  useEffect(() => { localStorage.setItem('prodtask_tasks', JSON.stringify(tasks)); }, [tasks]);
  useEffect(() => { localStorage.setItem('prodtask_notifications', JSON.stringify(notifications)); }, [notifications]);

  // Sync selected task if tasks change (to update feedback in modal in real-time)
  useEffect(() => {
    if (selectedTask) {
      const updated = tasks.find(t => t.id === selectedTask.id);
      if (updated) setSelectedTask(updated);
    }
  }, [tasks]);

  // Derived State
  const employees = users.filter(u => u.role === Role.EMPLOYEE);
  
  useEffect(() => {
    if (employees.length > 0) {
      if (!newTaskAssignee || !employees.find(e => e.id === newTaskAssignee)) {
        setNewTaskAssignee(employees[0].id);
      }
    } else {
      setNewTaskAssignee('');
    }
  }, [employees, newTaskAssignee]);

  const filteredTasks = tasks.filter(t => {
    if (!currentUser) return false;
    if (currentUser.role === Role.ADMIN) return true; // Admin sees all
    return t.assignedToId === currentUser.id; // Employee sees own
  });

  const completedCount = filteredTasks.filter(t => t.status === TaskStatus.COMPLETED).length;
  const pendingCount = filteredTasks.filter(t => t.status !== TaskStatus.COMPLETED).length;

  // Filter notifications for current user
  const myNotifications = notifications
    .filter(n => currentUser && n.userId === currentUser.id)
    .sort((a, b) => b.timestamp - a.timestamp);
  
  const unreadCount = myNotifications.filter(n => !n.read).length;

  // --- Handlers ---

  const showToast = (msg: string) => {
    setToastMsg(msg);
  };

  // Browser Notification helper
  const triggerBrowserNotification = (title: string, body: string) => {
    if (!('Notification' in window)) return;
    
    if (Notification.permission === 'granted') {
      new Notification(title, { body, icon: '/icon-192.png' });
    } else if (Notification.permission !== 'denied') {
      Notification.requestPermission().then(permission => {
        if (permission === 'granted') {
          new Notification(title, { body, icon: '/icon-192.png' });
        }
      });
    }
  };

  const handleLoginSubmit = () => {
    if (!selectedLoginUser) return;
    if (loginPassword === selectedLoginUser.password) {
      setCurrentUser(selectedLoginUser);
      setView('dashboard');
      showToast(`欢迎回来, ${selectedLoginUser.name}`);
      setLoginStep('user_select');
      setLoginPassword('');
      setSelectedLoginUser(null);
      
      // Request notification permission on login
      if ('Notification' in window && Notification.permission === 'default') {
        Notification.requestPermission();
      }
    } else {
      showToast("密码错误，请重试");
    }
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setView('dashboard');
    setLoginStep('user_select');
  };

  const handleStatusChange = (taskId: string, newStatus: TaskStatus) => {
    setTasks(prev => prev.map(t => t.id === taskId ? { ...t, status: newStatus } : t));
    const statusText = newStatus === TaskStatus.COMPLETED ? '已完成' : '处理中';
    
    showToast(`任务标记为: ${statusText}`);

    // If task is completed by employee, maybe notify admin? (Optional enhancement)
    if (newStatus === TaskStatus.COMPLETED && currentUser?.role === Role.EMPLOYEE) {
        const task = tasks.find(t => t.id === taskId);
        if (task) {
             const admin = users.find(u => u.id === task.createdBy);
             if (admin) {
                 const notif: AppNotification = {
                     id: Date.now().toString(),
                     userId: admin.id,
                     message: `员工 ${currentUser.name} 完成了任务: ${task.title}`,
                     taskId: taskId,
                     timestamp: Date.now(),
                     read: false
                 };
                 setNotifications(prev => [notif, ...prev]);
             }
        }
    }
  };

  const handleAddFeedback = (taskId: string, content: string) => {
    if (!currentUser) return;

    const newFeedback: TaskFeedback = {
      id: Math.random().toString(36).substr(2, 9),
      userId: currentUser.id,
      userName: currentUser.name,
      content,
      timestamp: Date.now()
    };

    setTasks(prev => prev.map(t => {
      if (t.id === taskId) {
        return { ...t, feedback: [...(t.feedback || []), newFeedback] };
      }
      return t;
    }));

    showToast('反馈已发送');

    // Notify the other party
    const task = tasks.find(t => t.id === taskId);
    if (task) {
      let notifyUserId = '';
      let notifMessage = '';

      if (currentUser.role === Role.EMPLOYEE) {
        // Employee replying -> Notify Admin
        notifyUserId = task.createdBy;
        notifMessage = `员工 ${currentUser.name} 对任务 "${task.title}" 进行了反馈`;
      } else {
        // Admin replying -> Notify Employee
        notifyUserId = task.assignedToId;
        notifMessage = `管理员对任务 "${task.title}" 进行了回复`;
      }

      if (notifyUserId) {
        const notif: AppNotification = {
          id: Date.now().toString(),
          userId: notifyUserId,
          message: notifMessage,
          taskId: taskId,
          timestamp: Date.now(),
          read: false
        };
        setNotifications(prev => [notif, ...prev]);
      }
    }
  };

  const handleAiRefine = async () => {
    if (!newTaskTitle) {
      showToast("请先输入任务标题");
      return;
    }
    setIsGeneratingAI(true);
    const refined = await refineTaskDescription(newTaskTitle + (newTaskDesc ? ` 详情: ${newTaskDesc}` : ''));
    setNewTaskDesc(refined);
    setIsGeneratingAI(false);
  };

  const handleCreateTask = () => {
    if (!newTaskTitle || !newTaskAssignee || !newTaskDue) {
      showToast("请填写所有必填项");
      return;
    }

    const taskId = Math.random().toString(36).substr(2, 9);
    const newTask: Task = {
      id: taskId,
      title: newTaskTitle,
      description: newTaskDesc,
      priority: newTaskPriority,
      assignedToId: newTaskAssignee,
      createdBy: currentUser!.id,
      dueDate: newTaskDue,
      status: TaskStatus.PENDING,
      createdAt: Date.now(),
      feedback: []
    };

    setTasks(prev => [newTask, ...prev]);
    
    // Create Notification for Assignee
    const notif: AppNotification = {
        id: Date.now().toString(),
        userId: newTaskAssignee,
        message: `新任务分配: ${newTaskTitle}`,
        taskId: taskId,
        timestamp: Date.now(),
        read: false
    };
    setNotifications(prev => [notif, ...prev]);

    // Attempt to trigger browser notification
    showToast("任务发布成功");
    setView('dashboard');
    setNewTaskTitle('');
    setNewTaskDesc('');
    setNewTaskPriority(Priority.MEDIUM);
  };

  // Delete Task Logic
  const promptDeleteTask = (taskId: string) => {
    setTaskToDelete(taskId);
  };

  const confirmDeleteTask = () => {
    if (taskToDelete) {
      setTasks(prev => prev.filter(t => t.id !== taskToDelete));
      setNotifications(prev => prev.filter(n => n.taskId !== taskToDelete)); // Clean up notifs
      showToast('任务已删除');
      setTaskToDelete(null);
      setSelectedTask(null); // Close modal if open
    }
  };

  const handleCreateUser = () => {
    if (!newUserName.trim() || !newUserPassword.trim()) {
      showToast("请输入员工姓名和密码");
      return;
    }

    const newUser: User = {
      id: Math.random().toString(36).substr(2, 9),
      name: newUserName,
      role: Role.EMPLOYEE,
      avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${newUserName + Math.random()}`,
      password: newUserPassword
    };

    setUsers(prev => [...prev, newUser]);
    setNewUserName('');
    setNewUserPassword('');
    showToast(`员工 "${newUser.name}" 已添加`);
  };

  const promptDeleteUser = (userId: string) => {
    setUserToDelete(userId);
  };

  const confirmDeleteUser = () => {
    if (userToDelete) {
      setUsers(prev => prev.filter(u => u.id !== userToDelete));
      showToast('员工账号已删除');
      setUserToDelete(null);
    }
  };

  const markNotificationsRead = () => {
    if (!currentUser) return;
    setNotifications(prev => prev.map(n => n.userId === currentUser.id ? { ...n, read: true } : n));
  };
  
  // Check for new notifications on mount/update to trigger browser notification if app is open
  useEffect(() => {
    if (!currentUser) return;
    const latest = myNotifications[0];
    if (latest && !latest.read && Date.now() - latest.timestamp < 5000) {
        // Only notify if created less than 5 seconds ago (to avoid notifying on every refresh)
        triggerBrowserNotification("新消息", latest.message);
    }
  }, [notifications, currentUser]);

  // --- Render ---

  if (!currentUser) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 transition-colors">
        <Toast message={toastMsg || ''} isVisible={!!toastMsg} onClose={() => setToastMsg(null)} />
        
        <div className="w-full max-w-md text-center mb-10">
          <div className="bg-blue-600 w-16 h-16 rounded-2xl mx-auto mb-4 flex items-center justify-center shadow-lg shadow-blue-500/20">
            <LayoutDashboard className="text-white" size={32} />
          </div>
          <h1 className="text-3xl font-bold text-slate-900 mb-2">生产任务管理</h1>
          <p className="text-slate-500">高效管理生产流程与团队协作</p>
        </div>

        {loginStep === 'user_select' ? (
          <div className="w-full max-w-md space-y-4 animate-fadeIn">
            <p className="text-slate-500 text-sm font-medium uppercase tracking-wider mb-2 text-center">选择账号登录</p>
            <div className="max-h-[400px] overflow-y-auto space-y-3 pr-2 custom-scrollbar">
              {users.map(user => (
                <button
                  key={user.id}
                  onClick={() => initiateLogin(user)}
                  className="w-full bg-white hover:bg-slate-50 text-slate-900 p-4 rounded-xl flex items-center gap-4 transition-all border border-slate-200 shadow-sm hover:shadow-md group"
                >
                  <img src={user.avatar} alt={user.name} className="w-12 h-12 rounded-full border-2 border-slate-200 group-hover:border-blue-500 transition-colors" />
                  <div className="text-left flex-1">
                    <div className="font-bold text-lg">{user.name}</div>
                    <div className="text-sm text-slate-500 text-xs px-2 py-0.5 bg-slate-100 rounded inline-block mt-1">
                      {user.role === Role.ADMIN ? '管理员' : '员工'}
                    </div>
                  </div>
                  <div className="text-slate-400 group-hover:text-slate-600">
                    <ChevronLeft className="rotate-180" />
                  </div>
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="w-full max-w-md space-y-6 animate-slideUp">
             <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xl">
                <div className="flex items-center gap-4 mb-6">
                   <button onClick={() => { setLoginStep('user_select'); }} className="text-slate-400 hover:text-slate-600">
                      <ChevronLeft />
                   </button>
                   <div className="flex items-center gap-3">
                      <img src={selectedLoginUser?.avatar} className="w-10 h-10 rounded-full bg-slate-100 border border-slate-200" />
                      <span className="text-slate-800 font-bold text-lg">{selectedLoginUser?.name}</span>
                   </div>
                </div>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-600 mb-1">请输入密码</label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-3.5 text-slate-400" size={18} />
                      <input 
                        type="password" 
                        autoFocus
                        className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:border-blue-500 focus:bg-white transition-all"
                        placeholder="请输入密码..."
                        value={loginPassword}
                        onChange={e => setLoginPassword(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && handleLoginSubmit()}
                      />
                    </div>
                  </div>
                  <button 
                    onClick={handleLoginSubmit}
                    className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-3.5 rounded-xl transition-all shadow-lg shadow-blue-200"
                  >
                    登录
                  </button>
                </div>
             </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-24 bg-slate-50 font-sans text-slate-900">
      <Toast message={toastMsg || ''} isVisible={!!toastMsg} onClose={() => setToastMsg(null)} />
      
      {/* Confirmation Modal (Generic for User and Task) */}
      {(userToDelete || taskToDelete) && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-6 bg-black/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white w-full max-w-sm rounded-2xl shadow-2xl p-6 animate-scaleIn">
            <div className="flex flex-col items-center text-center">
              <div className="bg-red-100 p-3 rounded-full mb-4">
                <AlertTriangle className="text-red-600" size={32} />
              </div>
              <h3 className="text-xl font-bold text-slate-800 mb-2">确认删除?</h3>
              <p className="text-slate-500 mb-6">
                {taskToDelete ? "确定要删除此任务吗？此操作无法撤销。" : "确定要删除该员工账号吗？"}
              </p>
              <div className="flex gap-3 w-full">
                <button 
                  onClick={() => { setUserToDelete(null); setTaskToDelete(null); }}
                  className="flex-1 bg-slate-100 text-slate-700 py-3 rounded-xl font-bold hover:bg-slate-200 transition-colors"
                >
                  取消
                </button>
                <button 
                  onClick={() => taskToDelete ? confirmDeleteTask() : confirmDeleteUser()}
                  className="flex-1 bg-red-600 text-white py-3 rounded-xl font-bold hover:bg-red-700 shadow-lg shadow-red-200 transition-colors"
                >
                  确认删除
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Task Detail Modal */}
      {selectedTask && (
        <TaskDetailModal 
          task={selectedTask}
          assignee={users.find(u => u.id === selectedTask.assignedToId)}
          currentUserRole={currentUser.role}
          onClose={() => { setSelectedTask(null); }}
          onStatusChange={handleStatusChange}
          onDelete={currentUser.role === Role.ADMIN ? promptDeleteTask : undefined}
          onAddFeedback={handleAddFeedback}
        />
      )}
      
      {/* Notifications Modal/Dropdown */}
      {showNotifications && (
        <div className="fixed inset-0 z-40 bg-black/20 backdrop-blur-sm" onClick={() => setShowNotifications(false)}>
           <div 
             className="absolute top-16 right-4 w-80 bg-white rounded-2xl shadow-xl overflow-hidden animate-scaleIn origin-top-right"
             onClick={e => e.stopPropagation()}
           >
              <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                  <h3 className="font-bold text-slate-800">通知中心</h3>
                  {unreadCount > 0 && (
                      <button onClick={() => { markNotificationsRead(); }} className="text-xs text-blue-600 font-medium">
                        全部已读
                      </button>
                  )}
              </div>
              <div className="max-h-[300px] overflow-y-auto">
                 {myNotifications.length === 0 ? (
                     <div className="p-8 text-center text-slate-400 text-sm">暂无新通知</div>
                 ) : (
                     myNotifications.map(n => (
                         <div key={n.id} className={`p-4 border-b border-slate-50 hover:bg-slate-50 ${!n.read ? 'bg-blue-50/50' : ''}`}>
                             <p className="text-sm text-slate-800 mb-1">{n.message}</p>
                             <p className="text-xs text-slate-400">{new Date(n.timestamp).toLocaleTimeString()}</p>
                         </div>
                     ))
                 )}
              </div>
           </div>
        </div>
      )}

      {/* Header */}
      <header className="bg-white px-6 py-4 sticky top-0 z-30 shadow-sm border-b border-slate-100 flex justify-between items-center">
        <div>
          <h1 className="text-xl font-bold text-slate-800">
            {view === 'create_task' ? '发布新任务' : view === 'manage_team' ? '团队管理' : '工作台'}
          </h1>
          <p className="text-xs text-slate-500">
            {currentUser.name} · {currentUser.role === Role.ADMIN ? '管理员视图' : '员工视图'}
          </p>
        </div>
        <div className="flex gap-3">
          <button 
            onClick={() => { setShowNotifications(!showNotifications); if(unreadCount > 0) markNotificationsRead(); }}
            className="relative p-2 text-slate-600 hover:bg-slate-50 rounded-full transition-colors"
          >
            <Bell size={20} />
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white animate-pulse"></span>
            )}
          </button>
          <button onClick={handleLogout} className="p-2 text-slate-600 hover:bg-slate-50 rounded-full">
            <LogOut size={20} />
          </button>
        </div>
      </header>

      {/* Dashboard View */}
      {view === 'dashboard' && (
        <main className="p-4 max-w-lg mx-auto animate-fadeIn">
          {/* Stats Cards */}
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="bg-blue-600 text-white p-4 rounded-2xl shadow-lg shadow-blue-200">
              <p className="text-blue-100 text-xs font-medium uppercase">待处理任务</p>
              <p className="text-3xl font-bold">{pendingCount}</p>
            </div>
            <div className="bg-white text-slate-800 p-4 rounded-2xl border border-slate-200 shadow-sm">
              <p className="text-slate-400 text-xs font-medium uppercase">已完成任务</p>
              <p className="text-3xl font-bold">{completedCount}</p>
            </div>
          </div>

          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-slate-800">任务列表</h2>
            <button className="text-blue-600 text-sm font-medium flex items-center gap-1">
              <Filter size={14} /> 筛选
            </button>
          </div>

          <div className="space-y-3">
            {filteredTasks.length === 0 ? (
              <div className="text-center py-10 text-slate-400 bg-white rounded-xl border border-dashed border-slate-200">
                <Sparkles className="mx-auto mb-2 opacity-50" />
                <p>暂无任务</p>
                {currentUser.role === Role.ADMIN && (
                  <p className="text-xs mt-1">点击右下角按钮发布任务</p>
                )}
              </div>
            ) : (
              filteredTasks.map(task => (
                <TaskCard 
                  key={task.id} 
                  task={task} 
                  assignee={users.find(u => u.id === task.assignedToId)}
                  currentUserRole={currentUser.role}
                  onStatusChange={handleStatusChange}
                  onClick={(t) => { setSelectedTask(t); }}
                  onDelete={currentUser.role === Role.ADMIN ? promptDeleteTask : undefined}
                />
              ))
            )}
          </div>
        </main>
      )}

      {/* Manage Team View (Admin Only) */}
      {view === 'manage_team' && currentUser.role === Role.ADMIN && (
        <main className="p-4 max-w-lg mx-auto animate-fadeIn space-y-6">
           {/* Add User Form */}
           <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
              <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
                <UserPlus size={20} className="text-blue-600"/>
                添加新员工账号
              </h3>
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">员工姓名</label>
                  <input 
                    type="text" 
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="输入姓名..."
                    value={newUserName}
                    onChange={e => setNewUserName(e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">设置登录密码</label>
                  <input 
                    type="text" 
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="输入密码..."
                    value={newUserPassword}
                    onChange={e => setNewUserPassword(e.target.value)}
                  />
                </div>
                <button 
                  onClick={handleCreateUser}
                  className="w-full bg-slate-900 text-white py-3 rounded-xl font-medium hover:bg-slate-800 transition-colors mt-2"
                >
                  确认添加
                </button>
              </div>
           </div>

           {/* User List */}
           <div>
              <h3 className="font-bold text-slate-800 mb-3 px-1">现有团队成员</h3>
              <div className="space-y-3">
                {users.map(user => (
                  <div key={user.id} className="bg-white p-3 rounded-xl border border-slate-100 flex items-center justify-between">
                     <div className="flex items-center gap-3">
                        <img src={user.avatar} className="w-10 h-10 rounded-full bg-slate-100" />
                        <div>
                          <p className="font-bold text-slate-800">{user.name}</p>
                          <p className="text-xs text-slate-500">
                             {user.role === Role.ADMIN ? '管理员' : '普通员工'} • 密码: {user.password}
                          </p>
                        </div>
                     </div>
                     
                     <div className="flex items-center gap-2">
                        <span className="text-xs bg-slate-100 px-2 py-1 rounded text-slate-500">ID: {user.id}</span>
                        {user.role === Role.EMPLOYEE && (
                            <button 
                                onClick={() => promptDeleteUser(user.id)}
                                className="p-2 bg-red-50 text-red-500 rounded-lg hover:bg-red-100 transition-colors"
                                title="删除员工"
                            >
                                <Trash2 size={16} />
                            </button>
                        )}
                     </div>
                  </div>
                ))}
              </div>
           </div>
        </main>
      )}

      {/* Create Task View (Admin Only) */}
      {view === 'create_task' && (
        <main className="p-4 max-w-lg mx-auto space-y-4 animate-fadeIn">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 space-y-4">
            
            {/* Title */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">任务标题</label>
              <input 
                type="text" 
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="例如：检查传送带"
                value={newTaskTitle}
                onChange={e => setNewTaskTitle(e.target.value)}
              />
            </div>

            {/* Description + AI */}
            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="block text-sm font-medium text-slate-700">任务详情</label>
                <button 
                  onClick={handleAiRefine}
                  disabled={isGeneratingAI}
                  className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded-full flex items-center gap-1 hover:bg-purple-200 disabled:opacity-50"
                >
                  <Sparkles size={12} />
                  {isGeneratingAI ? 'AI生成中...' : 'AI 智能完善'}
                </button>
              </div>
              <textarea 
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[100px]"
                placeholder="输入简单的描述，AI可以帮您完善..."
                value={newTaskDesc}
                onChange={e => setNewTaskDesc(e.target.value)}
              />
            </div>

            {/* Meta Row */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">指派给</label>
                <select 
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl"
                  value={newTaskAssignee}
                  onChange={e => setNewTaskAssignee(e.target.value)}
                >
                  {employees.length === 0 && <option value="">无员工可选</option>}
                  {employees.map(e => (
                    <option key={e.id} value={e.id}>{e.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">优先级</label>
                <select 
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl"
                  value={newTaskPriority}
                  onChange={e => setNewTaskPriority(e.target.value as Priority)}
                >
                  <option value={Priority.HIGH}>高优先级</option>
                  <option value={Priority.MEDIUM}>中优先级</option>
                  <option value={Priority.LOW}>低优先级</option>
                </select>
              </div>
            </div>

            {/* Date */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">截止日期</label>
              <input 
                type="date" 
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl"
                value={newTaskDue}
                onChange={e => setNewTaskDue(e.target.value)}
              />
            </div>

            <button 
              onClick={handleCreateTask}
              className="w-full bg-blue-600 text-white py-4 rounded-xl font-bold text-lg hover:bg-blue-700 shadow-lg shadow-blue-200 mt-4"
            >
              发布任务
            </button>
             <button 
              onClick={() => { setView('dashboard'); }}
              className="w-full bg-transparent text-slate-500 py-2 rounded-xl font-medium"
            >
              取消
            </button>
          </div>
        </main>
      )}

      {/* Floating Action Button (Only for Admin) */}
      {currentUser.role === Role.ADMIN && view === 'dashboard' && (
        <button
          onClick={() => { setView('create_task'); }}
          className="fixed bottom-24 right-6 bg-blue-600 text-white w-14 h-14 rounded-full shadow-xl shadow-blue-400/50 flex items-center justify-center transition-transform hover:scale-110 active:scale-95 z-40"
        >
          <Plus size={28} />
        </button>
      )}

      {/* Bottom Nav */}
      <div className="fixed bottom-0 w-full bg-white border-t border-slate-200 py-3 px-6 flex justify-around items-center z-20 text-slate-400 pb-safe">
          <button 
            className={`flex flex-col items-center gap-1 w-16 ${view === 'dashboard' || view === 'create_task' ? 'text-blue-600' : ''}`} 
            onClick={() => { setView('dashboard'); }}
          >
            <LayoutDashboard size={24} />
            <span className="text-[10px] font-medium">任务</span>
          </button>
          
          {currentUser.role === Role.ADMIN && (
            <button 
              className={`flex flex-col items-center gap-1 w-16 ${view === 'manage_team' ? 'text-blue-600' : ''}`}
              onClick={() => { setView('manage_team'); }}
            >
               <Users size={24} />
               <span className="text-[10px] font-medium">团队管理</span>
            </button>
          )}
      </div>
    </div>
  );
}
