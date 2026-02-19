
// Basic mock implementation for Supabase client
// Used when environment variables are missing to allow the UI to function.

const ADMIN_ID = "00000000-0000-0000-0000-000000000001";
const STUDENT_ID = "00000000-0000-0000-0000-000000000002";

// --- Mock Data ---

export const MOCK_USERS = [
    {
        id: ADMIN_ID,
        aud: "authenticated",
        role: "authenticated",
        email: "admin@luxaar.com",
        email_confirmed_at: new Date().toISOString(),
        created_at: new Date().toISOString(),
        last_sign_in_at: new Date().toISOString(),
        app_metadata: { provider: "email", providers: ["email"] },
        user_metadata: {},
        identities: [],
        phone: "",
    },
    {
        id: STUDENT_ID,
        aud: "authenticated",
        role: "authenticated",
        email: "student@luxaar.com",
        email_confirmed_at: new Date().toISOString(),
        created_at: new Date().toISOString(),
        last_sign_in_at: new Date().toISOString(),
        app_metadata: { provider: "email", providers: ["email"] },
        user_metadata: {},
        identities: [],
        phone: "",
    }
];

export const MOCK_PROFILES = [
    {
        id: ADMIN_ID,
        email: "admin@luxaar.com",
        full_name: "Admin User",
        role: "admin",
        status: "approved",
        avatar_url: null,
        bio: "System Administrator",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
    },
    {
        id: STUDENT_ID,
        email: "student@luxaar.com",
        full_name: "Student User",
        role: "student",
        status: "approved",
        avatar_url: null,
        bio: "Eager Learner",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
    }
];

export const MOCK_COURSES = [
    {
        id: "course-1",
        title: "Complete Web Development Bootcamp",
        description: "Learn web development from scratch with this comprehensive course covering HTML, CSS, JavaScript, React, and more.",
        thumbnail_url: "https://images.unsplash.com/photo-1593720213428-28a5b9e94613?q=80&w=2070&auto=format&fit=crop",
        instructor_name: "John Doe",
        tags: ["Web Dev", "React", "JavaScript"],
        difficulty: "beginner",
        is_published: true,
        is_featured: true,
        created_by: ADMIN_ID,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
    },
    {
        id: "course-2",
        title: "Advanced React Patterns",
        description: "Master advanced React patterns and best practices for building scalable applications.",
        thumbnail_url: "https://images.unsplash.com/photo-1633356122544-f134324a6cee?q=80&w=2070&auto=format&fit=crop",
        instructor_name: "Jane Smith",
        tags: ["React", "Advanced"],
        difficulty: "advanced",
        is_published: true,
        is_featured: false,
        created_by: ADMIN_ID,
        created_at: new Date(Date.now() - 86400000).toISOString(),
        updated_at: new Date().toISOString(),
    },
    {
        id: "course-3",
        title: "UI/UX Design Fundamentals",
        description: "Learn the principles of beautiful and functional user interface design.",
        thumbnail_url: "https://images.unsplash.com/photo-1586717791821-3f44a5638d48?q=80&w=2070&auto=format&fit=crop",
        instructor_name: "Sarah Lee",
        tags: ["Design", "Figma", "UI/UX"],
        difficulty: "beginner",
        is_published: true,
        is_featured: true,
        created_by: ADMIN_ID,
        created_at: new Date(Date.now() - 172800000).toISOString(),
        updated_at: new Date().toISOString(),
    }
];

export const MOCK_MODULES = [
    {
        id: "mod-1",
        course_id: "course-1",
        title: "Introduction",
        description: "Getting started with the course",
        order_index: 0,
        created_at: new Date().toISOString(),
    },
    {
        id: "mod-2",
        course_id: "course-1",
        title: "HTML Basics",
        description: "The structure of the web",
        order_index: 1,
        created_at: new Date().toISOString(),
    }
];

