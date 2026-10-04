import React, { useMemo, useState, useEffect } from 'react';
import * as XLSX from 'xlsx';
import html2pdf from 'html2pdf.js';
import { defaultTeachers, defaultSubjects, defaultAssignments, defaultRoutineConfig } from './data/defaultData';
import './styles.css';

const STORAGE_KEY = 'school-routine-manager-v1';

const makeId = () =>
  '_' + Math.random().toString(36).slice(2, 11);

const getInitialState = () => {
  const saved = localStorage.getItem(STORAGE_KEY);
  if (saved) {
    try {
      return JSON.parse(saved);
    } catch {
      // ignore parse error
    }
  }

  return {
    teachers: defaultTeachers,
    subjects: defaultSubjects,
    assignments: defaultAssignments,
    config: defaultRoutineConfig,
    tab: 'teachers',
    routine: [],
  };
};

const blankTeacher = () => ({ id: makeId(), name: '', initials: '' });
const blankSubject = () => ({ id: makeId(), name: '', shortName: '', classGroup: 'All' });
const blankAssignment = () => ({
  id: makeId(),
  className: 'Six',
  teacherId: '',
  subjectId: '',
  periodCount: 1,
  section: '',
});

const parseClassName = (value) => value?.trim() || 'Six';
const safeNumber = (v) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
};

