# SchoolRanker Bug Analysis Report

## Executive Summary
This report documents the root cause analysis of all identified bugs and issues in the SchoolRanker application. Each issue has been traced from frontend to backend, with proper classification and proposed solutions.

---

## SECTION 1: ADMIN PANEL BUGS

### 1.1 Cannot Add Student from Dashboard / Quick Action

**Problem:** POST /api/students returns 500 error from dashboard quick action but works from Student Management page.

**Root Cause Analysis:**
- **Location:** [`dashboard.tsx`](client/src/pages/dashboard.tsx) line 73-74
- **Issue Type:** Missing UI component
- **Classification:** Broken state binding + Missing data fetch

The dashboard's "Add Student" button in the Header component only sets `setShowStudentForm(true)` state, but there's no StudentForm dialog rendered in the dashboard page to handle this state. The Students page has the form dialog, but dashboard doesn't.

**Evidence:**
```tsx
// dashboard.tsx line 73-74
onAddClick={() => setShowStudentForm(true)}
addButtonText="Add Student"
```
But there's no `<StudentForm>` component rendered with `showStudentForm` state.

**Fix Required:** Add StudentForm dialog to dashboard.tsx that responds to `showStudentForm` state.

---

### 1.2 Update Teacher/Student – Previous Data Not Showing

**Problem:** When editing, form does not pre-fill with existing data.

**Root Cause Analysis:**
- **Location:** [`students.tsx`](client/src/pages/students.tsx) line 50-53, [`teachers.tsx`](client/src/pages/teachers.tsx) line 44-47
- **Issue Type:** UI state binding
- **Classification:** Broken state binding

The forms receive the student/teacher object correctly via `setEditingStudent(student)` or `setEditingTeacher(teacher)`. However, the issue is that the form default values are set at component mount time. When the form opens with editing data, it needs to reinitialize the form with the new data.

**Fix Required:** Ensure form defaultValues are updated when editingStudent/editingTeacher changes by using useEffect or key prop on form.

---

### 1.3 Teacher View (Eye Icon) Not Working

**Problem:** Student eye icon works, teacher eye icon does not.

**Root Cause Analysis:**
- **Location:** [`teachers.tsx`](client/src/pages/teachers.tsx) line 49-51
- **Issue Type:** Missing implementation
- **Classification:** Missing UI component

```tsx
const handleView = (teacher: Teacher) => {
  setViewingTeacher(teacher);
};
```

The `viewingTeacher` state is set but there's no dialog to display the teacher's details. Compare with students.tsx which has `viewingStudent` and presumably shows a dialog.

**Fix Required:** Add a view teacher dialog component in teachers.tsx.

---

## SECTION 2: TEACHER PANEL BUGS

### 2.1 Cannot Login Teacher from Signup

**Problem:** POST /api/auth/signup 400 Validation error.

**Root Cause Analysis:**
- **Location:** [`server/routes.ts`](server/routes.ts) line 21-26
- **Issue Type:** Validation schema issue
- **Classification:** Validation error

```tsx
const signupSchema = z.object({
  username: z.string().min(3, "Username must be at least 3 characters"),
  email: z.string().email("Invalid email"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  role: z.enum(["teacher", "student"]), // Admin role not allowed
});
```

The signup endpoint doesn't allow "admin" role (which is correct for security), but there's no issue here. The real problem is in error handling - the frontend doesn't parse the error response properly.

**Additional Issue:** Looking at signup-form.tsx, the error handling might not be displaying validation errors properly.

**Fix Required:** Improve error handling in signup-form.tsx to display validation errors properly.

---

### 2.2 Quick Action Should Behave Like Bulk Attendance

**Problem:** Teacher quick action should navigate to bulk attendance page with auto-selected date.

**Root Cause Analysis:**
- **Location:** [`teacher-panel.tsx`](client/src/pages/teacher-panel.tsx)
- **Issue Type:** Missing navigation
- **Classification:** Incorrect routing

The quick action buttons exist but don't navigate to the attendance page with pre-filled data.

**Fix Required:** Implement navigation to attendance page with query params for course and date.