export const MOCK_LESSONS = [
    {
        id: "les-1",
        course_id: "course-1",
        module_id: "mod-1",
        title: "Welcome to the Course",
        description: "Overview of what we will learn",
        video_url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
        video_type: "youtube",
        duration_seconds: 120,
        order_index: 0,
        created_at: new Date().toISOString(),
        notes: "Welcome!",
        resources: []
    }
];

export const MOCK_ENROLLMENTS = [
    {
        id: "enr-1",
        user_id: STUDENT_ID,
        course_id: "course-1",
        enrolled_at: new Date().toISOString(),
        progress_percentage: 10,
        completed_at: null,
        certificate_issued: false
    }
];

// --- Mock Client ---

class MockPostgrestBuilder {
    data: any[];
    error: any;
    count: number | null;
    isSingle: boolean;

    constructor(initialData: any[]) {
        this.data = initialData;
        this.error = null;
        this.count = null;
        this.isSingle = false;
    }

    select(query = "*", { count = null, head = false } = {}) {
        if (count === "exact") {
            this.count = this.data.length;
        }
        if (head) {
            this.data = [];
        }
        return this;
    }

    eq(column: string, value: any) {
        this.data = this.data.filter(item => item[column] === value);
        if (this.count !== null) this.count = this.data.length;
        return this;
    }

    order(column: string, { ascending = true } = {}) {
        this.data.sort((a, b) => {
            if (a[column] < b[column]) return ascending ? -1 : 1;
            if (a[column] > b[column]) return ascending ? 1 : -1;
            return 0;
        });
        return this;
    }

    limit(limit: number) {
        this.data = this.data.slice(0, limit);
        return this;
    }

    single() {
        this.isSingle = true;
        return this; // In real client this returns a promise, but we handle in .then()
    }

    insert(record: any) {
        // Mock insert
        const newRecord = { ...record, id: `mock-${Date.now()}`, created_at: new Date().toISOString() };
        this.data = [newRecord];
        this.isSingle = true;
        return this;
    }

    update(record: any) {
        // Mock update - we can't easily update the source array here without more complex logic,
        // but for the purpose of "not crashing", returning success is enough.
        this.data = [record]; // wildly simplified
        return this;
    }

    delete() {
        this.data = [];
        return this;
    }

    // This makes the builder awaitable
    then(resolve: any, reject: any) {
        if (this.isSingle) {
            const item = this.data.length > 0 ? this.data[0] : null;
            // logic for single: if no item, usually returns error encoded string, but for mock user ease:
            resolve({ data: item, error: null, count: this.count });
        } else {
            resolve({ data: this.data, error: this.error, count: this.count });
        }
    }
}

export const createMockClient = () => {
    console.warn("⚠️  USING MOCK SUPABASE CLIENT  ⚠️");

    return {
        from: (table: string) => {
            let data: any[] = [];
            switch (table) {
                case "profiles": data = [...MOCK_PROFILES]; break;
                case "courses": data = [...MOCK_COURSES]; break;
                case "modules": data = [...MOCK_MODULES]; break;
                case "lessons": data = [...MOCK_LESSONS]; break;
                case "enrollments":
                    // Join logic is hard to mock generically, so we pre-populate for specific known queries
                    data = MOCK_ENROLLMENTS.map(e => ({
                        ...e,
                        course: MOCK_COURSES.find(c => c.id === e.course_id)
                    }));
                    break;
                default: data = [];
            }
            return new MockPostgrestBuilder(data);
        },
        auth: {
            getUser: async () => {
                // Return the admin user by default for development
                return { data: { user: MOCK_USERS[0] }, error: null };
            },
            signInWithPassword: async () => ({ data: { user: MOCK_USERS[0] }, error: null }),
            signInWithOAuth: async () => ({ data: { url: "http://localhost:3000/auth/callback" }, error: null }),
            signOut: async () => ({ error: null }),
            onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => { } } } }),
        }
    } as any;
};
