
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
        created_by: "admin",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        _count: { enrollments: 120, modules: 10, lessons: 45 }
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
        created_by: "admin",
        created_at: new Date(Date.now() - 86400000).toISOString(),
        updated_at: new Date().toISOString(),
        _count: { enrollments: 85, modules: 8, lessons: 32 }
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
        created_by: "admin",
        created_at: new Date(Date.now() - 172800000).toISOString(),
        updated_at: new Date().toISOString(),
        _count: { enrollments: 200, modules: 12, lessons: 50 }
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
        lessons: [
            {
                id: "les-1",
                module_id: "mod-1",
                course_id: "course-1",
                title: "Welcome to the Course",
                description: "Overview of what we will learn",
                video_url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
                video_type: "youtube",
                duration_seconds: 120,
                order_index: 0,
                created_at: new Date().toISOString(),
                notes: "Welcome!",
                resources: [],
                completed: false
            }
        ]
    }
];