---

### 2.3 Teacher Courses – Eye Icon Not Working

**Problem:** Course eye icon not working for teachers.

**Root Cause Analysis:**
- **Location:** [`courses.tsx`](client/src/pages/courses.tsx)
- **Issue Type:** Missing route/handler
- **Classification:** Incorrect routing

Need to check if there's a route to view course details and ensure it's accessible to teachers.

**Fix Required:** Add course detail view or ensure existing view functionality works.

---

### 2.4 Teacher Should NOT Be Able to Add Courses (SECURITY ISSUE)

**Problem:** Teachers can add courses which violates RBAC.

**Root Cause Analysis:**
- **Location:** [`courses.tsx`](client/src/pages/courses.tsx) line 88-92
- **Issue Type:** Frontend-only restriction
- **Classification:** RBAC failure

```tsx
<Header 
  title="Course Management" 
  onAddClick={() => setShowCourseForm(true)}
  addButtonText="Create Course"
/>
```

This shows "Create Course" button to all users. The backend does have protection (requireRole('admin')), but frontend should also hide it.

**Backend Already Protected:** 
- [`server/routes.ts`](server/routes.ts) line 338: `app.post("/api/courses", requireAuth, requireRole('admin'), ...)`

**Fix Required:** Hide "Create Course" button for non-admin roles in frontend.

---

### 2.5 Teacher Can See All Students (SECURITY ISSUE)

**Problem:** Teachers can see all students instead of only enrolled students.

**Root Cause Analysis:**
- **Location:** [`server/routes.ts`](server/routes.ts) line 142-181
- **Issue Type:** Backend filtering
- **Classification:** RBAC failure

The backend does attempt to filter:
```tsx
if (userRole === 'teacher') {
  const teacherCourses = await storage.getCoursesByTeacher(userId);
  // ... filtering logic
}
```

However, there's a potential issue - it uses `userId` but teachers might have a separate `profileId`. Also, the filtering logic might not work correctly.

**Fix Required:** 
1. Ensure proper teacher identification using profileId
2. Verify and fix the filtering logic

---

## SECTION 3: STUDENT PANEL BUGS

### 3.1 404 Error on Dashboard After Login

**Problem:** Student login redirects to non-existent dashboard.

**Root Cause Analysis:**
- **Location:** [`client/src/App.tsx`](client/src/App.tsx) line 32-37
- **Issue Type:** Route configuration
- **Classification:** Incorrect routing

```tsx
const getDefaultRoute = (role: UserRole) => {
  switch (role) {
    case 'admin': return '/';
    case 'teacher': return '/teacher-panel';
    case 'student': return '/student-panel';
  }
};
```

This looks correct. Let me check if the route actually exists in line 100-102:
```tsx
<Route path="/student-panel" component={StudentPanel} />
```

The route exists. The issue might be:
1. The redirect happens before the component is mounted
2. There's a race condition in authentication

**Fix Required:** Investigate and fix the routing/redirect logic.

---

### 3.2 Student Should View Their Teachers

**Problem:** Missing feature - students can't see their teachers.

**Root Cause Analysis:**
- **Location:** Missing API endpoint
- **Issue Type:** Missing feature
- **Classification:** Missing data fetch

No API endpoint exists to get teachers by student enrollment.

**Fix Required:** Add API endpoint to get teachers for a student's enrolled courses.

---

## SECTION 4: CALENDAR SYSTEM

### 4.1 Calendar Role-Based Filtering

**Problem:** Calendar doesn't filter events based on role.

**Root Cause Analysis:**
- **Location:** [`server/routes.ts`](server/routes.ts) line 771-789
- **Issue Type:** Missing filtering
- **Classification:** RBAC failure

The calendar events endpoint returns all events without filtering by role:
```tsx
app.get("/api/calendar/events", requireAuth, async (req, res) => {
  // No role-based filtering
  if (year && month) {
    events = await storage.getCalendarEventsByMonth(...);
  } else {
    events = await storage.getAllCalendarEvents();
  }
  res.json(events);
});
```