function App() {
  const [state, setState] = useState(getInitialState);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }, [state]);

  const {
    teachers,
    subjects,
    assignments,
    config,
    tab,
    routine,
  } = state;

  const teacherMap = useMemo(
    () => Object.fromEntries(teachers.map((t) => [t.id, t])),
    [teachers]
  );

  const subjectMap = useMemo(
    () => Object.fromEntries(subjects.map((s) => [s.id, s])),
    [subjects]
  );

  const classNames = useMemo(() => {
    const list = [...new Set(assignments.map((a) => parseClassName(a.className)))];
    return list.length ? list : ['Six', 'Seven', 'Eight', 'Nine', 'Ten'];
  }, [assignments]);

  // Teachers Tab
  const addTeacher = () => {
    setState((prev) => ({
      ...prev,
      teachers: [...prev.teachers, blankTeacher()],
    }));
  };

  const updateTeacher = (id, field, value) => {
    setState((prev) => ({
      ...prev,
      teachers: prev.teachers.map((t) =>
        t.id === id ? { ...t, [field]: value } : t
      ),
    }));
  };

  const deleteTeacher = (id) => {
    setState((prev) => ({
      ...prev,
      teachers: prev.teachers.filter((t) => t.id !== id),
      assignments: prev.assignments.filter((a) => a.teacherId !== id),
    }));
  };

  // Subjects Tab
  const addSubject = () => {
    setState((prev) => ({
      ...prev,
      subjects: [...prev.subjects, blankSubject()],
    }));
  };

  const updateSubject = (id, field, value) => {
    setState((prev) => ({
      ...prev,
      subjects: prev.subjects.map((s) =>
        s.id === id ? { ...s, [field]: value } : s
      ),
    }));
  };

  const deleteSubject = (id) => {
    setState((prev) => ({
      ...prev,
      subjects: prev.subjects.filter((s) => s.id !== id),
      assignments: prev.assignments.filter((a) => a.subjectId !== id),
    }));
  };

  // Assignments Tab
  const addAssignment = () => {
    setState((prev) => ({
      ...prev,
      assignments: [...prev.assignments, blankAssignment()],
    }));
  };

  const updateAssignment = (id, field, value) => {
    setState((prev) => ({
      ...prev,
      assignments: prev.assignments.map((a) =>
        a.id === id ? { ...a, [field]: value } : a
      ),
    }));
  };

  const deleteAssignment = (id) => {
    setState((prev) => ({
      ...prev,
      assignments: prev.assignments.filter((a) => a.id !== id),
    }));
  };

  const setConfig = (field, value) => {
    setState((prev) => ({
      ...prev,
      config: { ...prev.config, [field]: value },
    }));
  };

  // Routine Generation Logic
  const generateRoutine = () => {
    const days = config.days || ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
    const periodsPerDay = safeNumber(config.periodsPerDay) || 6;
    const classOrder = classNames.length ? classNames : ['Six', 'Seven', 'Eight', 'Nine', 'Ten'];

    const schedule = {};
    const classMap = {};

    classOrder.forEach((cls) => {
      schedule[cls] = {};
      days.forEach((day) => {
        schedule[cls][day] = Array.from({ length: periodsPerDay }, () => null);
      });
    });

    const assignmentList = assignments.filter((a) => {
      const teacherExists = teachers.some((t) => t.id === a.teacherId);
      const subjectExists = subjects.some((s) => s.id === a.subjectId);
      return teacherExists && subjectExists;
    });

    if (!assignmentList.length) {
      setState((prev) => ({ ...prev, routine: [] }));
      return;
    }

    const teacherDayPeriods = {};
    const classDayPeriods = {};
    const subjectDayPeriods = {};

    const addBooking = (teacherId, className, subjectId, day, periodIndex) => {
      if (!teacherDayPeriods[teacherId]) teacherDayPeriods[teacherId] = {};
      if (!classDayPeriods[className]) classDayPeriods[className] = {};
      if (!subjectDayPeriods[subjectId]) subjectDayPeriods[subjectId] = {};

      teacherDayPeriods[teacherId][`${day}-${periodIndex}`] = true;
      classDayPeriods[className][`${day}-${periodIndex}`] = true;
      subjectDayPeriods[subjectId][`${day}-${periodIndex}`] = true;
    };

    assignmentList.forEach((assignment) => {
      const teacher = teacherMap[assignment.teacherId];
      const subject = subjectMap[assignment.subjectId];

      if (!teacher || !subject) return;

      const className = parseClassName(assignment.className);
      const totalPeriods = safeNumber(assignment.periodCount) || 1;
      const lessonSlots = [];

      days.forEach((day) => {
        for (let i = 0; i < periodsPerDay; i++) {
          const key = `${day}-${i}`;
          if (
            !teacherDayPeriods[teacher.id]?.[key] &&
            !classDayPeriods[className]?.[key] &&
            !subjectDayPeriods[subject.id]?.[key]
          ) {
            lessonSlots.push({ day, periodIndex: i });
          }
        }
      });

      let filled = 0;
      let attempt = 0;

      while (filled < totalPeriods && attempt < 300) {
        const slot = lessonSlots.shift();

        if (!slot) break;

        const { day, periodIndex } = slot;
        const key = `${day}-${periodIndex}`;

        if (
          teacherDayPeriods[teacher.id]?.[key] ||
          classDayPeriods[className]?.[key] ||
          subjectDayPeriods[subject.id]?.[key]
        ) {
          attempt++;
          continue;
        }

        schedule[className][day][periodIndex] = {
          teacherName: teacher.name,
          subjectName: subject.name,
          shortName: subject.shortName || subject.name,
          subjectId: subject.id,
          teacherId: teacher.id,
          className,
        };

        addBooking(teacher.id, className, subject.id, day, periodIndex);
        filled++;
        attempt = 0;
      }
    });

    const generated = [];

    classOrder.forEach((cls) => {
      days.forEach((day) => {
        const periods = schedule[cls][day];
        periods.forEach((cell, index) => {
          if (cell) {
            generated.push({
              className: cls,
              day,
              period: index + 1,
              teacherName: cell.teacherName,
              subjectName: cell.subjectName,
              shortName: cell.shortName,
            });
          }
        });
      });
    });

    setState((prev) => ({ ...prev, routine: generated }));
  };

  // Export Functions
  const exportExcel = () => {
    const rows = [];

    classNames.forEach((cls) => {
      const row = { 'Class': cls };
      config.days.forEach((day) => {
        const dayCells = routine.filter((item) => item.className === cls && item.day === day);
        const cellText = dayCells.map((item) => `${item.shortName || item.subjectName} (${item.teacherName})`).join(' | ');
        row[day] = cellText;
      });
      rows.push(row);
    });

    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Routine');
    XLSX.writeFile(wb, `school_routine_${new Date().getTime()}.xlsx`);
  };

  const exportPdf = () => {
    const element = document.getElementById('routine-table');
    const opt = {
      margin: 0.3,
      filename: `school_routine_${new Date().getTime()}.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2 },
      jsPDF: { unit: 'in', format: 'a4', orientation: 'landscape' },
    };
    html2pdf().set(opt).from(element).save();
  };

  const printRoutine = () => {
    window.print();
  };

  return (
    <div className="app">
      <header className="topbar">
        <h1>📚 School Routine Manager</h1>
        <div className="tabs">
          <button
            className={tab === 'teachers' ? 'active' : ''}
            onClick={() => setState((p) => ({ ...p, tab: 'teachers' }))}
          >
            শিক্ষক তালিকা
          </button>
          <button
            className={tab === 'subjects' ? 'active' : ''}
            onClick={() => setState((p) => ({ ...p, tab: 'subjects' }))}
          >
            বিষয় সমূহ
          </button>
          <button
            className={tab === 'assignments' ? 'active' : ''}
            onClick={() => setState((p) => ({ ...p, tab: 'assignments' }))}
          >
            অ্যাসাইন
          </button>
          <button
            className={tab === 'generator' ? 'active' : ''}
            onClick={() => setState((p) => ({ ...p, tab: 'generator' }))}
          >
            রুটিন তৈরি
          </button>
          <button
            className={tab === 'print' ? 'active' : ''}
            onClick={() => setState((p) => ({ ...p, tab: 'print' }))}
          >
            প্রিন্ট/ডাউনলোড
          </button>
        </div>
      </header>

      <main className="content">
        {tab === 'teachers' && (
          <section className="panel">
            <div className="panel-header">
              <h2>শিক্ষক তালিকা (ইডিটাবল)</h2>
              <button onClick={addTeacher}>+ শিক্ষক যোগ করুন</button>
            </div>

            <div className="table">
              <div className="row header">
                <span>নাম</span>
                <span>সংক্ষিপ্ত নাম</span>
                <span>অ্যাকশন</span>
              </div>

              {teachers.map((teacher) => (
                <div className="row" key={teacher.id}>
                  <input
                    value={teacher.name}
                    onChange={(e) => updateTeacher(teacher.id, 'name', e.target.value)}
                    placeholder="শিক্ষকের নাম লিখুন"
                  />
                  <input
                    value={teacher.initials}
                    onChange={(e) => updateTeacher(teacher.id, 'initials', e.target.value)}
                    placeholder="সংক্ষিপ্ত নাম"
                  />
                  <button className="danger" onClick={() => deleteTeacher(teacher.id)}>ডিলিট</button>
                </div>
              ))}
            </div>
          </section>
        )}

        {tab === 'subjects' && (
          <section className="panel">
            <div className="panel-header">
              <h2>বিষয় সমূহ (ইডিটাবল)</h2>
              <button onClick={addSubject}>+ বিষয় যোগ করুন</button>
            </div>

            <div className="table">
              <div className="row header">
                <span>বিষয়ের নাম</span>
                <span>সংক্ষিপ্ত নাম</span>
                <span>ক্লাস গ্রুপ</span>
                <span>অ্যাকশন</span>
              </div>

              {subjects.map((subject) => (
                <div className="row" key={subject.id}>
                  <input
                    value={subject.name}
                    onChange={(e) => updateSubject(subject.id, 'name', e.target.value)}
                    placeholder="বিষয়ের নাম লিখুন"
                  />
                  <input
                    value={subject.shortName}
                    onChange={(e) => updateSubject(subject.id, 'shortName', e.target.value)}
                    placeholder="সংক্ষিপ্ত নাম"
                  />
                  <input
                    value={subject.classGroup}
                    onChange={(e) => updateSubject(subject.id, 'classGroup', e.target.value)}
                    placeholder="ক্লাস গ্রুপ"
                  />
                  <button className="danger" onClick={() => deleteSubject(subject.id)}>ডিলিট</button>
                </div>
              ))}
            </div>
          </section>
        )}

        {tab === 'assignments' && (
          <section className="panel">
            <div className="panel-header">
              <h2>অ্যাসাইন (ক্লাস - শিক্ষক - বিষয় ম্যাপিং)</h2>
              <button onClick={addAssignment}>+ অ্যাসাইন যোগ করুন</button>
            </div>

            <div className="table assign-table">
              <div className="row header">
                <span>ক্লাস</span>
                <span>শিক্ষক</span>
                <span>বিষয়</span>
                <span>পিরিয়ড</span>
                <span>সেকশন</span>
                <span>অ্যাকশন</span>
              </div>

              {assignments.map((assignment) => (
                <div className="row" key={assignment.id}>
                  <select
                    value={assignment.className}
                    onChange={(e) => updateAssignment(assignment.id, 'className', e.target.value)}
                  >
                    {classNames.map((cls) => (
                      <option key={cls} value={cls}>{cls}</option>
                    ))}
                  </select>

                  <select
                    value={assignment.teacherId}
                    onChange={(e) => updateAssignment(assignment.id, 'teacherId', e.target.value)}
                  >
                    <option value="">শিক্ষক নির্বাচন করুন</option>
                    {teachers.map((teacher) => (
                      <option key={teacher.id} value={teacher.id}>{teacher.name}</option>
                    ))}
                  </select>

                  <select
                    value={assignment.subjectId}
                    onChange={(e) => updateAssignment(assignment.id, 'subjectId', e.target.value)}
                  >
                    <option value="">বিষয় নির্বাচন করুন</option>
                    {subjects.map((subject) => (
                      <option key={subject.id} value={subject.id}>{subject.name}</option>
                    ))}
                  </select>

                  <input
                    type="number"
                    min="1"
                    value={assignment.periodCount}
                    onChange={(e) => updateAssignment(assignment.id, 'periodCount', e.target.value)}
                  />

                  <input
                    value={assignment.section || ''}
                    onChange={(e) => updateAssignment(assignment.id, 'section', e.target.value)}
                    placeholder="সেকশন"
                  />

                  <button className="danger" onClick={() => deleteAssignment(assignment.id)}>ডিলিট</button>
                </div>
              ))}
            </div>
          </section>
        )}

        {tab === 'generator' && (
          <section className="panel">
            <div className="panel-header">
              <h2>রুটিন জেনারেটর সেটিংস</h2>
              <button onClick={generateRoutine}>🔄 রুটিন তৈরি করুন</button>
            </div>

            <div className="generator-grid">
              <label>
                সপ্তাহের দিনগুলো
                <input
                  value={config.days?.join(', ') || ''}
                  onChange={(e) =>
                    setConfig('days', e.target.value.split(',').map((x) => x.trim()).filter(Boolean))
                  }
                  placeholder="Monday, Tuesday, Wednesday..."
                />
              </label>

              <label>
                প্রতিদিন পিরিয়ড সংখ্যা
                <input
                  type="number"
                  min="1"
                  value={config.periodsPerDay || 6}
                  onChange={(e) => setConfig('periodsPerDay', Number(e.target.value))}
                />
              </label>
            </div>

            {routine.length > 0 && (
              <div className="routine-preview">
                <h3>তৈরিকৃত রুটিন</h3>
                <div id="routine-table" className="routine-table">
                  <table>
                    <thead>
                      <tr>
                        <th>ক্লাস</th>
                        <th>দিন</th>
                        <th>পিরিয়ড</th>
                        <th>বিষয়</th>
                        <th>শিক্ষক</th>
                      </tr>
                    </thead>
                    <tbody>
                      {routine.map((item, idx) => (
                        <tr key={`${item.className}-${item.day}-${item.period}-${idx}`}>
                          <td>{item.className}</td>
                          <td>{item.day}</td>
                          <td>{item.period}</td>
                          <td>{item.subjectName}</td>
                          <td>{item.teacherName}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </section>
        )}

        {tab === 'print' && (
          <section className="panel">
            <div className="panel-header">
              <h2>প্রিন্ট / ডাউনলোড</h2>
            </div>

            <div className="download-actions">
              <button onClick={exportExcel}>📊 এক্সেল ডাউনলোড করুন</button>
              <button onClick={exportPdf}>📄 PDF ডাউনলোড করুন</button>
              <button onClick={printRoutine}>🖨️ প্রিন্ট করুন</button>
            </div>

            {routine.length > 0 && (
              <div id="routine-table" className="routine-table print-table">
                <table>
                  <thead>
                    <tr>
                      <th>ক্লাস</th>
                      <th>দিন</th>
                      <th>পিরিয়ড</th>
                      <th>বিষয়</th>
                      <th>শিক্ষক</th>
                    </tr>
                  </thead>
                  <tbody>
                    {routine.map((item, idx) => (
                      <tr key={`${item.className}-${item.day}-${item.period}-${idx}`}>
                        <td>{item.className}</td>
                        <td>{item.day}</td>
                        <td>{item.period}</td>
                        <td>{item.subjectName}</td>
                        <td>{item.teacherName}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        )}
      </main>
    </div>
  );
}

export default App;