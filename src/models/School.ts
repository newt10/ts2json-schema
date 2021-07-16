import { StudentInterface } from './Student';
import { TeacherInterface } from './Teacher';

export interface SchoolInterface {
  student: StudentInterface;
  teacher: TeacherInterface;
}