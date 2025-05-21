import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import '../styles/FacultyDashboard.css';
import API_BASE_URL from "../api"; 

const FacultyDashboard = () => {
  const [club, setClub] = useState(null);
  const [hasClub, setHasClub] = useState(true);
  const [events, setEvents] = useState([]);
  const [selectedEvent, setSelectedEvent] = useState('');
  const [students, setStudents] = useState([]);
  const [attendance, setAttendance] = useState({});
  const [eventForm, setEventForm] = useState({
    club: '',
    start_datetime: '',
    end_datetime: '',
    event_name: '',
    event_desc: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [selectedViewEvent, setSelectedViewEvent] = useState('');
  const [eventAttendance, setEventAttendance] = useState([]);
  const [selectedStudent, setSelectedStudent] = useState('');
  const [userAttendance, setUserAttendance] = useState([]);

  const fetchFacultyClub = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${API_BASE_URL}/api/auth/faculty-club`, {
        withCredentials: true,
      });
      if (response.data.hasClub) {
        setClub(response.data);
        setHasClub(true);
      } else {
        setHasClub(false);
        setClub(null);
      }
    } catch (err) {
      console.error('Error fetching faculty club:', err);
      setError(err.response?.data?.message || 'Failed to fetch club information');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFacultyClub();
  }, []);

  const fetchEvents = useCallback(async (clubIdToFetch) => {
    if (!clubIdToFetch || typeof clubIdToFetch !== 'string' || clubIdToFetch.trim() === '') {
      setError('Invalid club ID');
      setEvents([]);
      return;
    }
    setLoading(true);
    try {
      console.log('Fetching events for club:', clubIdToFetch);
      const response = await fetch(`${API_BASE_URL}/api/events/club/${clubIdToFetch}`);
      if (!response.ok) {
        const text = await response.text();
        throw new Error(`HTTP error ${response.status}: ${text}`);
      }
      const data = await response.json();
      setEvents(data);
      setError('');
    } catch (err) {
      setError(`Failed to fetch events: ${err.message}`);
      setEvents([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchStudents = useCallback(async (clubIdToFetch) => {
    if (!clubIdToFetch || typeof clubIdToFetch !== 'string' || clubIdToFetch.trim() === '') {
      setError('Invalid club ID');
      setStudents([]);
      return;
    }
    setLoading(true);
    try {
      console.log('Fetching students for club:', clubIdToFetch);
      const response = await fetch(`${API_BASE_URL}/api/allotment/club/${clubIdToFetch}`);
      if (!response.ok) {
        const text = await response.text();
        console.error('Fetch students error response:', text);
        throw new Error(`HTTP error ${response.status}: ${text}`);
      }
      const data = await response.json();
      console.log('Students data received:', data);
      const validStudents = data.filter(student => student.student_id && typeof student.student_id === 'string' && student.student_id.trim() !== '');
      if (validStudents.length !== data.length) {
        console.warn('Some students missing valid student_id:', data.filter(student => !student.student_id || student.student_id.trim() === ''));
      }
      console.log('Valid students:', validStudents);
      setStudents(validStudents);
      const initialAttendance = {};
      validStudents.forEach(student => {
        initialAttendance[student.student_id] = false;
      });
      setAttendance(initialAttendance);
      setError('');
    } catch (err) {
      setError(`Failed to fetch students: ${err.message}`);
      setStudents([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchEventAttendance = useCallback(async (eventId, clubId) => {
    if (!eventId || !clubId) {
      setError('Please select an event and club');
      setEventAttendance([]);
      return;
    }
    setLoading(true);
    try {
      console.log('Fetching attendance for event:', eventId, 'club:', clubId);
      const response = await fetch(`${API_BASE_URL}/api/attendance/event/${eventId}?clubId=${clubId}`);
      if (!response.ok) {
        const text = await response.text();
        throw new Error(`HTTP error ${response.status}: ${text}`);
      }
      const data = await response.json();
      setEventAttendance(data);
      toast.success('Event attendance fetched successfully!', {
        position: 'bottom-right',
        autoClose: 3000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        style: {
          background: '#28a745',
          color: '#fff',
          borderRadius: '8px',
        },
      });
    } catch (err) {
      setError(`Failed to fetch event attendance: ${err.message}`);
      setEventAttendance([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchUserAttendance = useCallback(async (studentId) => {
    if (!studentId || typeof studentId !== 'string' || studentId.trim() === '' || !club?.club_id) {
      setError('Please select a valid student and club');
      setUserAttendance([]);
      return;
    }
    setLoading(true);
    try {
      console.log('Fetching attendance for student:', studentId, 'club:', club.club_id);
      const response = await fetch(`${API_BASE_URL}/api/attendance/user/${studentId}?clubId=${club.club_id}`);
      if (!response.ok) {
        const text = await response.text();
        throw new Error(`HTTP error ${response.status}: ${text}`);
      }
      const data = await response.json();
      setUserAttendance(data);
      toast.success('Student attendance fetched successfully!', {
        position: 'bottom-right',
        autoClose: 3000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        style: {
          background: '#28a745',
          color: '#fff',
          borderRadius: '8px',
        },
      });
    } catch (err) {
      setError(`Failed to fetch student attendance: ${err.message}`);
      setUserAttendance([]);
    } finally {
      setLoading(false);
    }
  }, [club]);

  const handleAddEvent = async (e) => {
    e.preventDefault();
    if (!club?.club_id) {
      setError('Club information not loaded');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const response = await fetch(`${API_BASE_URL}/api/events/add`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ ...eventForm, club: club.club_id }),
      });
      if (!response.ok) {
        const text = await response.text();
        throw new Error(`HTTP error ${response.status}: ${text}`);
      }
      await fetchEvents(club.club_id);
      setEventForm({
        club: '',
        start_datetime: '',
        end_datetime: '',
        event_name: '',
        event_desc: '',
      });
      toast.success('Event added successfully!', {
        position: 'bottom-right',
        autoClose: 3000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        style: {
          background: '#28a745',
          color: '#fff',
          borderRadius: '8px',
        },
      });
    } catch (err) {
      setError(`Failed to add event: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAttendance = async (e) => {
    e.preventDefault();
    if (!selectedEvent) {
      setError('Please select an event');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const attendancePromises = students.map(async (student) => {
        const payload = {
          event_id: selectedEvent,
          student_id: student.student_id,
          attendance: attendance[student.student_id] ? 'Present' : 'Absent',
        };
        console.log('Sending attendance payload for', student.student_id, ':', payload);
        const response = await fetch(`${API_BASE_URL}/api/attendance/mark`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(payload),
        });
        if (!response.ok) {
          const text = await response.text();
          throw new Error(`Failed to mark attendance for ${student.student_id}: ${text}`);
        }
        return response.json();
      });

      const results = await Promise.allSettled(attendancePromises);
      const errors = results
        .filter(result => result.status === 'rejected')
        .map(result => result.reason.message);

      if (errors.length > 0) {
        setError(`Some attendance markings failed: ${errors.join('; ')}`);
      } else {
        setAttendance({});
        setSelectedEvent('');
        await fetchStudents(club?.club_id);
        toast.success('Attendance marked successfully!', {
          position: 'bottom-right',
          autoClose: 3000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
          style: {
            background: '#28a745',
            color: '#fff',
            borderRadius: '8px',
          },
        });
      }
    } catch (err) {
      setError(`Failed to mark attendance: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleAttendanceChange = (studentId) => {
    setAttendance(prev => ({
      ...prev,
      [studentId]: !prev[studentId],
    }));
  };

  const downloadEventAttendanceAsCSV = () => {
    if (!selectedViewEvent || eventAttendance.length === 0) {
      toast.error('No attendance data available to download!', {
        position: 'bottom-right',
        autoClose: 3000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        style: {
          background: '#dc3545',
          color: '#fff',
          borderRadius: '8px',
        },
      });
      return;
    }

    try {
      const escapeCSV = (value) => {
        if (value == null) return '';
        const str = String(value);
        if (str.includes(',') || str.includes('"') || str.includes('\n')) {
          return `"${str.replace(/"/g, '""')}"`;
        }
        return str;
      };

      const headers = ['Student ID', 'Student Name', 'Attendance'];
      const rows = eventAttendance.map(record => [
        escapeCSV(record.student_id),
        escapeCSV(record.student_name || 'Unknown'),
        escapeCSV(record.attendance),
      ]);
      const csvContent = [
        headers.join(','),
        ...rows.map(row => row.join(',')),
      ].join('\n');

      const selectedEventObj = events.find(event => event.event_id === selectedViewEvent);
      const eventName = selectedEventObj ? selectedEventObj.event_name.replace(/[^a-zA-Z0-9]/g, '_') : 'event';
      const fileName = `${eventName}_attendance.csv`;

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(link.href);

      toast.success('Attendance downloaded as CSV successfully!', {
        position: 'bottom-right',
        autoClose: 3000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        style: {
          background: '#28a745',
          color: '#fff',
          borderRadius: '8px',
        },
      });
    } catch (err) {
      console.error('Error generating CSV:', err);
      toast.error('Failed to download CSV: ' + err.message, {
        position: 'bottom-right',
        autoClose: 3000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        style: {
          background: '#dc3545',
          color: '#fff',
          borderRadius: '8px',
        },
      });
    }
  };

  // New function to download all students as CSV
  const downloadStudentsAsCSV = () => {
    if (!students || students.length === 0) {
      toast.error('No student data available to download!', {
        position: 'bottom-right',
        autoClose: 3000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        style: {
          background: '#dc3545',
          color: '#fff',
          borderRadius: '8px',
        },
      });
      return;
    }

    try {
      const escapeCSV = (value) => {
        if (value == null) return '';
        const str = String(value);
        if (str.includes(',') || str.includes('"') || str.includes('\n')) {
          return `"${str.replace(/"/g, '""')}"`;
        }
        return str;
      };

      // Define CSV headers based on available student data
      const headers = ['Student ID', 'Student Name'];
      const rows = students.map(student => [
        escapeCSV(student.student_id),
        escapeCSV(student.name || 'Unknown'),
      ]);
      const csvContent = [
        headers.join(','),
        ...rows.map(row => row.join(',')),
      ].join('\n');

      // Use club name for the file name
      const clubName = club ? club.club_name.replace(/[^a-zA-Z0-9]/g, '_') : 'club';
      const fileName = `${clubName}_students.csv`;

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(link.href);

      toast.success('Students list downloaded as CSV successfully!', {
        position: 'bottom-right',
        autoClose: 3000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        style: {
          background: '#28a745',
          color: '#fff',
          borderRadius: '8px',
        },
      });
    } catch (err) {
      console.error('Error generating students CSV:', err);
      toast.error('Failed to download students CSV: ' + err.message, {
        position: 'bottom-right',
        autoClose: 3000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        style: {
          background: '#dc3545',
          color: '#fff',
          borderRadius: '8px',
        },
      });
    }
  };

  useEffect(() => {
    if (club?.club_id) {
      fetchEvents(club.club_id);
      fetchStudents(club.club_id);
    } else {
      setEvents([]);
      setStudents([]);
      setAttendance({});
      setSelectedEvent('');
      setSelectedViewEvent('');
      setEventAttendance([]);
      setSelectedStudent('');
      setUserAttendance([]);
    }
  }, [club, fetchEvents, fetchStudents]);

  useEffect(() => {
    if (selectedStudent) {
      fetchUserAttendance(selectedStudent);
    } else {
      setUserAttendance([]);
    }
  }, [selectedStudent, fetchUserAttendance]);

  return (
    <div className="dashboard-container fade-in">
      <header className="dashboard-header">
        <span className="logo-text">Faculty Dashboard</span>
        <div className="header-right">
          <span className="admin-info">Faculty In-Charge</span>
        </div>
      </header>

      <h1 className="dashboard-title">Club Management Dashboard</h1>

      {loading && (
        <div className="loading-spinner">
          <div className="spinner"></div>
          <p>Loading...</p>
        </div>
      )}

      {error && (
        <div className="error-message">
          {error}
          <button
            className="retry-button"
            onClick={() => {
              setError('');
              window.location.reload();
            }}
          >
            Retry
          </button>
        </div>
      )}

      {!hasClub && !error && !loading ? (
        <div>
          <h2>Faculty Dashboard</h2>
          <p>No club assigned to you yet. Please contact the admin to assign a club.</p>
        </div>
      ) : club ? (
        <>
          <div className="input-container">
            <h2>Club: {club.club_name} ({club.club_id})</h2>
            {/* Add Download Students Button */}
            <button
              className="update-button"
              onClick={downloadStudentsAsCSV}
              disabled={loading || !students || students.length === 0}
              style={{ marginLeft: '10px' }}
            >
              Download Students as CSV
            </button>
          </div>

          <section className="club-status-section">
            <h2 className="section-title">Add New Event</h2>
            <form onSubmit={handleAddEvent} className="update-vacancy">
              <label>Event Name: </label>
              <input
                type="text"
                className="vacancy-input"
                placeholder="Eg: Robo Wars"
                value={eventForm.event_name}
                onChange={(e) => setEventForm({ ...eventForm, event_name: e.target.value })}
                required
              />
              <label>Event Description:</label>
              <input
                type="text"
                className="vacancy-input"
                placeholder="Eg: Robot building and clash contest"
                value={eventForm.event_desc}
                onChange={(e) => setEventForm({ ...eventForm, event_desc: e.target.value })}
              />
              <div className='daterow'>
                <div className='datetime-field'>
                  <label>Start Date & Time: </label>
                  <input
                    type="datetime-local"
                    className="vacancy-input"
                    value={eventForm.start_datetime}
                    onChange={(e) => setEventForm({ ...eventForm, start_datetime: e.target.value })}
                    required
                  />
                </div>
                <div className='datetime-field'>
                  <label>End Date & Time: </label>
                  <input
                    type="datetime-local"
                    className="vacancy-input"
                    value={eventForm.end_datetime}
                    onChange={(e) => setEventForm({ ...eventForm, end_datetime: e.target.value })}
                  />
                </div>
              </div>
              <button type="submit" className="update-button" disabled={loading}>
                Add Event
              </button>
            </form>
          </section>

          <section className="club-status-section">
            <h2 className="section-title">Mark Event Attendance</h2>
            <form onSubmit={handleMarkAttendance}>
              <select
                className="advisor-select"
                value={selectedEvent}
                onChange={(e) => setSelectedEvent(e.target.value)}
                required
              >
                <option value="">Select Event</option>
                {events.map(event => (
                  <option key={event.event_id} value={event.event_id}>
                    {event.event_name} ({new Date(event.start_datetime).toLocaleString()})
                  </option>
                ))}
              </select>
              <table className="summary-table">
                <thead>
                  <tr>
                    <th>Student ID</th>
                    <th>Student Name</th>
                    <th>Present</th>
                  </tr>
                </thead>
                <tbody>
                  {students.map(student => (
                    <tr key={student.student_id}>
                      <td>{student.student_id}</td>
                      <td>{student.name || 'Unknown'}</td>
                      <td>
                        <input
                          type="checkbox"
                          checked={attendance[student.student_id] || false}
                          onChange={() => handleAttendanceChange(student.student_id)}
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <button type="submit" className="update-button" disabled={loading || !selectedEvent}>
                Submit Attendance
              </button>
            </form>
          </section>

          <section className="club-status-section">
            <h2 className="section-title">View Event Attendance</h2>
            <select
              className="advisor-select"
              value={selectedViewEvent}
              onChange={(e) => {
                setSelectedViewEvent(e.target.value);
                if (e.target.value) {
                  fetchEventAttendance(e.target.value, club.club_id);
                } else {
                  setEventAttendance([]);
                }
              }}
              disabled={loading}
            >
              <option value="">Select Event</option>
              {events.map(event => (
                <option key={event.event_id} value={event.event_id}>
                  {event.event_name} ({new Date(event.start_datetime).toLocaleString()})
                </option>
              ))}
            </select>
            {eventAttendance.length > 0 ? (
              <>
                <table className="summary-table">
                  <thead>
                    <tr>
                      <th>Student ID</th>
                      <th>Student Name</th>
                      <th>Attendance</th>
                    </tr>
                  </thead>
                  <tbody>
                    {eventAttendance.map(record => (
                      <tr key={record.att_id}>
                        <td>{record.student_id}</td>
                        <td>{record.student_name || 'Unknown'}</td>
                        <td>{record.attendance}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <button
                  className="update-button"
                  onClick={downloadEventAttendanceAsCSV}
                  disabled={loading || !selectedViewEvent || eventAttendance.length === 0}
                >
                  Download as CSV
                </button>
              </>
            ) : (
              selectedViewEvent && <p>No attendance records found for this event.</p>
            )}
          </section>

          <section className="club-status-section">
            <h2 className="section-title">View Student Attendance</h2>
            <select
              className="advisor-select"
              value={selectedStudent}
              onChange={(e) => {
                const studentId = e.target.value;
                console.log('Selected student ID:', studentId);
                setSelectedStudent(studentId);
              }}
              disabled={loading}
            >
              <option value="">Select Student</option>
              {students.map(student => (
                <option key={student.student_id} value={student.student_id}>
                  {student.name || 'Unknown'} ({student.student_id})
                </option>
              ))}
            </select>
            {userAttendance.length > 0 ? (
              <table className="summary-table">
                <thead>
                  <tr>
                    <th>Student ID</th>
                    <th>Student Name</th>
                    <th>Event Name</th>
                    <th>Attendance</th>
                  </tr>
                </thead>
                <tbody>
                  {userAttendance.map(record => (
                    <tr key={record.att_id}>
                      <td>{record.student_id}</td>
                      <td>{record.student_name || 'Unknown'}</td>
                      <td>{record.event_name}</td>
                      <td>{record.attendance}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              selectedStudent && <p>No attendance records found for this student in the club.</p>
            )}
          </section>
        </>
      ) : null}
      <ToastContainer />
    </div>
  );
};

export default FacultyDashboard;