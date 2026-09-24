import { createBrowserRouter } from 'react-router-dom'

import { ClassGroupsPage } from '@/features/admin/ClassGroupsPage'
import { ParentInvitationsPage } from '@/features/admin/ParentInvitationsPage'
import { UsersPage } from '@/features/admin/UsersPage'
import { AcceptParentInvitationPage } from '@/features/auth/AcceptParentInvitationPage'
import { LoginPage } from '@/features/auth/LoginPage'
import { SetPasswordPage } from '@/features/auth/SetPasswordPage'
import { HomePage } from '@/features/home/HomePage'
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
        path: 'admin/users',
        element: (
          <RequireAuth>
            <RequireRole roles={['direktor']}>
              <UsersPage />
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
        path: 'admin/parent-invitations',
        element: (
          <RequireAuth>
            <RequireRole roles={['direktor', 'razredni_staresina']}>
              <ParentInvitationsPage />
            </RequireRole>
          </RequireAuth>
        ),
      },
    ],
  },
])
