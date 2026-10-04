export const defaultTeachers = [
  { id: 't1', name: 'Mina', initials: 'M' },
  { id: 't2', name: 'Lovely', initials: 'L' },
  { id: 't3', name: 'Shahadat', initials: 'S' },
  { id: 't4', name: 'Ashim', initials: 'A' },
  { id: 't5', name: 'Lotif', initials: 'LT' },
  { id: 't6', name: 'Bishojit', initials: 'B' },
  { id: 't7', name: 'Salam', initials: 'SL' },
  { id: 't8', name: 'Moron', initials: 'M' },
  { id: 't9', name: 'Soma', initials: 'SM' },
  { id: 't10', name: 'Mehedi', initials: 'MH' },
  { id: 't11', name: 'Shahidul', initials: 'SD' },
];

export const defaultSubjects = [
  { id: 's1', name: 'Bangla 1st', shortName: 'Bangla 1', classGroup: 'Six' },
  { id: 's2', name: 'Bangla 2nd', shortName: 'Bangla 2', classGroup: 'Six' },
  { id: 's3', name: 'English 1st', shortName: 'Eng 1', classGroup: 'Six' },
  { id: 's4', name: 'English 2nd', shortName: 'Eng 2', classGroup: 'Six' },
  { id: 's5', name: 'Math', shortName: 'Math', classGroup: 'All' },
  { id: 's6', name: 'ICT', shortName: 'ICT', classGroup: 'All' },
  { id: 's7', name: 'Religion', shortName: 'Rel', classGroup: 'All' },
  { id: 's8', name: 'Hindu', shortName: 'Hindu', classGroup: 'All' },
  { id: 's9', name: 'Science', shortName: 'Sci', classGroup: 'All' },
  { id: 's10', name: 'Social Science', shortName: 'Soc', classGroup: 'All' },
  { id: 's11', name: 'Agriculture', shortName: 'Agri', classGroup: 'All' },
  { id: 's12', name: 'Higher Math', shortName: 'Higher Math', classGroup: 'Nine' },
  { id: 's13', name: 'History', shortName: 'History', classGroup: 'All' },
  { id: 's14', name: 'Physics', shortName: 'Physics', classGroup: 'All' },
  { id: 's15', name: 'Geography', shortName: 'Geo', classGroup: 'All' },
  { id: 's16', name: 'Chemistry', shortName: 'Chem', classGroup: 'All' },
  { id: 's17', name: 'Civic', shortName: 'Civic', classGroup: 'All' },
  { id: 's18', name: 'Biology', shortName: 'Bio', classGroup: 'All' },
];

export const defaultAssignments = [
  { id: 'a1', className: 'Six', teacherId: 't1', subjectId: 's1', periodCount: 4, section: 'A' },
  { id: 'a2', className: 'Six', teacherId: 't2', subjectId: 's3', periodCount: 5, section: 'A' },
  { id: 'a3', className: 'Six', teacherId: 't5', subjectId: 's5', periodCount: 4, section: 'A' },
  { id: 'a4', className: 'Seven', teacherId: 't3', subjectId: 's3', periodCount: 5, section: 'A' },
  { id: 'a5', className: 'Eight', teacherId: 't4', subjectId: 's6', periodCount: 4, section: 'A' },
  { id: 'a6', className: 'Nine', teacherId: 't6', subjectId: 's9', periodCount: 3, section: 'A' },
  { id: 'a7', className: 'Ten', teacherId: 't7', subjectId: 's10', periodCount: 3, section: 'A' },
];

export const defaultRoutineConfig = {
  days: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
  periodsPerDay: 6,
};