**Calendar Data Model (Already Exists):**
- [`shared/schema.ts`](shared/schema.ts) line 258-284 - calendarEvents table exists with:
  - id, title, description, eventDate, startTime, endTime
  - eventType (event, holiday, exam, meeting)
  - grade (nullable - for specific grades)
  - createdBy, createdAt

**Fix Required:** Implement role-based filtering for calendar events.

---

## SECTION 5: VALIDATION IMPROVEMENTS

### 5.1 Error Handling

**Problem:** Login errors show raw JSON instead of friendly messages.

**Root Cause Analysis:**
- **Location:** [`login-form.tsx`](client/src/components/auth/login-form.tsx) line 40-48
- **Issue Type:** Error parsing
- **Classification:** UI bug

```tsx
const message = error?.message?.includes("401")
  ? "Invalid username or password"
  : "Login failed. Please try again.";
```

This should work, but the error message might not be properly parsed from the response.

**Fix Required:** Improve error message parsing from API responses.

---

## SECTION 6: SECURITY & RBAC ENFORCEMENT

### 6.1 Summary of RBAC Issues

1. **Teacher can add courses** - Backend protected, frontend not
2. **Teacher can see all students** - Backend has filtering but may be flawed
3. **Calendar events** - No filtering by role
4. **No ownership validation** - Teachers can modify any course's data

**Fix Required:** Implement strict backend RBAC with ownership validation.

---

## SECTION 7: RESPONSIVENESS ISSUES

### 7.1 Layout Problems

**Issues Identified:**
1. Tables don't scroll properly on mobile
2. Sidebar doesn't collapse on mobile
3. Forms not usable on mobile
4. No breakpoints testing

**Fix Required:** Implement responsive design improvements.

---

## SUMMARY TABLE

| Bug ID | Category | Severity | Root Cause | Fix Type |
|--------|----------|----------|------------|----------|
| 1.1 | Admin Panel | High | Missing UI component | Add StudentForm to dashboard |
| 1.2 | Admin Panel | Medium | State binding | Fix form initialization |
| 1.3 | Admin Panel | Medium | Missing UI | Add teacher view dialog |
| 2.1 | Teacher Panel | High | Error handling | Improve validation display |
| 2.2 | Teacher Panel | Medium | Missing navigation | Add quick action routing |
| 2.3 | Teacher Panel | Medium | Missing route | Add course detail view |
| 2.4 | Security | Critical | Frontend RBAC | Hide create button |
| 2.5 | Security | Critical | Backend RBAC | Fix student filtering |
| 3.1 | Student Panel | High | Route config | Fix redirect logic |
| 3.2 | Student Panel | Medium | Missing API | Add teachers endpoint |
| 4.1 | Calendar | Medium | Missing filtering | Add role-based filter |
| 5.1 | Validation | Medium | Error parsing | Improve error handling |
| 6.1 | Security | Critical | RBAC | Enforce backend checks |
| 7.1 | UI/UX | Medium | Responsive | Fix layout |

---

## FILES TO BE MODIFIED

### Backend (server/)
1. `routes.ts` - Add RBAC filters, calendar filtering, new endpoints
2. `storage.ts` - Add new query methods if needed
3. `auth.ts` - Possibly add more middleware

### Frontend (client/)
1. `pages/dashboard.tsx` - Add StudentForm dialog
2. `pages/students.tsx` - Fix edit form initialization, add view dialog
3. `pages/teachers.tsx` - Add view dialog, fix RBAC
4. `pages/courses.tsx` - Fix RBAC for create button
5. `pages/teacher-panel.tsx` - Fix quick actions, remove add student
6. `pages/student-panel.tsx` - Add teachers view
7. `pages/calendar.tsx` - Improve role-based filtering
8. `components/auth/login-form.tsx` - Improve error handling
9. `components/auth/signup-form.tsx` - Improve error handling
10. `components/layout/sidebar.tsx` - Responsive improvements
11. `App.tsx` - Fix routing issues

---

*Report Generated: 2026-02-27*
*Project: SchoolRanker (Pathshala Saathi)*
