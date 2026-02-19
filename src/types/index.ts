export type UserRole = "admin" | "student";
export type UserStatus = "pending" | "approved" | "rejected";
export type Difficulty = "beginner" | "intermediate" | "advanced";

export interface Profile {
    id: string;
    email: string;
    full_name: string | null;
    avatar_url: string | null;
    role: UserRole;
    status: UserStatus;
    bio: string | null;
    created_at: string;
    updated_at: string;
}

export interface Course {
    id: string;
    title: string;
    description: string;
    thumbnail_url: string | null;
    instructor_name: string;
    instructor_avatar: string | null;
    tags: string[];
    difficulty: Difficulty;
    is_published: boolean;
    is_featured: boolean;
    created_by: string;
    created_at: string;
    updated_at: string;
    modules?: Module[];
    enrollment?: Enrollment;
    _count?: {
        enrollments: number;
        modules: number;
        lessons: number;
    };
}

export interface Module {
    id: string;
    course_id: string;
    title: string;
    description: string | null;
    order_index: number;
    created_at: string;
    lessons?: Lesson[];
}

export interface Lesson {
    id: string;
    module_id: string;
    course_id: string;
    title: string;
    description: string | null;
    video_url: string;
    video_type: "google_drive" | "github" | "youtube" | "direct";
    notes: string | null;
    resources: Resource[];
    duration_seconds: number | null;
    order_index: number;
    created_at: string;
    progress?: LessonProgress;
}

export interface Resource {
    name: string;
    url: string;
    type: string;
}

export interface Enrollment {
    id: string;
    user_id: string;
    course_id: string;
    enrolled_at: string;
    completed_at: string | null;
    progress_percentage: number;
    certificate_issued: boolean;
}

export interface LessonProgress {
    id: string;
    user_id: string;
    lesson_id: string;
    course_id: string;
    watched_seconds: number;
    total_seconds: number;
    completed: boolean;
    last_watched_at: string;
}

export interface Announcement {
    id: string;
    title: string;
    content: string;
    is_active: boolean;
    created_by: string;
    created_at: string;
}

export interface DashboardStats {
    totalUsers: number;
    approvedUsers: number;
    pendingUsers: number;
    totalCourses: number;
    publishedCourses: number;
    totalEnrollments: number;
    totalLessons: number;
}
