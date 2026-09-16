export interface Student {
  id: string;
  name: string;
  dob: string;
  course: string;
  emoji: string;
  photo: string;
}
export interface Brand {
  name: string;
  type: "music" | "company" | "school";
  logo: string;
  accent: string;
}
export interface Draft {
  templateId: string;
  studentId: string;
  heading: string;
  name: string;
  quote: string;
  autoQuote: boolean;
  quoteIndex?: number;
  font: "script" | "serif";
  format: "square" | "portrait";
  photo: string;
  emoji: string;
}
export interface SavedPoster {
  id: string;
  title: string;
  draft: Draft;
  brand: Brand;
  createdAt: string;
}
export interface Repository {
  students(): Promise<Student[]>;
  saveStudent(student: Student): Promise<Student>;
  deleteStudent(id: string): Promise<void>;
  brand(): Promise<Brand>;
  saveBrand(brand: Brand): Promise<void>;
  posters(): Promise<SavedPoster[]>;
  savePoster(poster: SavedPoster): Promise<void>;
  deletePoster(id: string): Promise<void>;
}
