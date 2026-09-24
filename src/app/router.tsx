import { createBrowserRouter } from 'react-router-dom'

import { ClassGroupsPage } from '@/features/admin/ClassGroupsPage'
import { StaffPage } from '@/features/admin/StaffPage'
import { StudentsPage } from '@/features/admin/StudentsPage'
import { AnalyticsPage } from '@/features/analytics/AnalyticsPage'
import { AcceptParentInvitationPage } from '@/features/auth/AcceptParentInvitationPage'
import { LoginPage } from '@/features/auth/LoginPage'
import { SetPasswordPage } from '@/features/auth/SetPasswordPage'
import { ScheduledTestsPage } from '@/features/calendar/ScheduledTestsPage'
import { SchoolCalendarPage } from '@/features/calendar/SchoolCalendarPage'
import { HomePage } from '@/features/home/HomePage'
import { ProfilePage } from '@/features/profile/ProfilePage'
import { LessonsPage } from '@/features/subjects/LessonsPage'
import { SubjectsPage } from '@/features/subjects/SubjectsPage'
import { TakeTestPage } from '@/features/tests/TakeTestPage'
import { RequireAuth, RequireRole } from '@/shared/auth/guards'

import { Layout } from './Layout'

export const router = createBrowserRouter([
  {
    path: '/',
    element: <Layout />,
    children: [
      { path: 'login', element: <LoginPage /> },
      { path: 'set-password', element: <SetPasswordPage /> },
      { path: 'parent-invitations/:token/accept', element: <AcceptParentInvitationPage /> },
      {
        index: true,
        element: (
          <RequireAuth>
            <HomePage />
          </RequireAuth>
        ),
      },
      {
        path: 'admin/students',
        element: (
          <RequireAuth>
            <RequireRole roles={['direktor']}>
              <StudentsPage />
            </RequireRole>
          </RequireAuth>
        ),
      },
      {
        path: 'admin/staff',
        element: (
          <RequireAuth>
            <RequireRole roles={['direktor']}>
              <StaffPage />
            </RequireRole>
          </RequireAuth>
        ),
      },
      {
        path: 'admin/class-groups',
        element: (
          <RequireAuth>
            <RequireRole roles={['direktor']}>
              <ClassGroupsPage />
            </RequireRole>
          </RequireAuth>
        ),
      },
      {
        path: 'subjects',
        element: (
          <RequireAuth>
            <SubjectsPage />
          </RequireAuth>
        ),
      },
      {
        path: 'subjects/:subjectId/lessons',
        element: (
          <RequireAuth>
            <LessonsPage />
          </RequireAuth>
        ),
      },
      {
        path: 'calendar',
        element: (
          <RequireAuth>
            <SchoolCalendarPage />
          </RequireAuth>
        ),
      },
      {
        path: 'scheduled-tests',
        element: (
          <RequireAuth>
            <ScheduledTestsPage />
          </RequireAuth>
        ),
      },
      {
        path: 'tests/:scheduledTestId',
        element: (
          <RequireAuth>
            <RequireRole roles={['ucenik']}>
              <TakeTestPage />
            </RequireRole>
          </RequireAuth>
        ),
      },
      {
        path: 'profile',
        element: (
          <RequireAuth>
            <RequireRole roles={['ucenik', 'roditelj']}>
              <ProfilePage />
            </RequireRole>
          </RequireAuth>
        ),
      },
      {
        path: 'analytics',
        element: (
          <RequireAuth>
            <RequireRole
              roles={['nastavnik', 'razredni_staresina', 'direktor', 'strucni_saradnik']}
            >
              <AnalyticsPage />
            </RequireRole>
          </RequireAuth>
        ),
      },
    ],
  },
])
