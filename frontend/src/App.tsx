import React, { useState, useEffect } from 'react';
import { CreateCourse } from './components/courses';
import Login from './components/Login';
import Register from './components/Register';
import StudentList from './components/TeacherDashboard';
import StudentGrades from './components/StudentDashboard';

interface User {
  id: number;
  username: string;
  role: string;
}

interface Course {
  id: number;
  title: string;
  description: string;
  teacher_id: number;
  teacher_name: string;
  enrolled?: boolean;
}

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<string>('login');
  const [user, setUser] = useState<User | null>(null);
  const [courses, setCourses] = useState<Course[]>([]);
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showConfirmDialog, setShowConfirmDialog] = useState<number | null>(null);
  const [enrollingCourse, setEnrollingCourse] = useState(false);

  useEffect(() => {
    const initializeSession = async () => {
      const token = localStorage.getItem('token');
      if (token) {
        try {
          const response = await fetch(`/api/courses`, {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          });

          if (response.ok) {
            const userData = JSON.parse(atob(token.split('.')[1]));
            setUser(userData);
            setCurrentView('dashboard');
            const coursesData = await response.json();
            setCourses(Array.isArray(coursesData) ? coursesData : []);
          } else {
            localStorage.removeItem('token');
            setCurrentView('login');
          }
        } catch (error) {
          console.error('Session initialization error:', error);
          localStorage.removeItem('token');
          setCurrentView('login');
        }
      }
      setIsLoading(false);
    };

    initializeSession();
  }, []);

  const fetchCourses = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const token = localStorage.getItem('token');

      const response = await fetch(`/api/courses`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) throw new Error('Failed to fetch courses');

      const data = await response.json();
      setCourses(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error fetching courses:', error);
      setError('Failed to load courses');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (user) fetchCourses();
  }, [user]);

  const handleLogin = async (credentials: { username: string; password: string }) => {
    try {
      const response = await fetch(`/api/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(credentials),
      });

      const data = await response.json();

      if (response.ok) {
        localStorage.setItem('token', data.token);
        const userData = JSON.parse(atob(data.token.split('.')[1]));
        setUser(userData);
        setCurrentView('dashboard');
      } else {
        alert(data.message || 'Login failed');
      }
    } catch (error) {
      console.error('Login error:', error);
      alert('Login failed');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    setUser(null);
    setCurrentView('login');
    setCourses([]);
    setSelectedCourse(null);
  };

  const handleCourseSelect = (course: Course) => {
    setSelectedCourse(course);
    setCurrentView(user?.role === 'teacher' ? 'teacherCourse' : 'studentCourse');
  };

  const handleEnrollConfirm = async (courseId: number) => {
    try {
      setEnrollingCourse(true);

      const response = await fetch(`/api/enroll`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ course_id: courseId })
      });

      if (response.ok) {
        alert('Successfully enrolled!');
        fetchCourses();
      } else {
        const data = await response.json();
        alert(data.message || 'Failed to enroll');
      }
    } catch (error) {
      console.error('Enroll error:', error);
      alert('Failed to enroll');
    } finally {
      setEnrollingCourse(false);
      setShowConfirmDialog(null);
    }
  };

  const renderDashboardContent = () => {
    return (
      <div className="container mx-auto p-4">
        {user?.role === 'teacher' && <CreateCourse onCourseCreated={fetchCourses} />}
        <h2 className="text-2xl font-bold mb-4">Courses</h2>
        {courses.map(course => (
          <div key={course.id}>{course.title}</div>
        ))}
      </div>
    );
  };

  const renderContent = () => {
    switch (currentView) {
      case 'login':
        return <Login onLogin={handleLogin} onSwitchToRegister={() => setCurrentView('register')} />;
      case 'register':
        return <Register onRegister={() => setCurrentView('login')} onSwitchToLogin={() => setCurrentView('login')} />;
      default:
        return renderDashboardContent();
    }
  };

  return (
    <div className="min-h-screen bg-gray-100">
      {renderContent()}
    </div>
  );
};

export default App;
